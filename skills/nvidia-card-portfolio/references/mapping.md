# Mapping the templates onto this project

| Template | Instance in the Clinical Quantum Exchange | Source of truth |
| --- | --- | --- |
| Data Card | the seven pathways: cohort shape, classical floor recorded first, synthetic declaration | `src/data/pathways.ts` |
| Agent Card | Trust, Baseline, Nexus, Registry — wallets, fee shares, ceilings, refusal conditions | `src/data/agents.ts`, `src/lib/policy.ts` → `cards/agent-card-exchange-agents.md` |
| System Card | the whole exchange: fixed run order, receipt ledger, on-chain anchor, demo-versus-live | `src/lib/exchange.functions.ts`, `src/lib/ledger.ts` → `cards/system-card-clinical-quantum-exchange.md` |
| Skill Card | each gate's procedure — policy, classical floor, dequantization, grading, anchoring | `skills/*/SKILL_CARD.md` |
| Model Card++ | one per pathway lane, including the blocked one | `src/data/runs.ts` → `cards/model-card-endoscopy-blocked.md` |
| Blueprint / Container Card | deliberately unused — single Worker deployment, no container artefact | — |

## Data Card notes specific to this project

Every cohort is **synthetic**. That is stated on the card, on the pathway board
and in the evidence page, because a reader who assumes real patient data would
draw conclusions the data cannot support. There is no patient-level data in this
project and no DPIA is claimed.

## Agent Card notes specific to this project

Authority here is spend authority on Arc Testnet, denominated in testnet USDC.
Every agent card states its per-job ceiling and rolling 24-hour cap, and the
policy gate that enforces them runs **before** any transfer, not after.

## System Card notes specific to this project

The trust boundary is the receipt. Everything upstream of it is claim; everything
downstream of it is settlement. The card states plainly which parts run live
(the app, the grading, the ledger) and which are simulated envelopes flagged
`simulated: true` (Circle payments and the on-chain anchor, until the keys and
the deployed contract exist).

## Model Card++ notes specific to this project

The blocked endoscopy lane gets a full card, at the same size as an assessed
lane. A limit that stops a run is a finding. Publishing it small is how a project
starts hiding.
