# Fold the Hermes + Telegram learnings into the site

The operating discipline behind the exchange came from running a Hermes agent with
persistent memory and scheduled jobs, driven from Telegram on mobile. Those learnings
go into the pages that already exist — no new page, no new backend.

## Architecture page

Add a section, **How the agents are actually operated**, below the existing flow:

- **Four roles, four profiles.** Orchestrator / Research / Analysis / Synthesis maps
  one-to-one onto Trust, Nexus, Baseline and Registry. Each role carries its own
  identity and its own memory; they are not one agent wearing four hats.
- **Memory is the protocol, not the chat log.** Every scheduled run compares today's
  findings against what is already remembered and reports only what changed.
- **Cadence.** Small runs on a schedule beat weekend leaps — one job, one digest,
  one diff.
- **Credential hygiene.** Tokens never travel in a group chat, they rotate the moment
  they are exposed, and clinical text stays on the local machine.

Rendered as a compact four-card block in the existing card style, plus one line added
to the ASCII flow showing the control channel sitting beside — never inside — the
receipt path.

## Evidence page

Add a short panel, **Chat is not the evidence layer**, next to the seal panel:

- A message in a chat window is a convenience layer. A number only counts once it
  resolves to a committed receipt with its engine, shot count and seed.
- Anything triggered from a phone still runs the full order: classical floor,
  dequantization gate, quantum leg, graded receipt, post-quantum seal, anchor,
  settlement. The channel changes; the gate does not.
- Bulk sweeps and gating stay on the desktop runners; the mobile channel triggers
  small jobs and reads receipts back.

## Deck

Update the operating-model slide (or add one before the closing slide) with the same
four learnings, four bullets maximum, in the existing slide style.

## Footer / claim discipline

One clause added to the existing footer limits: a result relayed through a chat
channel is not evidence until its receipt digest is sealed and anchored.

## Technical notes

- Content lives in a new `src/data/operations.ts` export consumed by
  `src/routes/architecture.tsx`, `src/routes/evidence.tsx` and `src/data/deck.tsx`,
  so the wording exists once.
- Presentation only: no changes to `src/lib/exchange.functions.ts`, policy caps,
  receipt grading, Circle wallets or the deployed anchoring contract.
- No Telegram connection, bot token or webhook is added.
- Head metadata on the touched routes stays unique and unchanged in intent.
