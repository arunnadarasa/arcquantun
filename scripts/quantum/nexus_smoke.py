"""Smoke test: a Bell pair on H2-Emulator, 128 shots.

Small and cheap, and it exercises every step of the real path — upload, compile,
execute the compiled ref, download, decode. An X-probe runs first because Nexus
distribution keys are int tuples indexed by qubit, and a bit-order assumption
made here is an analysis error everywhere downstream.

    QNEXUS_TOKEN=... PYTHONPATH=.pydeps python3 scripts/quantum/nexus_smoke.py
"""

from __future__ import annotations

import json
import pathlib
import sys
from datetime import datetime, timezone

sys.path.insert(0, "/dev-server/scripts/quantum")

from pytket import Circuit  # noqa: E402

from nexus_common import Ledger, envelope, preflight, run_job  # noqa: E402

OUT = pathlib.Path("/dev-server/src/data/nexus-live.json")


def main() -> int:
    ctx = preflight()
    print("account:", ctx["account"], "| device:", ctx["device"], flush=True)
    ledger = Ledger(budget_hqc=25.0)

    # 1. X-probe: calibrate bit order before interpreting any bitstring.
    probe = Circuit(2, 2)
    probe.X(0)
    probe.measure_all()
    p = run_job(
        probe, name="xprobe-2q", shots=32, ctx=ctx, ledger=ledger, estimate=1.0, max_cost=3.0
    )
    top_probe = max(p["dist"].items(), key=lambda kv: kv[1])[0]
    bit_order_ok = top_probe[0] == 1 and top_probe[1] == 0
    print("x-probe:", top_probe, "ok" if bit_order_ok else "UNEXPECTED", flush=True)

    # 2. Bell control.
    bell = Circuit(2, 2)
    bell.H(0)
    bell.CX(0, 1)
    bell.measure_all()
    b = run_job(
        bell, name="bell-control", shots=128, ctx=ctx, ledger=ledger, estimate=2.0, max_cost=5.0
    )
    shots = b["shots"]
    anti = sum(v for k, v in b["dist"].items() if k[0] != k[1])
    env = envelope(shots)
    verdict = "PASS" if anti <= env else "FAIL"
    print(f"bell anti-correlated={anti:.4f} envelope={env:.4f} -> {verdict}", flush=True)

    payload = {
        "schema": "nexus-live/1",
        "account": ctx["account"],
        "device": ctx["device"],
        "backendQualifier": "emulator",
        "engine": "Quantinuum Nexus H2-Emulator",
        "executedAt": datetime.now(timezone.utc).isoformat(),
        "smokeTest": {
            "bitOrderProbe": {"jobId": p["jobId"], "top": list(top_probe), "ok": bit_order_ok},
            "bell": {
                "jobId": b["jobId"],
                "shots": shots,
                "antiCorrelated": round(anti, 6),
                "envelope": round(env, 6),
                "verdict": verdict,
                "billedHqc": b["billedHqc"],
            },
        },
        "ledger": ledger.jobs,
    }
    existing = json.loads(OUT.read_text()) if OUT.exists() else {}
    existing.update(payload)
    OUT.write_text(json.dumps(existing, indent=2) + "\n")
    print("wrote", OUT, flush=True)
    return 0 if verdict == "PASS" and bit_order_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
