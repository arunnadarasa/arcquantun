# System Card — Clinical Quantum Exchange

Template: NVIDIA Trustworthy-AI System Card (CC0-1.0, `github.com/NVIDIA/Trustworthy-AI`).

## Purpose
A marketplace in which autonomous agents are paid in USDC on Arc Testnet for
assessing NHS waiting-list questions, where payment is conditional on a receipt
that a stranger can re-check.

## Claim class
**Asserts:** the seven-step order below is enforced in code; a receipt is graded
before money moves; a receipt hash is anchored before money moves; only a PASS
receipt pays.
**Does not assert:** quantum advantage on any pathway; any clinical claim; any
improvement to patient outcomes; any quantum-safe property of the record.

## Components and boundary

| Component | Runs | Notes |
| --- | --- | --- |
| Pathway board and run orchestration | live | deterministic, seeded |
| Classical floor + dequantization gate | live | committed values, recorded first |
| Quantum leg | committed offline results | Nexus jobs cost HQCs and cannot run in the Worker runtime |
| Receipt grading | live | `qas/envelope/0.1` |
| Receipt anchoring | simulated until contract deployed | `src/data/contract.json` has `"deployed": false` |
| USDC settlement | simulated until Circle keys configured | envelopes flagged `simulated: true` |
| Settlement ledger | live | browser-local, paginated |

**Trust boundary: the receipt.** Everything upstream of it is a claim.
Everything downstream of it is settlement. Nothing crosses it ungraded.

## Fixed order of operations

```text
policy check -> classical floor -> dequantization gate -> quantum leg
             -> receipt grading -> on-chain anchor -> USDC settlement
```

Reordering any step invalidates the result it produces. A floor computed after a
quantum result is a rationalisation; an anchor written after payment is not
evidence.

## Evaluation Quad
- **Evaluation Agent:** deterministic run orchestration plus human review of every published sentence
- **Evaluation Tasks:** seven pathways end to end, plus receipt-grading unit behaviour for PASS, GAP, STRUCTURAL and FAIL
- **Evaluation Metrics:** step order preserved; grade correctness against the committed envelope; anchor precedes settlement; totals in the ledger reconcile with the per-agent fee shares
- **Evaluation Results:** six lanes settle with PASS receipts; the endoscopy lane returns `assessed-blocked`, grades GAP, and pays nothing; no lane has settled without a prior anchor step

## Failure modes and what each looks like

| Failure | User-visible result |
| --- | --- |
| Missing shots/seed/engine/commit | grade GAP, no payment, reasons listed |
| No envelope attached | grade STRUCTURAL, no payment |
| Verdict contradicted by the measured value, or a failed Bell control | grade FAIL, no payment |
| Register above the 26-qubit ceiling | `assessed-blocked`, published at full size |
| Circle keys absent | simulated settlement envelope, labelled as simulated |
| Contract not deployed | simulated anchor, labelled as simulated |

## Honest limits
- All cohorts are synthetic; no patient-level data, no DPIA claimed.
- Emulator tier at most. No run in this project is `PHYSICAL-QPU`.
- Testnet USDC only.
- The evidence chain is signed classically and is therefore not quantum-safe;
  recorded as an open hazard.
- No endorsement by any NHS body, trust or vendor is claimed or implied.

## Deployment boundary
A demonstration of verifiable agent-to-agent settlement over clinical assessment
work. Not a clinical system, not a triage tool, not a payment product.

## Provenance
Orchestration: `src/lib/exchange.functions.ts`. Receipts: `src/lib/receipts.ts`.
Ledger: `src/lib/ledger.ts`. Chain constants: `src/lib/arc-chain.ts`.
Template licence: CC0-1.0.
