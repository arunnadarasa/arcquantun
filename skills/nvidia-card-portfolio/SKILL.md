---
name: nvidia-card-portfolio
description: Transparency card portfolio for the Clinical Quantum Exchange, adopting the NVIDIA Trustworthy-AI template family (Model Card++, Data, Agent, System, Blueprint, Container, Skill cards) with a mandatory Evaluation Quad. Use when a lane reaches a verdict, an agent gains authority, or a judge must audit a claim from documents alone.
---

# NVIDIA Card Portfolio Skill

**Transparency is a family of cards, not a single card.**

Template source: NVIDIA Trustworthy-AI, CC0-1.0,
`github.com/NVIDIA/Trustworthy-AI` — Model Card++ / Data Card / Agent Card /
System Card / Blueprint Card / Container Card / Skill Card, plus the CycloneDX
property taxonomy. Reuse is free; the citation is not optional.

## The portfolio rule

Any lane that reaches a verdict — null or positive, mechanism or measurement —
ships its cards in the same commit as the verdict. The model card is the
lane-level instance; the portfolio is the programme-level instance. A verdict
committed without its cards is incomplete work, not fast work.

## Which card covers what

| Card | Covers | Instance here |
| --- | --- | --- |
| Data Card | provenance of every input | the pathway table and its recorded classical floors |
| Agent Card | an autonomous actor with authority | the four exchange agents, their wallets, fee shares and caps |
| System Card | the assembled system and its boundary | the exchange: run order, receipt ledger, on-chain anchor |
| Skill Card | one repeatable procedure | each gate — policy, floor, dequantization, grading, anchor |
| Model Card++ | one lane's verdict | one per pathway, including the blocked one |
| Blueprint / Container Card | deployment shape | not used; the app is a single Worker deployment |

## The Evaluation Quad — mandatory on every card

Four fields, on every card in the portfolio, with no exceptions:

- **Evaluation Agent** — who or what performed the evaluation, and whether it was seeded
- **Evaluation Tasks** — the exact tasks evaluated
- **Evaluation Metrics** — the metrics and their tolerances
- **Evaluation Results** — the measured outcome, including nulls, stated plainly

A card without the Quad is a brochure. The test of a finished card is that a
judge who reads only the card learns the claim, its limits, and how to re-derive
the verdict.

## Non-negotiables carried into every card

- State the execution tier, and never call an emulator a QPU
- State what the result does **not** assert with equal weight to what it does
- Name honest limits: qubit ceiling, shot budget, synthetic cohorts, confounders not controlled
- State the deployment boundary — for this project, "attestation and capacity planning, not prediction"

## References

| Task | Read |
| --- | --- |
| Card headings and required fields | `references/card-templates.md` |
| How the templates map onto this project | `references/mapping.md` |

Instance cards live in `cards/` at the repository root.
