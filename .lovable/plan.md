# Put the cost formula and the reviewer's feedback on the site

The credit formula and the operating envelope currently exist only in the code and on the Job sizing page. This makes the reviewer's guidance visible as guidance — named as external review from a Quantinuum engineer, no person named — and puts the formula on a deck slide so it shows in the pitch.

## 1. A reviewer-feedback block on the Job sizing page

A new section under the formula, headed so the source is plain: "Reviewer feedback from a Quantinuum engineer". Four short grouped items, written as rules we now follow:

- **Gate, qubit and shot limits** — two-qubit gates target 100 per circuit, hard stop 1000, ceiling 2000 with noise; 4–20 qubits for a demonstrator, 30+ before classical simulation stops being easy; 128–512 shots typical, 1024 only with a stated reason.
- **What actually drives the bill** — the +5 is charged per circuit, so circuit count dominates for small circuits; two-qubit gates count ten times a one-qubit gate; cost is linear in shots.
- **Hardware reality** — a million shots is not possible on Helios (98 qubits); allowable shots fall as the two-qubit gate count rises, so the two-qubit fidelity spec and the shot count belong in the same sentence.
- **Budget framing** — 10,000 credits is a normal project, 100,000 a showcase; cheaper is better, and the guard refuses rather than overspends.

Each item carries a one-line note on how it is enforced in the run (the sizing preflight refuses by name before upload), so the page reads as a spec rather than a quote.

## 2. A deck slide

One new slide, placed straight after the existing quantum-gap slide: the formula on the left in mono type, the before/after numbers on the right (3,751 credits sized by hand → 885 credits sized by the model, same question and same cohort), and a footer line attributing the envelope to reviewer feedback from a Quantinuum engineer. Same visual language as the existing slides.

## 3. Formula visibility

The formula stays as the single source on the sizing page and is repeated verbatim on the slide. No change to the numbers, the candidate table, or anything that runs.

## Technical notes

- `src/data/nexus-cost.json` gains a `reviewerFeedback` array (group, points, enforcement) and an `attribution` string. Existing keys untouched, so the sizing page and the cost report stay valid.
- `src/routes/sizing.tsx` renders the new section from that data.
- `src/data/deck.tsx` gains one slide entry; the deck length and navigation pick it up automatically.
- No script, circuit, job, or settlement code changes. Nothing is submitted or billed.
