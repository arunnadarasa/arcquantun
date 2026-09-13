"""Shared Nexus lane helpers: auth, preflight, submission, cost.

Rules this module enforces, because every one of them has cost somebody a run:

* Precedence is env refresh token -> on-disk session -> hard failure. There is
  never a silent fallback to a local emulator; a lane that downgrades quietly
  produces an emulator number wearing a cloud label.
* Verify the session by NAME, not by absence of an exception.
* Emulator devices only. Hardware is not reachable from this path by design.
* Every execute job carries max_cost, and a per-process ledger refuses the next
  job rather than exceeding the session budget.
* The job ref is written to disk the moment Nexus accepts it, so a sandbox reset
  re-attaches to paid work instead of buying it twice.
"""

from __future__ import annotations

import json
import math
import os
import pathlib
import sys
import time

sys.path.insert(0, "/dev-server/.pydeps")

import qnexus as qnx  # noqa: E402

PROJECT_NAME = "ClinicalQuantumExchange"
DEVICE = "H2-Emulator"
# Emulator names only. An H-series QPU name must never be reachable from here.
ALLOWED_DEVICES = {"H2-Emulator", "H1-Emulator", "H2-1LE", "H1-1LE"}
CACHE = pathlib.Path("/dev-server/_cache_nexus")


def envelope(shots: int) -> float:
    """Tomographic-equivalence threshold. Not 3-sigma — that false-FAILs near 0/1."""
    return 4 * math.sqrt(0.5 / shots)


# --- Cost model ------------------------------------------------------------
# Quantinuum Hardware Quantum Credits:
#
#     HQC = 5 + (N1q + 10*N2q + 5*Nm) / 5000 * C
#
# The +5 is PER CIRCUIT, so for small circuits the program count dominates the
# bill; a two-qubit gate costs ten single-qubit gates; cost is linear in shots.
HQC_BASE = 5.0
HQC_DIVISOR = 5000.0

# The operating envelope. Every number here has a reason, not a preference.
LIMITS = {
    "target_2q_per_circuit": 100,   # ion-trap fidelity target
    "hard_2q_per_circuit": 1000,    # refuse past this
    "ceiling_2q_noisy": 2000,       # absolute open limit with noise
    "max_qubits": 20,               # above this, stop calling it classically easy
    "typical_shots": 512,           # 1024+ needs a stated reason
}

_MEASUREY = {"Measure", "Reset", "Init"}


class SizingRefusal(RuntimeError):
    """Raised BEFORE upload. A run outside the envelope is refused, never trimmed quietly."""


def gate_census(circuit) -> dict:
    """N1q / N2q / Nm straight off the circuit. No recollection, no hand-typed guess."""
    n1q = n2q = nm = 0
    for cmd in circuit.get_commands():
        name = cmd.op.get_name().split("(")[0]
        if name in _MEASUREY:
            nm += 1
            continue
        if name == "Barrier":
            continue
        width = len(cmd.qubits)
        if width == 1:
            n1q += 1
        elif width >= 2:
            # A 3+ qubit gate is not native; count its pairwise cost honestly.
            n2q += width - 1
    return {
        "nQubits": circuit.n_qubits,
        "depth": circuit.depth(),
        "n1q": n1q,
        "n2q": n2q,
        "nm": nm,
    }


def hqc_cost(circuit, shots: int) -> float:
    c = gate_census(circuit)
    return HQC_BASE + (c["n1q"] + 10 * c["n2q"] + 5 * c["nm"]) / HQC_DIVISOR * shots


def batch_cost(circuits: list, shots: int) -> dict:
    per = [hqc_cost(c, shots) for c in circuits]
    census = [gate_census(c) for c in circuits]
    return {
        "programs": len(circuits),
        "shots": shots,
        "perProgramHqc": round(sum(per) / max(len(per), 1), 3),
        "totalHqc": round(sum(per), 2),
        "constantHqc": round(HQC_BASE * len(circuits), 2),
        "max2q": max((c["n2q"] for c in census), default=0),
        "maxQubits": max((c["nQubits"] for c in census), default=0),
    }


def sizing_preflight(
    circuits: list,
    shots: int,
    *,
    budget_hqc: float,
    device_width: int | None = None,
    limits: dict | None = None,
) -> dict:
    """Refuse an oversized or overpriced batch before a single byte is uploaded."""
    lim = {**LIMITS, **(limits or {})}
    summary = batch_cost(circuits, shots)

    if summary["max2q"] > lim["hard_2q_per_circuit"]:
        raise SizingRefusal(
            f"{summary['max2q']} two-qubit gates in one circuit, over the "
            f"{lim['hard_2q_per_circuit']} hard limit "
            f"(target {lim['target_2q_per_circuit']}, noisy ceiling {lim['ceiling_2q_noisy']})"
        )
    if device_width is not None and summary["maxQubits"] > device_width:
        raise SizingRefusal(
            f"{summary['maxQubits']} qubits, over the {device_width}-qubit device width"
        )
    if summary["totalHqc"] > budget_hqc:
        raise SizingRefusal(
            f"batch estimates {summary['totalHqc']:.1f} HQC, over the "
            f"{budget_hqc:.1f} HQC budget "
            f"({summary['constantHqc']:.0f} of it is the per-circuit +5 on "
            f"{summary['programs']} programs)"
        )

    warnings = []
    if summary["max2q"] > lim["target_2q_per_circuit"]:
        warnings.append(
            f"{summary['max2q']} two-qubit gates is over the {lim['target_2q_per_circuit']} target"
        )
    if shots > lim["typical_shots"]:
        warnings.append(f"{shots} shots is above the {lim['typical_shots']} typical budget")
    summary["warnings"] = warnings
    return summary


