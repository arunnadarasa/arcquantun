---
name: quantum-exchange
description: How the Clinical Quantum Exchange turns an NHS waiting-list question into a graded receipt, an on-chain anchor and a USDC settlement. Use when adding a pathway, changing the run order, grading a receipt, or writing a claim about a quantum leg.
---

# Clinical Quantum Exchange Skill

A marketplace where autonomous agents are paid in USDC on Arc Testnet for
assessing NHS waiting-list questions — and are paid only against a receipt that
survives reading.

## The fixed order

Nothing in this list may be reordered, and nothing may be skipped.

```text
1. Policy check        Trust Agent checks per-job ceiling and 24h cap before any spend
2. Classical floor     Baseline Agent records the ordinary-maths result FIRST
3. Dequantization gate Baseline Agent tests whether a classical surrogate reproduces it
4. Quantum leg         Nexus Agent returns a measurement, or assessed-blocked
5. Receipt grading     PASS / GAP / STRUCTURAL / FAIL against the committed envelope
6. Anchor              Registry Agent writes the receipt hash to Arc BEFORE money moves
7. Settlement          Trust Agent releases USDC only against a PASS receipt
```

A classical floor computed after a quantum result is a rationalisation. An
anchor written after payment is not evidence. The order is the product.

## The pathways

Seven NHS waiting-list questions, each written in a clinician's words before any
method was chosen, each carrying the classical floor recorded first and the
USDC budget the Trust Agent holds:

| Pathway | Question type | Qubits | Status |
| --- | --- | --- | --- |
| Gynaecology — suspected endometriosis | referral ordering | 14 | assessed |
| Gynaecology — theatre list sequencing | QUBO scheduling | 24 | assessed |
| Dermatology — two-week-wait referrals | kernel ranking | 11 | assessed |
| MSK physiotherapy — did-not-attend risk | kernel ranking | 9 | assessed |
| Cardiology — echocardiogram demand | time-series kernel | 16 | assessed |
| Endoscopy — multi-site slot allocation | Ising allocation | 32 | **assessed-blocked** |
| Mental health — talking-therapy access | kernel ranking | 13 | assessed |

Endoscopy needs a 32-qubit register against a 26-qubit emulator ceiling. It is
published at full size as `assessed-blocked` with the limit named. It is never
quietly dropped from the board, and it never pays.

## The agents

| Agent | Role | Fee share | Per-job ceiling |
| --- | --- | --- | --- |
| Trust | holds budget, posts jobs, releases payment | 0 | 0.50 USDC |
| Baseline | classical floor + dequantization gate | 30% | 0.12 USDC |
| Nexus | circuit submission, graded receipt | 55% | 0.15 USDC |
| Registry | receipt hash anchoring, settlement ledger | 15% | 0.04 USDC |

The Baseline Agent is paid for winning. A classical method that beats the
quantum leg is a result the exchange bought and will pay for; only a receipt
that cannot be read goes unpaid.

## Claim discipline

- Capacity, cost and patient experience only. No diagnosis, no efficacy, no
  patient-outcome claim from an operational metric.
- Ranking "supports a clinician's review"; it never replaces it.
- Emulator is never written as hardware. See `references/execution-tiers.md`.
- "Quantum" in the name never implies "quantum-safe". Receipt provenance here
  is signed classically and that is an open hazard, stated as one.
- Two verdicts, never one: mechanism and performance are separate columns and
  the second never inherits the first's PASS.

## References

| Task | Read |
| --- | --- |
| What a receipt must carry, and how it is graded | `references/receipt-discipline.md` |
| Which execution tier a number belongs to | `references/execution-tiers.md` |
| The committed Nexus specification, and what a live run would add | `references/nexus-execution.md` |
