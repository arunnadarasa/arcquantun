# Fold the 11 September run learnings into the exchange

Four findings from the latest committed runs change what the exchange should grade, not
just what it says. Each one becomes a real field and a real gate, then gets surfaced.

## 1. The classical floor must be a powered one

A quantum-kernel "win" was found to have been measured against an unpowered baseline; one
standard classical turn (balanced class weights) beat it. So a floor is no longer a single
number — it is a family.

- Each pathway records the whole classical family it was tested against: plain, balanced,
  resampled, tuned kernel — with the best of the family as the floor to beat.
- A performance verdict measured against only one unpowered method can never read WIN. It
  reads `UNPOWERED-FLOOR` and the receipt drops to GAP, with the reason named.
- Existing pathways get their family filled in; where only a single method exists, that is
  stated rather than quietly upgraded.

## 2. Honest negatives are kept at full size

Emulator runs are graded in three committed bands instead of pass/fail:

| band | meaning |
|---|---|
| sI-PASS | inside the pre-committed tolerance at every probe |
| sII-DEGRADED | signal direction survives, magnitude does not |
| sIII-FAIL | outside the degraded bar at any probe |

A sII or sIII result is published with its diagnosis and pays nothing. It is never re-run
to chase a seal. Two real committed runs are shown as worked examples: a parity-coded
sampler that held under emulator noise (4.8% of shots error-detected and discarded, kept
cohort within band), and a coherence-sensitive estimator that lost about a third of its
magnitude and failed its own pre-registered bar.

## 3. Cohort fitness is checked before any budget moves

Before a quantum leg is funded, the cohort gets a classical ceiling sweep: best achievable
recall across sample sizes up to a large oracle fit. If that ceiling sits below the bar,
the cohort is `unfit-cohort` — the signal is weak, not the data scarce — and the Trust
Agent spends nothing. This is a new refusal class, distinct from the existing
hardware-blocked one, and appears as its own status on the board.

## 4. Pre-register, then amend before compute

Each run record carries its pre-registration and its amendment chain, with the rule stated
plainly: amendments are committed before the compute they govern, and they fix the tool,
never move the target. The amendment chain is rendered as a short trail on the evidence
page so a reader can see the bars were set first.

## Where it shows up

- **Evidence** — the three bands, the two worked runs with their job references, and the
  amendment trail.
- **Home board** — the new `unfit-cohort` status and the floor-family line on each card.
- **Architecture** — a cohort-fitness stage added to the pipeline ahead of the
  dequantization gate, and the powered-floor rule in the ordering discipline.
- **Deck** — one slide covering the honest floor and the kept negative.
- **Skill card** — the same rules added to the quantum-exchange safety list.

## Technical notes

- `src/lib/receipts.ts`: add `noiseTier`, `band` (`sI-PASS` / `sII-DEGRADED` /
  `sIII-FAIL`), `preRegistration` and `amendments` to the envelope; extend `gradeReceipt`
  so a non-sI band and an unpowered floor both force a non-PASS grade; `isPayable` stays
  the only payment gate.
- `src/data/pathways.ts`: `classicalFloor` gains a `family` array; new status
  `unfit-cohort` with a `ceiling` record.
- `src/data/runs.ts`: fill the new fields on existing records and add the two committed
  emulator runs as reference records.
- No change to Circle wallets, policy caps, the deployed anchor contract or the sealing
  path. Nothing new is claimed as physical-QPU work; every added run stays labelled
  emulator tier.
