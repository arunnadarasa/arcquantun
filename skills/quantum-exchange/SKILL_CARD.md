# Clinical Quantum Exchange Skill Card

## Purpose
Turn an NHS waiting-list question into a graded receipt, an on-chain anchor and
a USDC settlement, in a fixed order that cannot be reordered to flatter a result.

## When to Use
- When adding or editing a waiting-list pathway
- When a quantum leg returns a number and someone wants to publish it
- When grading a receipt or deciding whether an agent gets paid
- When a register is wider than the emulator ceiling and the honest answer is "blocked"
- When writing any claim about capacity, cost or patient experience

## Key Features
- Classical floor recorded before any quantum work exists
- Dequantization gate: a classical surrogate that reproduces the result dissolves the claim
- Two verdicts held apart — mechanism and performance
- Four grades — PASS / GAP / STRUCTURAL / FAIL — so missing information is not a false claim
- Receipt hash anchored on Arc Testnet before money moves
- Policy caps checked before every transfer, per job and per 24 hours

## Input/Output
**Inputs:**
- A clinical question in a clinician's words, plus the cohort shape
- The classical method, metric and value, recorded first
- A committed execution specification: engine, device, config class, shots, seed, qubits
- A USDC budget in minor units

**Outputs:**
- A receipt envelope (`qas/envelope/0.1`) with engine, backend qualifier, shots, seed, commit, tolerance, measured value and both verdicts
- A receipt grade with its reasons
- A receipt hash and its Arc anchoring transaction
- USDC settlements per agent, or a recorded refusal to pay

## Evaluation Quad
- **Evaluation Agent:** deterministic run orchestration in `src/lib/exchange.functions.ts`, seeded, no model in the loop
- **Evaluation Tasks:** seven waiting-list pathways, one blocked by design
- **Evaluation Metrics:** mechanism inside `4*sqrt(0.5/shots)`; performance against the committed classical floor; receipt grade; USDC settled
- **Evaluation Results:** six assessed lanes with graded receipts; one `assessed-blocked` lane at 32 qubits against a 26-qubit ceiling, paying nothing

## Safety Guidelines
- Never reorder the seven steps, and never compute a classical floor after a quantum result
- Never call an emulator a QPU, and never let a device-name prefix imply hardware
- Never claim diagnosis, efficacy or a patient outcome from an operational metric
- Never treat "quantum" as "quantum-safe"; log the classical signing chain as an open hazard
- Publish blocked and negative legs at full size, with the limit named
- Never pay against a receipt that is not PASS, and never pay before the anchor is written