def print_cost_table(label: str, circuits: list, shots: int, summary: dict) -> None:
    """The spend is printed before it is committed, not reconstructed afterwards."""
    print(f"\n  cost estimate — {label}", flush=True)
    print(f"    programs        {summary['programs']}", flush=True)
    print(f"    shots           {shots}", flush=True)
    print(f"    widest circuit  {summary['maxQubits']} qubits, {summary['max2q']} 2q gates", flush=True)
    print(f"    per program     {summary['perProgramHqc']:.2f} HQC", flush=True)
    print(f"    constant (+5)   {summary['constantHqc']:.0f} HQC", flush=True)
    print(f"    batch total     {summary['totalHqc']:.1f} HQC", flush=True)
    for w in summary.get("warnings", []):
        print(f"    WARNING         {w}", flush=True)
    print("", flush=True)




def login() -> str:
    token = os.environ.get("QNEXUS_TOKEN")
    if token:
        qnx.auth.login_with_token(token)
    elif not qnx.auth.is_logged_in():
        raise RuntimeError("No Nexus session: set QNEXUS_TOKEN or run nexus_login.py")
    who = qnx.users.get_self().display_name
    if not who:
        raise RuntimeError("Nexus session did not resolve to a named account")
    return who


def device_record(device: str = DEVICE):
    """The live device record, so width comes from Nexus rather than memory."""
    for d in qnx.devices.get_all():
        name = getattr(d, "device_name", None) or getattr(d, "name", None)
        if name == device:
            return d
    raise RuntimeError(f"{device} is not in this account's device list")


def preflight(device: str = DEVICE) -> dict:
    if device not in ALLOWED_DEVICES:
        raise RuntimeError(f"{device} is not an allowed emulator device")
    who = login()
    rec = device_record(device)
    project = qnx.projects.get_or_create(name=PROJECT_NAME)
    qnx.context.set_active_project(project)
    from quantinuum_schemas.models.backend_config import QuantinuumConfig

    config = QuantinuumConfig(device_name=device)
    return {
        "account": who,
        "device": device,
        "device_record": rec,
        "project": project,
        "config": config,
    }


class Ledger:
    """Per-process spend guard. max_cost is per job; thirty jobs cost thirty ceilings."""

    def __init__(self, budget_hqc: float):
        self.budget = budget_hqc
        self.committed = 0.0
        self.jobs: list[dict] = []

    def reserve(self, estimate: float, label: str) -> None:
        if self.committed + estimate > self.budget:
            raise RuntimeError(
                f"Budget guard: {label} would take committed spend to "
                f"{self.committed + estimate:.2f} HQC, over the {self.budget:.2f} ceiling"
            )
        self.committed += estimate

    def record(self, label: str, job_id: str, estimated: float, billed: float | None) -> None:
        self.jobs.append(
            {"label": label, "jobId": job_id, "estimatedHqc": estimated, "billedHqc": billed}
        )


def save_ref(tag: str, job_id: str, meta: dict) -> None:
    """Written at SUBMIT time — the window before results is where money is lost."""
    CACHE.mkdir(parents=True, exist_ok=True)
    (CACHE / f"{tag}.json").write_text(
        json.dumps({"jobId": job_id, "status": "submitted", "at": time.time(), **meta}, indent=2)
    )


def billed_hqc(job) -> float | None:
    try:
        cost = qnx.jobs.cost(job)
        return float(cost) if cost is not None else None
    except Exception:
        return None


