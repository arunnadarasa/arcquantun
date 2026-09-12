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
- **Evaluation Tasks:** eight pathways end to end, plus receipt-grading unit behaviour for PASS, GAP, STRUCTURAL and FAIL
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

## Amendment — identity gate (ENS / ENSIP-25)

The fixed order gains one step, immediately after the policy check:

```text
policy check -> identity gate -> classical floor -> cohort fitness
             -> dequantization gate -> quantum leg -> receipt grading
             -> post-quantum seal -> on-chain anchor -> USDC settlement
```

**Asserts:** every payee is resolved through ENS before a transfer is prepared;
the resolved Arc address must equal the address being paid; the payee's record
must permit this leg's intent; the identity records are hashed into the receipt
digest before sealing and anchoring; a failed identity check blocks payment.

**Does not assert:** that an ENS attestation proves good behaviour; that any
cross-chain message passes between Sepolia and Arc; that ENS records are
quantum-safe — they are ECDSA-signed and remain an open hazard.

Component boundary: ENS reads run live against the Universal Resolver V2 on
Sepolia when `SEPOLIA_RPC_URL` is configured and the namespace is registered;
otherwise the committed namespace in `src/data/ens.json` is used and every
affected surface is labelled "committed namespace entry — not yet read from
Sepolia". Registration is performed by `scripts/ens-register.mjs`, which writes
its results back into that same file.

## Human authority (World ID)

**Asserts, per budget release:** that one unique human authorised this specific
pathway's spend; that the authorisation is bound to that pathway and does not
carry to another; that only a nullifier hash is retained, and that it is hashed
into the receipt digest before the SLH-DSA seal and the Arc anchor; that an
absent, mismatched or cleared authorisation blocks settlement while the run
itself still executes and publishes at full size.

**Does not assert:** that the human is a named person, a clinician, a
registrant or an accountable officer; that Selfie Check evidences identity,
competence or clinical authority; that the nullifier can be resolved to anyone;
that the credential is quantum-safe — it is classically signed, like the ENS and
Arc legs.

**Never collected:** image, biometric template, name, email, phone number,
wallet address, or any other attribute of the human. The credential never
touches this app's infrastructure; verification runs through World's endpoint
and only the nullifier comes back.

Component boundary: the World Sandbox entitlement for this app is pending, so
authorisations are deterministic stand-ins labelled "simulated" wherever they
appear, and AgentBook entries remain unregistered in `src/data/agentbook.json`
until `scripts/agentbook-register.mjs` receives real entries back.
