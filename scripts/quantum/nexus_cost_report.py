"""Cost every candidate circuit family before choosing one, and commit the table.

Runs entirely offline: gate counts come off the pytket circuit, the HQC figure
from the published formula, and the classification score from an ideal
statevector kernel. No Nexus session, no submission, no spend. The point is that
the circuit choice is made on evidence rather than taste, and that the evidence
is visible in the app.

    PYTHONPATH=.pydeps python3 scripts/quantum/nexus_cost_report.py
"""

from __future__ import annotations

import json
import pathlib
import sys
from datetime import datetime, timezone

import numpy as np

sys.path.insert(0, "/dev-server/scripts/quantum")

from circuit_families import FAMILIES, ideal_overlap, overlap_circuit  # noqa: E402
from nexus_common import (  # noqa: E402
    HQC_BASE,
    HQC_DIVISOR,
    LIMITS,
    batch_cost,
    gate_census,
    hqc_cost,
)

OUT = pathlib.Path("/dev-server/src/data/nexus-cost.json")
SEED = 20260910
NQ = 6
SHOTS = 256
N_TRAIN = 6
N_TEST = 4


def cohort(rng: np.random.Generator):
    n = N_TRAIN + N_TEST
    y = np.array([0, 1] * (n // 2))
    x = rng.normal(0, 1, size=(n, NQ))
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


def kernel_score(builder, xtr, ytr, xte, yte) -> float:
    ktt = np.zeros((N_TRAIN, N_TRAIN))
    for i in range(N_TRAIN):
        for j in range(i, N_TRAIN):
            v = ideal_overlap(builder, xtr[i], xtr[j], NQ)
            ktt[i, j] = ktt[j, i] = v
    kst = np.zeros((N_TEST, N_TRAIN))
    for i in range(N_TEST):
        for j in range(N_TRAIN):
            kst[i, j] = ideal_overlap(builder, xte[i], xtr[j], NQ)
    alpha = np.linalg.solve(ktt + 0.1 * np.eye(N_TRAIN), ytr * 2.0 - 1.0)
    return round(auroc(yte, kst @ alpha), 4)


def program_count() -> int:
    return N_TRAIN * (N_TRAIN + 1) // 2 + N_TEST * N_TRAIN + 1


def main() -> int:
    rng = np.random.default_rng(SEED)
    xtr, ytr, xte, yte = cohort(rng)
    floor = classical_floor(xtr, ytr, xte, yte)
    print("classical floor (computed FIRST):", floor, flush=True)

    candidates = []
    for key, (label, builder) in FAMILIES.items():
        probe = overlap_circuit(builder, xtr[0], xtr[1], NQ)
        census = gate_census(probe)
        per = hqc_cost(probe, SHOTS)
        batch = batch_cost([probe] * program_count(), SHOTS)
        score = kernel_score(builder, xtr, ytr, xte, yte)
        candidates.append(
            {
                "key": key,
                "label": label,
                "nQubits": census["nQubits"],
                "depth": census["depth"],
                "n1q": census["n1q"],
                "n2q": census["n2q"],
                "nm": census["nm"],
                "perProgramHqc": round(per, 2),
                "programs": batch["programs"],
                "batchHqc": batch["totalHqc"],
                "idealAuroc": score,
                "withinTarget2q": census["n2q"] <= LIMITS["target_2q_per_circuit"],
            }
        )
        print(
            f"  {key:6s} {census['n1q']:3d}x1q {census['n2q']:3d}x2q "
            f"{per:6.2f} HQC/prog  batch {batch['totalHqc']:8.1f}  AUROC {score}",
            flush=True,
        )

    # The previous sizing, kept for contrast: 9 qubits, 69 programs, 1024 shots.
    prior_probe = overlap_circuit(FAMILIES["angle"][1], rng.normal(0, 1, 9), rng.normal(0, 1, 9), 9)
    prior = batch_cost([prior_probe] * 69, 1024)

    chosen = min(
        (c for c in candidates if c["withinTarget2q"]),
        key=lambda c: (-c["idealAuroc"], c["batchHqc"]),
    )

    doc = {
        "schema": "nexus-cost/1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "engine": "Offline sizing analysis (pytket gate census + ideal statevector)",
        "backendQualifier": "offline",
        "note": "No job submitted, no shots bought. Gate counts and HQC estimates only; "
        "the AUROC column is an ideal statevector score, not a measured result.",
        "formula": {
            "expression": "HQC = 5 + (N1q + 10*N2q + 5*Nm) / 5000 * C",
            "base": HQC_BASE,
            "divisor": HQC_DIVISOR,
            "terms": {
                "N1q": "one-qubit gates",
                "N2q": "two-qubit gates, weighted 10x",
                "Nm": "measurements, inits and resets, weighted 5x",
                "C": "shots",
            },
            "note": "The +5 is per circuit, so for small circuits the program count "
            "dominates the bill before a single shot is taken.",
        },
        "envelope": [
            {
                "knob": "Two-qubit gates per circuit",
                "limit": f"target <= {LIMITS['target_2q_per_circuit']}, hard stop "
                f"{LIMITS['hard_2q_per_circuit']}, absolute ceiling "
                f"{LIMITS['ceiling_2q_noisy']} with noise",
                "why": "Fidelity collapses past this on ion traps.",
            },
            {
                "knob": "Qubits",
                "limit": f"4-{LIMITS['max_qubits']} for a demonstrator; 30+ before classical "
                "simulation stops being easy",
                "why": "Below 20 a laptop reproduces the result.",
            },
            {
                "knob": "Shots",
                "limit": f"128-{LIMITS['typical_shots']} typical; 1024 only with a stated reason",
                "why": "Cost is linear in shots.",
            },
            {
                "knob": "Circuits per experiment",
                "limit": "Keep low — each carries +5 HQC",
                "why": "69 circuits is 345 HQC before a single shot.",
            },
            {
                "knob": "Budget",
                "limit": "10,000 HQC normal project, 100,000 HQC showcase",
                "why": "Cheaper is better; the guard refuses rather than overspends.",
            },
        ],
        "hardwareNote": "A million shots is not possible on Helios (98 qubits). Allowable "
        "shots fall as the two-qubit gate count rises, so the two-qubit fidelity spec and "
        "the shot count belong in the same sentence.",
        "sizing": {
            "nQubits": NQ,
            "shots": SHOTS,
            "nTrain": N_TRAIN,
            "nTest": N_TEST,
            "programs": program_count(),
        },
        "classicalFloor": floor,
        "candidates": candidates,
        "chosen": chosen["key"],
        "prior": {
            "label": "Original msk-physio sizing",
            "nQubits": 9,
            "shots": 1024,
            "programs": 69,
            "batchHqc": prior["totalHqc"],
            "perProgramHqc": prior["perProgramHqc"],
        },
    }
    OUT.write_text(json.dumps(doc, indent=2) + "\n")
    print("chosen:", chosen["key"], "| wrote", OUT, flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
