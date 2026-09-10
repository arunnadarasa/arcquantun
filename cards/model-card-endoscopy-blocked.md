# Model Card++ — Endoscopy multi-site slot allocation (assessed-blocked)

Template: NVIDIA Trustworthy-AI Model Card++ (CC0-1.0, `github.com/NVIDIA/Trustworthy-AI`).
This card exists because the lane produced **no quantum result**. A limit that
stops a run is a finding, and it is published at the same size as a lane that ran.

## Purpose
Across four sites, how should endoscopy slots be allocated so that no site holds
a disproportionate backlog? An operational fairness question with a measurable
answer, posed before any method was chosen.

## Claim class
**Asserts:** the formulation requires a 32-qubit register; the account's emulator
ceiling is 26 qubits; therefore no execution lane exists and no measurement was
taken.
**Does not assert:** that the quantum lane would win; that it would lose; that
the problem is intractable; anything clinical. There is no number here to
interpret, and none should be inferred from the lane's presence on the board.

## Execution tier
None. Not `NOISY-EMULATOR`, not `SHOT-SIM`, and emphatically not `PHYSICAL-QPU`.
A compile-only structural audit is the only lane available and it produced no
measurement.

## Task and data
- **Cohort:** synthetic multi-site demand, 4 sites, 60 slots
- **Formulation:** Ising model over site-slot assignment, 32-qubit register
- **Provenance:** generated synthetic data committed with the repository; no
  patient-level data, no external dataset, no licence encumbrance

## Classical baseline — recorded first
- **Method:** integer programme, exact solve
- **Metric:** maximum site imbalance
- **Value:** 4 patients

The classical floor stands as the only result for this pathway. It was recorded
before the quantum leg was attempted, and it was not revised afterwards.

## Quantum lane
- **Mechanism verdict:** `BLOCKED`
- **Performance verdict:** `NOT-RUN`
- **Blocked reason:** needs a 32-qubit register; the account's emulator ceiling
  is 26 qubits, so no execution lane exists
- **Receipt grade:** GAP — information is missing, which is not the same as a
  false claim
- **Settlement:** none. No agent was paid for this pathway, and the refusal is
  recorded with its reason.

## Pre-registered decision rule
Written before the attempt: the lane pays only on a PASS receipt, and a register
wider than the emulator ceiling returns `assessed-blocked` rather than a
narrowed problem. The rule was not revisited after the block.

## Evaluation Quad
- **Evaluation Agent:** Nexus Agent refusal path, deterministic, seeded; no model in the loop
- **Evaluation Tasks:** submission of the 32-qubit Ising formulation
- **Evaluation Metrics:** register width against the 26-qubit ceiling; receipt grade; USDC settled
- **Evaluation Results:** 32 > 26 → refused at submission; grade GAP; 0.00 USDC settled; classical floor of 4 patients maximum imbalance stands unchallenged

## Honest limits
- The 26-qubit ceiling is an account entitlement, not a physical bound. A wider
  entitlement would change the status and nothing else about this card.
- The cohort is synthetic, so even a successful run would speak to method, not
  to any real service.
- No shot budget was consumed and no HQCs were billed.

## Deployment boundary
Evidence that the exchange refuses cleanly. Not a statement about endoscopy
scheduling, and not usable as one.

## Provenance
Pathway definition: `src/data/pathways.ts` (`endoscopy-slots`).
Run records: `src/data/runs.ts`. Template licence: CC0-1.0.
