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
    estimate: float,
    max_cost: float,
    properties: dict | None = None,
) -> dict:
    """One job, many programs. A sweep fired as N jobs is N queue positions and N bills.

    Returns one normalised distribution per program, in submission order.
    """
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
