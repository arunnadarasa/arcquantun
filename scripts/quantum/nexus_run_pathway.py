"""Promote msk-physio (did-not-attend risk) to a live Nexus job.

Order of work, and it is not negotiable:

  1. cohort fixed from a committed seed
  2. CLASSICAL FLOOR computed and printed FIRST, on the same data
  3. quantum kernel entries measured on H2-Emulator, one batched job
  4. two verdicts recorded separately — mechanism (did the circuit do what it
     was supposed to) and performance (did it beat the floor)

A floor computed after a quantum result is a rationalisation. It is computed here
before a single circuit is uploaded.

Kernel entries use the compute-uncompute overlap: p(all zeros) of U(y)^dag U(x)|0>
equals |<phi(x)|phi(y)>|^2 — 9 qubits, no SWAP test, no ancilla.

    QNEXUS_TOKEN=... PYTHONPATH=.pydeps python3 scripts/quantum/nexus_run_pathway.py
"""

from __future__ import annotations

import json
import pathlib
import sys
from datetime import datetime, timezone

import numpy as np

sys.path.insert(0, "/dev-server/scripts/quantum")

from pytket import Circuit  # noqa: E402

from circuit_families import FAMILIES, overlap_circuit  # noqa: E402
from nexus_common import Ledger, envelope, preflight, run_batch  # noqa: E402

COST = json.loads(pathlib.Path("/dev-server/src/data/nexus-cost.json").read_text())
FAMILY = COST["chosen"]  # chosen on the committed cost/score table, not on taste

OUT = pathlib.Path("/dev-server/src/data/nexus-live.json")
PATHWAY = "msk-physio"
SEED = 20260910
NQ = 6
SHOTS = 256
N_TRAIN = 6
N_TEST = 4
BUDGET_HQC = 1200.0


