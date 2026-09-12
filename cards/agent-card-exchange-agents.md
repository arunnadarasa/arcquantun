# Agent Card — Clinical Quantum Exchange agents

Template: NVIDIA Trustworthy-AI Agent Card (CC0-1.0, `github.com/NVIDIA/Trustworthy-AI`).
Network: Arc Testnet, chain id 5042002. Currency: testnet USDC, 6 decimals.

## Purpose
Four autonomous agents assess NHS waiting-list questions and settle payment
between themselves in USDC, with spend authority bounded before any transfer.

## Claim class
**Asserts:** each agent acts within a stated ceiling, and payment is released
only against a PASS receipt that has already been anchored.
**Does not assert:** any clinical decision, any diagnosis, any efficacy or
patient-outcome improvement, any mainnet or real-money capability, any
autonomous authority beyond the caps below.

## Execution tier
`n/a` — settlement layer. Quantum tiers are stated on the model cards.

## The agents

### Trust Agent
- **Role:** holds the pathway budget, posts jobs, releases payment
- **Authority:** spend up to 0.50 USDC per job, 5.00 USDC per rolling 24 hours
- **Decision logic:** releases funds only when a receipt carries engine, backend qualifier, shots, seed and verdict
- **Refuses when:** any required field is missing (grade GAP), no envelope is attached (STRUCTURAL), or the envelope is contradicted (FAIL)
- **May not:** pay before the anchor is written; pay a blocked leg; waive a cap

### Baseline Agent
- **Role:** runs the classical floor and the dequantization gate, always first
- **Authority:** 0.12 USDC per job, 1.20 USDC per 24 hours; 30% fee share
- **Decision logic:** computes the classical result before any quantum work exists, then tests whether a classical surrogate reproduces the quantum distribution; if it does, it says the advantage claim dissolves
- **Refuses when:** asked to run after a quantum result already exists
- **May not:** revise the floor once the quantum leg has returned

### Nexus Agent
- **Role:** submits circuits to Quantinuum Nexus and returns a graded receipt
- **Authority:** 0.15 USDC per job, 1.50 USDC per 24 hours; 55% fee share
- **Decision logic:** books its spend estimate at submission, not at result
- **Refuses when:** the register is wider than the account's 26-qubit emulator ceiling — it returns `assessed-blocked` instead of a number
- **May not:** shrink a problem to fit the ceiling; describe an emulator as hardware

### Registry Agent
- **Role:** anchors the receipt hash on Arc and serves the settlement ledger
- **Authority:** 0.04 USDC per job, 0.40 USDC per 24 hours; 15% fee share
- **Decision logic:** writes the receipt hash to the anchoring contract before payment clears
- **Refuses when:** the grade is not PASS
- **May not:** re-anchor a modified receipt under the original hash

## Evaluation Quad
- **Evaluation Agent:** deterministic seeded orchestration in `src/lib/exchange.functions.ts`; no language model is in the settlement path
- **Evaluation Tasks:** seven pathway jobs, each exercising policy check → floor → dequantization → quantum leg → grading → anchor → settlement
- **Evaluation Metrics:** cap adherence (per job and per 24 hours); anchor-before-payment ordering; payment released only on PASS
- **Evaluation Results:** six lanes settle; the endoscopy lane pays nothing and records the refusal with its reason; no transfer has been observed outside a cap

## Honest limits
- Testnet only. No mainnet path exists and none is implied.
- Cohorts are synthetic; no patient-level data is used.
- Circle payments and the on-chain anchor run as simulated envelopes flagged `simulated: true` until the Circle keys and the deployed `ReceiptAnchor` contract are configured.
- Receipt provenance is signed with classical cryptography. That is not quantum-safe, and it is logged as an open hazard rather than described away.

## Deployment boundary
Capacity planning and attestation of assessment work. Not for clinical
decision-making, not for triage in service, not for real-money settlement.

## Provenance
Repository: Clinical Quantum Exchange. Agent definitions: `src/data/agents.ts`.
Policy gate: `src/lib/policy.ts`. Template licence: CC0-1.0.

## Named identity (ENS / ENSIP-25)

Each agent carries a name under `clinicalquantum.eth` on ENSv2 (Sepolia), an
`arc:actor[<agentId>]` record pointing at its Arc payout address as a CAIP-10
pointer, an `agent:intents[<agentId>]` record listing what it may do, and an
`agent-registration[<registry>][<agentId>]` ENSIP-25 record pointing back at the
`ReceiptAnchor` contract on Arc Testnet.

| Agent | ENS name | Agent id | Permitted intents |
| --- | --- | --- | --- |
| Trust | `trust.clinicalquantum.eth` | `cqx-trust-1` | `release-budget`, `settle` |
| Baseline | `baseline.clinicalquantum.eth` | `cqx-baseline-1` | `classical-floor`, `dequantization`, `cohort-fitness` |
| Nexus | `nexus.clinicalquantum.eth` | `cqx-nexus-1` | `quantum-submit` |
| Registry | `registry.clinicalquantum.eth` | `cqx-registry-1` | `anchor` |

The identity gate runs after the policy cap and before any spend. A payee whose
name does not resolve to the exact Arc address the run is about to pay, or whose
record does not list this leg's intent, is not paid — and the identity records
are hashed into the receipt digest, so the sealed receipt states who was paid,
not merely how much. Revoking an agent is a text-record edit, not a redeploy.

Limits: ENS names live on Sepolia and settlement happens on Arc Testnet. The
binding is an attested cross-chain pointer, not a bridge. An attestation proves
a binding was asserted by the name's controller; it says nothing about whether
the agent behaved well, which is what the receipt grade is for. ENS records are
signed with classical ECDSA and are logged under the same open hazard as the
rest of the chain-side provenance.
