# NVIDIA Card Portfolio Skill Card

## Purpose
Ship the transparency card family alongside every verdict, so a claim can be
audited from documents alone.

## When to Use
- When a research or assessment lane reaches a verdict, positive or null
- When an agent is given authority to spend, sign or publish
- When a dataset enters the project
- When preparing artefacts for a judge, reviewer or clinical governance reader
- When a gate's procedure changes and its Skill Card falls out of date

## Key Features
- Seven-template family adopted from NVIDIA Trustworthy-AI (CC0-1.0, cited)
- Evaluation Quad mandatory on every card
- Cards committed in the same commit as the verdict they describe
- Explicit claim-class field: what the result asserts and what it does not
- Deployment-boundary field on every card

## Input/Output
**Inputs:**
- The verdict and the artefacts that produced it
- Data provenance: source, licence, checksums, documented defects
- The classical baseline and the quantum lane, on the same task and axes
- Execution tier and honest limits

**Outputs:**
- One or more completed cards under `cards/`
- A reproducibility contract a third party can act on without asking us anything

## Evaluation Quad
- **Evaluation Agent:** human review against this checklist; no model grades a card
- **Evaluation Tasks:** every committed card in `cards/`
- **Evaluation Metrics:** all mandatory fields present; Evaluation Quad complete; execution tier stated; claim class states the negative
- **Evaluation Results:** three instance cards committed — Agent, System, and the blocked-lane Model Card++

## Safety Guidelines
- Never ship a verdict without its cards
- Never omit the Evaluation Quad, and never fill it with a topic instead of a result
- Never state a claim without stating, with equal weight, what it does not claim
- Never cite a bare dataset link as provenance
- Always cite `github.com/NVIDIA/Trustworthy-AI` (CC0-1.0) when using the templates
- A card that fails a check is reworded or withdrawn, never passed
