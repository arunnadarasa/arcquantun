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
- **Evaluation Tasks:** eight waiting-list pathways — one blocked by a register ceiling, one stopped by a cohort-fitness gate
- **Evaluation Metrics:** mechanism inside `4*sqrt(0.5/shots)`; performance against the best POWERED member of the classical family; noisy-tier band `sI-PASS` / `sII-DEGRADED` / `sIII-FAIL`; receipt grade; USDC settled
- **Evaluation Results:** six assessed lanes with graded receipts; one `assessed-blocked` lane at 32 qubits against a 26-qubit ceiling; one `unfit-cohort` lane whose classical ceiling reached 0.40 minority recall at 20,000 records against a 0.80 bar. Both pay nothing.

## Safety Guidelines
- Never reorder the seven steps, and never compute a classical floor after a quantum result
- Never call an emulator a QPU, and never let a device-name prefix imply hardware
- Never claim diagnosis, efficacy or a patient outcome from an operational metric
- Never treat "quantum" as "quantum-safe"; log the classical signing chain as an open hazard
- Publish blocked and negative legs at full size, with the limit named
- Never pay against a receipt that is not PASS, and never pay before the anchor is written
- Never draw a floor from a single unpowered baseline; run the powered family and take the best of it as the bar
- Never release a quantum budget before the cohort-fitness sweep; a classical ceiling under the bar means weak signal, not scarce data
- Never re-band, re-run or re-scope a result that missed its bar; publish it with its diagnosis
- Never amend a target after compute; amendments fix the tool only, and are listed on the receipt
- Never pay an unnamed address: resolve the payee's ENS name, require it to point at the exact Arc address being paid, and require its record to permit this leg's intent
- Never treat an ENSIP-25 attestation as evidence of good behaviour, or a Sepolia-to-Arc pointer as a bridge
- Never present a committed namespace entry as a live on-chain read; label the source on every surface
- Never release a budget on no one's authority: require a World ID credential bound to this exact pathway, and hash its nullifier into the receipt digest before sealing
- Never keep anything about that human beyond the nullifier hash — no image, biometric, name, email, phone or wallet reaches this app
- Never let a Selfie Check stand for identity, professional registration, competence or clinical authority; it is an authorisation and abuse-prevention signal only
- Never present a simulated credential as a verified human; label it simulated on every surface while the sandbox entitlement is pending
- Never claim an AgentBook registration that has not returned an entry; a missing agent is shown as missing
