# Card templates

Adopted from NVIDIA Trustworthy-AI (CC0-1.0, `github.com/NVIDIA/Trustworthy-AI`).
Headings below are the minimum; add fields, never remove them.

## Common to every card

1. **Purpose** — the decision being supported, in plain language
2. **Claim class** — what this asserts, and with equal weight what it does not
3. **Execution tier** — `EXACT-CLASSICAL` / `NOISELESS-SIM` / `SHOT-SIM` / `NOISY-EMULATOR` / `PHYSICAL-QPU`, or `n/a`
4. **Evaluation Quad** — Evaluation Agent / Tasks / Metrics / Results
5. **Honest limits** — ceilings, budgets, confounders not controlled
6. **Deployment boundary** — how this artefact may and may not be used
7. **Provenance** — commit, date, author, licence of anything reused

## Model Card++

Adds: task definition; classical baseline and quantum lane on the same axes;
tolerance used; measured value; both verdicts (mechanism, performance); the
smallest faithful subspace used; the pre-registered decision rule and when it was
written.

## Data Card

Adds: source and accession URL; licence; checksums; row and column counts as
declared before the fetch; documented defects; synthetic-versus-real declaration;
label chain traced from source file to label. A bare link is not provenance.

## Agent Card

Adds: role; authority granted; wallet and network; per-job ceiling and rolling
24-hour cap; decision logic in one paragraph; refusal conditions; what the agent
may **not** do; escalation path when it refuses.

## System Card

Adds: components and their boundary; the fixed order of operations; trust
boundary and what crosses it; demo-versus-live distinction; failure modes and
what each looks like to a user; residual hazards.

## Skill Card

Adds: when to use; inputs and outputs; step order; the pass/fail line written
before the run; safety guidelines. This is the shape of every `SKILL_CARD.md`
in `skills/`.

## Blueprint and Container Cards

Deployment topology and runtime image provenance. Not used in this project — a
single Worker deployment with no container artefact. Recorded here so the
omission is deliberate rather than forgotten.

## CycloneDX property taxonomy

Where cards are emitted as machine-readable metadata, use the CycloneDX property
names from the same NVIDIA repository rather than inventing keys.
