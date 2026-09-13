# Nexus job sizing: cost model, spec, and a cheaper experiment

The msk-physio run took a long time because it was sized without a cost model:
69 programs of 9 qubits at 1024 shots. Under the Quantinuum HQC formula that
batch is ~3,700 HQC of work. Fix it at the source — put the real cost formula in
the code, refuse anything outside the envelope before upload, and redesign the
pathway circuit to fit.

## The cost model

```text
HQC = 5 + (N1q + 10*N2q + 5*Nm) / 5000 * C
```

N1q = 1-qubit gates, N2q = 2-qubit gates, Nm = measurements/inits/resets,
C = shots. The **+5 is per circuit**, so for small circuits the number of
circuits dominates everything else. Two-qubit gates cost 10x a single-qubit gate.

What the current msk run costs under it (per program: 36 1q, 16 2q, 9 meas,
1024 shots) — about 54 HQC each, ~3,700 HQC for the batch. Nearly all of the
savings available are in shots and in program count, not in qubit width.

## The operating envelope (to be written down and enforced)

| Knob | Limit | Why |
| --- | --- | --- |
| 2-qubit gates per circuit | target <= 100, hard stop 1000, absolute ceiling 2000 with noise | fidelity collapses past this on ion traps |
| Qubits | 4-20 for a demonstrator; 30+ is where classical simulation stops being easy | below 20 a laptop reproduces it |
| Shots | 128-512 typical; 1024 only with a reason | cost is linear in shots |
| Circuits per experiment | keep low — each one carries +5 HQC | 69 circuits = 345 HQC before a single shot |
| Budget | 10,000 HQC = normal project, 100,000 HQC = showcase | cheaper is better |

Hardware note to record alongside: a million shots is not possible on Helios
(98 qubits); allowable shots fall as the 2-qubit gate count rises, so state the
2-qubit fidelity spec and the shot count together.

## What gets built

1. **`hqc_cost()` in `scripts/quantum/nexus_common.py`** — counts N1q / N2q / Nm
   straight off the compiled pytket circuit and returns the HQC figure, per
   program and summed for a batch. Replaces the hand-typed `estimate=120.0`.
2. **A sizing preflight** that runs before upload and refuses, naming the number:
   2-qubit count over the ceiling, estimated HQC over the run budget, or width
   over the account's emulator limit. Same loud-failure discipline as the
   existing guards — never a quiet downgrade.
3. **A per-program cost table printed at submit time** so the spend is visible
   before it is committed, and the real `qnx.jobs.cost` figure recorded beside
   the estimate afterwards.
4. **Redesigned msk-physio circuit** inside the envelope: 6 qubits (feature
   reduction on the cohort), one entangling layer, ~10 two-qubit gates per
   overlap circuit, 256 shots, a trimmed pair set plus the Bell control. Roughly
   10 HQC per program instead of 54.
5. **Several candidate circuits, costed and compared.** The task is a
   classification one, so the point is to evaluate a cost function per circuit
   design — angle encoding vs a ZZ-feature-map vs a hardware-efficient ansatz —
   each with its gate counts, HQC estimate and classification score in one
   table, so the choice of circuit is made on evidence rather than taste.
6. **A spec page in the app** showing the formula, the envelope table, and the
   costed circuit comparison, so a reviewer sees that the sizing was deliberate.

## Technical notes

Files touched: `scripts/quantum/nexus_common.py` (cost function, preflight,
meter), `scripts/quantum/nexus_run_pathway.py` (new circuit family and the
comparison loop), a new committed `src/data/nexus-cost.json`, and one new route
rendering it. `max_cost` stays per job; the process ledger keeps the batch total.
The classical floor is still computed before any circuit is uploaded, and the
mechanism and performance verdicts stay separate.
