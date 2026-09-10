# Slide deck for the ETHOnline 2026 submission

A presentation deck built into the app at `/deck`, sized and paced for the required 2–4 minute demo video and the five judging criteria.

## What the submission page requires

- Submission by Sunday 13 September 2026, 12:00 EDT
- A 2–4 minute demo video, 720p or better, spoken narration, no sped-up footage
- Slides used to summarise key points, **no more than 4 bullet points per slide**
- Up to 3 partner prizes selected; ours is Arc's Agentic Economy track
- AI-tool use documented, and spec/planning artefacts included in the repo — the `skills/` and `cards/` folders already do this
- Judged on Technicality, Originality, Practicality, Usability, WOW Factor

## The deck

Eleven slides, one idea each, written to be read aloud in under four minutes. Every number comes from the app's own committed data — no invented figures.

1. **Title** — Clinical Quantum Exchange. Agents paid in USDC for clinical assessment work that survives reading.
2. **The problem** — NHS waiting-list questions are assessed constantly; nothing records whether the assessment was legible.
3. **The idea** — payment conditional on a receipt a stranger can re-check.
4. **The seven-step order** — policy, classical floor, dequantization gate, quantum leg, grading, anchor, settlement. The diagram, not a bullet list.
5. **The four agents** — role, fee share, spend ceiling.
6. **The receipt** — the fields, and the four grades. Only PASS pays.
7. **The blocked lane** — endoscopy at 32 qubits against a 26-qubit ceiling. Published at full size, paid nothing. This is the WOW slide.
8. **Arc and Circle** — Arc Testnet, USDC as gas, Circle wallets, the on-chain anchor before money moves.
9. **Live demo cue** — a held slide that tells the presenter to switch to the app and run a job.
10. **What is real, what is simulated** — stated plainly, since honesty is the pitch.
11. **Close** — what it would take to run live, and the deployment boundary.

## How it is built

A fixed 1920×1080 stage scaled with `transform: scale(...)` to fit any window, so the deck records cleanly at 720p or above and reads on a phone.

- New route `/deck`, with the current slide in the URL (`/deck?slide=3`) so a reload keeps its place and a link opens on the right slide.
- New `src/components/slide.tsx` — the scaled stage plus semantic type classes (`slide-title`, `slide-body`, `slide-kicker`, `slide-chrome`) added to `src/styles.css`, sized for projection: 88px titles, 32px body, 20px chrome.
- New `src/data/deck.tsx` — the eleven slides as data, so wording changes never touch layout.
- Keyboard control: arrow keys and space to move, `F` for fullscreen, `G` for a grid of all slides, `Esc` to leave.
- A `?print` view that stacks every slide one per page, so `Cmd+P → Save as PDF` produces a handout matching the screen exactly.
- Deck styling reuses the existing amber-and-teal palette, aurora background and glass panels, so the deck and the app look like one thing.
- A "Deck" link added to the shell navigation, and the aurora background kept off the fullscreen presenting view to keep the recording clean.

## Content rules carried over

- Capacity, cost and patient experience only; no diagnosis, efficacy or patient-outcome claim.
- Emulator is never called a QPU.
- The blocked lane and the simulated payment path are both on their own slides rather than in a footnote.
- No figure appears on a slide that is not already in `src/data/pathways.ts`, `src/data/agents.ts` or `src/data/runs.ts`.

## Technical notes
- Files: new `src/routes/deck.tsx`, `src/components/slide.tsx`, `src/data/deck.tsx`; edits to `src/styles.css` and `src/components/shell.tsx`.
- No new dependencies, no backend change, no change to the run order, receipts, grading or settlement code.
- `/deck` gets its own page title and description; the deck is a content route, not a replacement for any existing page.