def run_job(
    circuit,
    *,
    name: str,
    shots: int,
    ctx: dict,
    ledger: Ledger,
    estimate: float,
    max_cost: float,
) -> dict:
    """upload -> compile -> execute the COMPILED ref -> download. In that order."""
    # A cell that already has a job id is never a cell to submit: those shots
    # are already paid for. Re-attach before considering any new submission.
    cached = CACHE / f"{name}.json"
    exec_job = None
    if cached.exists():
        prior = json.loads(cached.read_text())
        if prior.get("jobId"):
            exec_job = qnx.jobs.get(id=prior["jobId"])
            print(f"re-attaching {name} -> job {prior['jobId']}", flush=True)

    if exec_job is None:
        ledger.reserve(estimate, name)
        exec_job = _submit(circuit, name=name, shots=shots, ctx=ctx, max_cost=max_cost)
    job_id = str(getattr(exec_job, "id", ""))

    qnx.jobs.wait_for(exec_job, timeout=1800)
    result = qnx.jobs.results(exec_job)[0].download_result()
    emp = result.get_empirical_distribution()
    counter = emp.as_counter()
    total = sum(counter.values()) or 1
    # Keys are int tuples indexed by qubit; normalise to probabilities.
    dist = {tuple(int(b) for b in k): v / total for k, v in counter.items()}
    billed = billed_hqc(exec_job)
    ledger.record(name, job_id, estimate, billed)

    (CACHE / f"{name}.json").write_text(
        json.dumps(
            {
                "jobId": job_id,
                "status": "complete",
                "shots": shots,
                "device": ctx["device"],
                "billedHqc": billed,
            },
            indent=2,
        )
    )
    return {"jobId": job_id, "dist": dist, "billedHqc": billed, "shots": shots}


def run_batch(
    circuits: list,
    *,
    name: str,
    shots: int,
    ctx: dict,
    ledger: Ledger,
    estimate: float | None = None,
    max_cost: float,
    budget_hqc: float | None = None,
    device_width: int | None = None,
    properties: dict | None = None,
) -> dict:
    """One job, many programs. A sweep fired as N jobs is N queue positions and N bills.

    Returns one normalised distribution per program, in submission order.
    The estimate is COMPUTED from the circuits unless one is forced in.
    """
    summary = sizing_preflight(
        circuits,
        shots,
        budget_hqc=budget_hqc if budget_hqc is not None else ledger.budget,
        device_width=device_width,
    )
    if estimate is None:
        estimate = summary["totalHqc"]
    print_cost_table(name, circuits, shots, summary)

    cached = CACHE / f"{name}.json"
    exec_job = None
    if cached.exists():
        prior = json.loads(cached.read_text())
        if prior.get("jobId"):
            exec_job = qnx.jobs.get(id=prior["jobId"])
            print(f"re-attaching {name} -> job {prior['jobId']}", flush=True)

    if exec_job is None:
        ledger.reserve(estimate, name)
        refs = [
            qnx.circuits.upload(c, name=f"{name}-c{i:03d}") for i, c in enumerate(circuits)
        ]
        compile_job = qnx.start_compile_job(
            programs=refs,
            backend_config=ctx["config"],
            optimisation_level=2,
            name=f"{name}-compile",
        )
        qnx.jobs.wait_for(compile_job, timeout=3600)
        compiled = [r.get_output() for r in qnx.jobs.results(compile_job)]

        ctx_mgr = (
            qnx.context.using_properties(**properties) if properties else _null_context()
        )
        with ctx_mgr:
            exec_job = qnx.start_execute_job(
                programs=compiled,
                n_shots=[shots] * len(compiled),
                backend_config=ctx["config"],
                name=f"{name}-exec",
                max_cost=[max_cost] * len(compiled),
            )
        save_ref(
            name,
            str(getattr(exec_job, "id", "")),
            {"shots": shots, "device": ctx["device"], "programs": len(compiled)},
        )

    job_id = str(getattr(exec_job, "id", ""))
    qnx.jobs.wait_for(exec_job, timeout=7200)
    dists = []
    for ref in qnx.jobs.results(exec_job):
        counter = ref.download_result().get_empirical_distribution().as_counter()
        total = sum(counter.values()) or 1
        dists.append({tuple(int(b) for b in k): v / total for k, v in counter.items()})
    billed = billed_hqc(exec_job)
    ledger.record(name, job_id, estimate, billed)
    (CACHE / f"{name}.json").write_text(
        json.dumps(
            {
                "jobId": job_id,
                "status": "complete",
                "shots": shots,
                "device": ctx["device"],
                "programs": len(dists),
                "billedHqc": billed,
            },
            indent=2,
        )
    )
    return {"jobId": job_id, "dists": dists, "billedHqc": billed, "shots": shots}


class _null_context:
    def __enter__(self):
        return None

    def __exit__(self, *a):
        return False


def _submit(circuit, *, name: str, shots: int, ctx: dict, max_cost: float):
    circuit_ref = qnx.circuits.upload(circuit, name=f"{name}-circ")

    compile_job = qnx.start_compile_job(
        programs=[circuit_ref],
        backend_config=ctx["config"],
        optimisation_level=2,
        name=f"{name}-compile",
    )
    qnx.jobs.wait_for(compile_job)
    compiled = qnx.jobs.results(compile_job)[0].get_output()

    exec_job = qnx.start_execute_job(
        programs=[compiled],
        n_shots=[shots],
        backend_config=ctx["config"],
        name=f"{name}-exec",
        max_cost=[max_cost],
    )
    # Persist at submit time: the window before results is where money is lost.
    save_ref(name, str(getattr(exec_job, "id", "")), {"shots": shots, "device": ctx["device"]})
    return exec_job
