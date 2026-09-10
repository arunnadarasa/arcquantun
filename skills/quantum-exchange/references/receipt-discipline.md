# Receipt discipline

Schema: `qas/envelope/0.1`. Implemented in `src/lib/receipts.ts`.

## Required fields

| Field | Why it is required |
| --- | --- |
| `claims[]` | Sentences that could be false, not topics. No claim, no receipt. |
| `engine` | The software stack that produced the number. |
| `backendQualifier` | `emulator` / `hardware` / `simulator` / `not-run`, kept in its own field so a device name can never be read as hardware. |
| `shots` | Without it the tolerance cannot be derived. |
| `seed` | Without it the run is not replayable. |
| `commit` | Ties the number to the source that produced it. |
| `envelope` | `4*sqrt(0.5/shots)`, stored so a later reader can re-decide the verdict rather than trust ours. |
| `measured` | The value the verdict is judged against. |
| `mechanism` | `PASS` / `FAIL` / `BLOCKED`. |
| `performance` | `WIN` / `LOSS` / `TIE` / `NOT-RUN`. |
| `bellAnticorrelated` | Control on a Bell pair in the same job. Outside tolerance rejects the whole batch. |
| `jobId`, `device`, `estimatedHqc`, `billedHqc` | Cost and traceability. |
| `blockedReason` | Mandatory whenever `mechanism` is `BLOCKED`. |

## Two verdicts, never one

`mechanism` asks whether the circuit did what it was supposed to, inside
`4*sqrt(0.5/shots)`. `performance` asks whether it beat the classical floor.
They are separate columns. A mechanism PASS says nothing about performance, and
the UI must never render them merged.

## The four grades

- **PASS** — envelope complete and internally consistent. The only payable grade.
- **GAP** — information is missing (shots, seed, engine, commit, claim), or the
  leg is `assessed-blocked`. A gap is not a false claim; it is an incomplete one.
- **STRUCTURAL** — no recognised envelope is attached at all.
- **FAIL** — the envelope is present and contradicted: a stated verdict that the
  measured value refutes, or a failed Bell control.

## Why a loss is still paid

The exchange buys an assessment, not a favourable answer. A Baseline Agent whose
classical method beats the quantum leg has delivered exactly what was
commissioned and is paid in full. Non-payment is reserved for a receipt that
cannot be read: GAP, STRUCTURAL, FAIL. That is the only incentive in the system,
and it points at legibility rather than at optimism.

## Hashing and anchoring

The receipt hash is computed over the whole envelope and written to the
`ReceiptAnchor` contract on Arc Testnet before any settlement leg runs. An
unanchored receipt is not payable. In demo mode the hash is real and the
transaction is a deterministic simulated envelope flagged as such — never
presented as an on-chain write.