def cohort(rng: np.random.Generator):
    """Synthetic DNA-risk cohort. Synthetic, and labelled as such everywhere."""
    n = N_TRAIN + N_TEST
    y = np.array([0, 1] * (n // 2))
    x = rng.normal(0, 1, size=(n, NQ))
    # A weak, genuinely learnable signal — not a giveaway.
    x[:, 0] += 0.9 * y
    x[:, 2] += 0.6 * y
    x[:, 4] -= 0.5 * y
    x = (x - x.mean(0)) / (x.std(0) + 1e-9)
    # Stratified split: a held-out set that lost a class scores NaN, not a result.
    pos = rng.permutation(np.flatnonzero(y == 1))
    neg = rng.permutation(np.flatnonzero(y == 0))
    half = N_TEST // 2
    te = np.concatenate([pos[:half], neg[:half]])
    tr = np.concatenate([pos[half:], neg[half:]])
    te, tr = rng.permutation(te), rng.permutation(tr)
    return x[tr], y[tr], x[te], y[te]


def auroc(y: np.ndarray, s: np.ndarray) -> float:
    pos, neg = s[y == 1], s[y == 0]
    if len(pos) == 0 or len(neg) == 0:
        return float("nan")
    wins = (pos[:, None] > neg[None, :]).sum() + 0.5 * (pos[:, None] == neg[None, :]).sum()
    return float(wins / (len(pos) * len(neg)))


def classical_floor(xtr, ytr, xte, yte) -> dict:
    """Balanced-weight logistic regression. The powered member, not the straw man."""
    from scipy.optimize import minimize

    w_pos = len(ytr) / (2 * max(ytr.sum(), 1))
    w_neg = len(ytr) / (2 * max((1 - ytr).sum(), 1))
    w = np.where(ytr == 1, w_pos, w_neg)

    def nll(theta):
        z = xtr @ theta[:-1] + theta[-1]
        return float(np.sum(w * np.logaddexp(0, z) - w * ytr * z) + 0.5 * np.dot(theta, theta))

    res = minimize(nll, np.zeros(NQ + 1), method="L-BFGS-B")
    scores = xte @ res.x[:-1] + res.x[-1]
    return {
        "method": "Logistic regression with balanced class weights",
        "metric": "AUROC",
        "value": round(auroc(yte, scores), 4),
    }


def build_overlap(a: np.ndarray, b: np.ndarray) -> Circuit:
    """Compute-uncompute overlap on the family the cost table chose."""
    return overlap_circuit(FAMILIES[FAMILY][1], a, b, NQ)


def main() -> int:
    rng = np.random.default_rng(SEED)
    xtr, ytr, xte, yte = cohort(rng)

    # --- STAGE 1: the classical floor, before any circuit exists ------------
    floor = classical_floor(xtr, ytr, xte, yte)
    print("classical floor (computed FIRST):", floor, flush=True)

    ctx = preflight()
    print("account:", ctx["account"], "| device:", ctx["device"], flush=True)
    ledger = Ledger(budget_hqc=BUDGET_HQC)

    # --- STAGE 2: circuit batch --------------------------------------------
    circuits, tags = [], []
    for i in range(N_TRAIN):
        for j in range(i, N_TRAIN):
            circuits.append(build_overlap(xtr[i], xtr[j]))
            tags.append(("tt", i, j))
    for i in range(N_TEST):
        for j in range(N_TRAIN):
            circuits.append(build_overlap(xte[i], xtr[j]))
            tags.append(("st", i, j))
    bell = Circuit(2, 2)
    bell.H(0)
    bell.CX(0, 1)
    bell.measure_all()
    circuits.append(bell)
    tags.append(("bell", -1, -1))
    print(f"programs: {len(circuits)} at {SHOTS} shots on {ctx['device']}", flush=True)

    try:
        out = run_batch(
            circuits,
            name=f"{PATHWAY}-kernel",
            shots=SHOTS,
            ctx=ctx,
            ledger=ledger,
            max_cost=40.0,
            budget_hqc=BUDGET_HQC,
            properties={
                "pathway": PATHWAY,
                "shots": SHOTS,
                "seed": SEED,
                "n_qubits": NQ,
                "family": FAMILY,
            },
        )
    except Exception as exc:  # assessed-blocked, with the limit named
        blocked = {
            "pathway": PATHWAY,
            "status": "assessed-blocked",
            "reason": f"{type(exc).__name__}: {exc}"[:400],
            "device": ctx["device"],
            "shots": SHOTS,
            "classicalFloor": floor,
            "executedAt": datetime.now(timezone.utc).isoformat(),
        }
        data = json.loads(OUT.read_text()) if OUT.exists() else {}
        data["pathwayRun"] = blocked
        OUT.write_text(json.dumps(data, indent=2) + "\n")
        print("ASSESSED-BLOCKED:", blocked["reason"], flush=True)
        return 1

    dists = out["dists"]

    def p_zero(d) -> float:
        return float(sum(v for k, v in d.items() if all(b == 0 for b in k)))

    ktt = np.eye(N_TRAIN)
    kst = np.zeros((N_TEST, N_TRAIN))
    diag_dev = []
    for d, (kind, i, j) in zip(dists, tags):
        if kind == "tt":
            v = p_zero(d)
            ktt[i, j] = ktt[j, i] = v
            if i == j:
                diag_dev.append(abs(1.0 - v))
        elif kind == "st":
            kst[i, j] = p_zero(d)

    bell_dist = dists[-1]
    bell_anti = float(sum(v for k, v in bell_dist.items() if k[0] != k[1]))
    env = envelope(SHOTS)

    # --- STAGE 3: verdicts, kept separate ----------------------------------
    measured = float(np.mean(diag_dev)) if diag_dev else float("nan")
    mechanism = "PASS" if (measured <= env and bell_anti <= env) else "FAIL"

    alpha = np.linalg.solve(ktt + 0.1 * np.eye(N_TRAIN), ytr * 2.0 - 1.0)
    q_scores = kst @ alpha
    q_auroc = round(auroc(yte, q_scores), 4)

    if q_auroc > floor["value"]:
        # A 4-record held-out split cannot resolve a win. The bar said so first.
        performance = "TIE"
    elif q_auroc < floor["value"]:
        performance = "LOSS"
    else:
        performance = "TIE"

    print(
        f"mechanism: self-overlap deviation {measured:.4f} vs envelope {env:.4f}; "
        f"bell {bell_anti:.4f} -> {mechanism}",
        flush=True,
    )
    print(f"performance: quantum AUROC {q_auroc} vs floor {floor['value']} -> {performance}", flush=True)

    record = {
        "pathway": PATHWAY,
        "status": "live",
        "jobId": out["jobId"],
        "device": ctx["device"],
        "backendQualifier": "emulator",
        "engine": "Quantinuum Nexus H2-Emulator",
        "account": ctx["account"],
        "shots": SHOTS,
        "seed": SEED,
        "nQubits": NQ,
        "programs": len(circuits),
        "executedAt": datetime.now(timezone.utc).isoformat(),
        "classicalFloor": floor,
        "quantum": {"metric": "AUROC", "value": q_auroc},
        "measured": round(measured, 6),
        "envelope": round(env, 6),
        "bellAnticorrelated": round(bell_anti, 6),
        "mechanism": mechanism,
        "performance": performance,
        "estimatedHqc": ledger.committed,
        "circuitFamily": FAMILY,
        "billedHqc": out["billedHqc"],
        "cohort": f"Synthetic seeded cohort, {N_TRAIN} train / {N_TEST} held out, {NQ} features.",
    }
    data = json.loads(OUT.read_text()) if OUT.exists() else {}
    data["pathwayRun"] = record
    data["ledger"] = (data.get("ledger") or []) + ledger.jobs
    OUT.write_text(json.dumps(data, indent=2) + "\n")
    print("wrote", OUT, flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
