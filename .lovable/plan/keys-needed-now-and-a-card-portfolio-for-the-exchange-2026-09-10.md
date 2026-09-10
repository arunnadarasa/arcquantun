# Keys needed now, and a card portfolio for the exchange

## Part 1 — the keys

Two keys unlock live money; the rest are IDs and addresses you get after the keys exist.

**Needed from you now (Circle account, Arc Testnet):**
- `CIRCLE_API_KEY` — Circle developer console, testnet key
- `CIRCLE_ENTITY_SECRET` — the 64-character hex entity secret you register with Circle

**Produced after those two exist** (I create the wallets through Circle and you paste the values back, or I read them from the wallet-create response and store them):
- `CIRCLE_TRUST_WALLET_ID` — the wallet that holds the pathway budget and pays
- `CIRCLE_REGISTRY_WALLET_ID` — the wallet that writes the anchor transaction
- `CIRCLE_BASELINE_ADDRESS`, `CIRCLE_NEXUS_ADDRESS`, `CIRCLE_REGISTRY_ADDRESS` — the three paid agents' receiving addresses

**Not a key, still required for live anchoring:** the `ReceiptAnchor` contract must be deployed and its address written into `src/data/contract.json` (currently `"deployed": false`). Until then, anchoring stays simulated even with the Circle keys present.

**Quantinuum Nexus:** no key is needed today. The Nexus results are committed specifications with fixed engine, shots and seed, which is what the receipts grade. A live `qnexus` submission would need a Nexus token and a server route, and that is a separate decision — say the word and I will plan it.

**Not needed:** no NVIDIA credentials. The NVIDIA material below is a public CC0 template family, not a service.

## Part 2 — the card specifications

Mirroring the NHS EndoTrack v2 pattern: a `SKILL.md` plus a `SKILL_CARD.md` per skill, with `references/` for detail, and a lane-level model card. Two new skills at the project root under `skills/`.

### `skills/quantum-exchange/`
- `SKILL.md` — what the exchange does: policy check, classical floor, dequantization gate, Nexus leg, receipt grading, anchoring, settlement, in that fixed order; the seven pathways; the qubit ceiling that blocks endoscopy.
- `SKILL_CARD.md` — purpose, when to use, key features, inputs/outputs, safety guidelines, in the EndoTrack v2 card shape.
- `references/receipt-discipline.md` — the fields a receipt must carry (engine, backend qualifier, shots, seed, commit, 4·√(0.5/shots) envelope), the PASS/FAIL/GAP/STRUCTURAL grades, and why a losing method is still paid.
- `references/execution-tiers.md` — the G1 tier vocabulary (EXACT-CLASSICAL, NOISELESS-SIM, SHOT-SIM, NOISY-EMULATOR, PHYSICAL-QPU) and the rule that nothing here is a QPU.
- `references/nexus-execution.md` — the committed Nexus specification per pathway and what a live submission would add.

### `skills/nvidia-card-portfolio/`
Adopting the NVIDIA Trustworthy-AI template family (CC0-1.0, `github.com/NVIDIA/Trustworthy-AI`), cited as the source.
- `SKILL.md` — the portfolio rule: transparency is a family of cards, not one card; which card covers which artefact.
- `SKILL_CARD.md` — the same card shape as above, for the portfolio procedure itself.
- `references/card-templates.md` — Model Card++, Data Card, Agent Card, System Card, Skill Card headings, with the **Evaluation Quad** (Evaluation Agent / Tasks / Metrics / Results) as a mandatory field on every card.
- `references/mapping.md` — how the templates map onto this project: Data Card = the pathway table and its classical floors; Agent Card = the four agents with their wallets, fee shares and caps; System Card = the receipt ledger plus the on-chain anchor; Skill Card = each gate's procedure; Model Card++ = one per pathway lane.

### Instance cards
- `cards/agent-card-exchange-agents.md` — the Trust, Baseline, Nexus and Registry agents: role, authority, spend cap, what each may not do.
- `cards/system-card-clinical-quantum-exchange.md` — the whole exchange: the fixed step order, the trust boundary, the demo-versus-live distinction, the limits.
- `cards/model-card-endoscopy-blocked.md` — the honest negative: a 32-qubit register above the 26-qubit ceiling, assessed-blocked, no result claimed.

## Technical notes
- Documentation only: no route, component, data or payment-path changes, and no new dependencies.
- Claim wording follows the existing rules — capacity, cost and patient experience only; no diagnosis, efficacy, outcome or "quantum-safe" claims; emulator is never called a QPU.
- Every card states its execution tier and its Evaluation Quad, so a judge reading only the card learns the claim, its limits, and how to re-derive it.
- Optionally, an `/architecture` link out to the cards. Say if you want the cards surfaced in the app; the plan as written keeps them as repository artefacts.
