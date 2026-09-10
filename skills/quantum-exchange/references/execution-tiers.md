# Execution tiers

Every number carrying a hardware-adjacent claim must state its tier. These are
gates, not wordings: a claim that fails one is reworded or withdrawn.

| Tier | Meaning |
| --- | --- |
| `EXACT-CLASSICAL` | Deterministic classical computation, no sampling |
| `NOISELESS-SIM` | Statevector simulation, no shot noise |
| `SHOT-SIM` | Sampled simulation, shot noise only |
| `NOISY-EMULATOR` | Hardware-tier noise model, still not a device |
| `PHYSICAL-QPU` | A real trapped-ion device executed the circuit |

## The rule

**"QPU" is reserved for `PHYSICAL-QPU` and nothing else.** No run in this
project is physical-tier. Every quantum leg here is emulator-tier at most, and
the receipt's `backendQualifier` field exists so a device name can never be read
as hardware by a reader skimming a table.

A device name that shares a prefix with a QPU is not a QPU. An emulator
described as "hardware-accurate" is still an emulator. "Ran on H2" and "ran on
an H2-series emulator" are different sentences and only one of them is true here.

## Blocked is a tier decision too

The endoscopy lane needs 32 qubits against a 26-qubit emulator ceiling. There is
no execution lane, so there is no tier and no number. It publishes as
`assessed-blocked` with the ceiling named, at full size on the board. A
compile-only structural audit is the only lane available and it is labelled as
such.

## Where this is enforced

- `src/lib/receipts.ts` — `backendQualifier` is a separate field from `device`
- `src/data/runs.ts` — every committed record carries engine, device and qualifier
- `/evidence` — mechanism and performance verdicts rendered in separate columns
