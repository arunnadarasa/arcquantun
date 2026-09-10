# Post-quantum receipts + the closing quantum gap

Circle's own research says two things this build can act on: the gap between quantum
capability and the power needed to break the signatures securing blockchain accounts is
closing, and Arc already supports SLH-DSA, a standardised post-quantum signature scheme.

Right now our evidence page carries an open admission: "receipt hashes are signed with
classical signatures, so the provenance chain is not quantum-safe end to end". This closes
that gap for real and shows the working.

## 1. Post-quantum signed receipts

Every receipt gets a genuine post-quantum signature before it is anchored and before any
payment clears.

- Replace the current lightweight receipt digest with a real SHA-256 digest.
- Sign that digest with SLH-DSA (the scheme Arc supports) using a pure-JavaScript
  implementation that runs in our server runtime.
- Verify the signature on the spot and record the verification result in the receipt.
- The run flow gains a step between "receipt graded" and "anchored": **post-quantum seal**.
  A receipt that fails verification is not anchored and not paid — same discipline as a
  failed grade.
- The evidence page shows, per receipt: digest, scheme name, public-key fingerprint,
  signature fingerprint, signature size, and a verified badge.
- The settlement ledger records the seal alongside the anchor transaction.

The honesty section is rewritten rather than deleted: the receipt seal is post-quantum, the
Arc transaction that anchors it is still signed with classical ECDSA today, so the chain is
post-quantum at the evidence layer and hybrid below it. That distinction is stated plainly.

## 2. A quantum-gap page

New page at `/quantum-gap`, linked in the top navigation and shown on the evidence page.

- The two figures from Circle's tracker: logical qubits demonstrated, and logical qubits
  needed to break ECDSA — the tracker figures only, each with the tracker link and the date
  we read them.
- A simple gap visual using the site's existing meter and reveal treatment.
- Why it matters for a clinical evidence ledger: a receipt is meant to be checkable years
  later, so its provenance has to outlive today's signatures.
- What Arc provides today (SLH-DSA support, ECDSA transactions, hybrid intent) and what
  this app therefore does and does not claim.
- Both figures attributed to Circle Research; no endorsement by Circle is implied.

## 3. One new deck slide

A slide placed after the honesty slide: the gap figures, the seal we apply, and the one
sentence about what is still classical. Four bullets maximum, same styling as the rest.

## Technical notes

- `@noble/post-quantum` provides SLH-DSA in pure JS with no native binaries, so it is safe
  in the worker runtime. Signing happens server-side only.
- `receiptHash()` in `src/lib/receipts.ts` becomes an async SHA-256 via Web Crypto; call
  sites in `src/lib/exchange.functions.ts` are already inside async handlers.
- Seal key material: a demo keypair is derived deterministically from a fixed seed so the
  build works with zero secrets; if a `PQ_SIGNING_SEED` secret is set, that is used instead.
  The public key is published in the receipt; the private seed never leaves the server.
- SLH-DSA signatures are several kilobytes, so the on-chain anchor keeps carrying the
  digest, not the signature; the receipt stores the full signature and the page shows a
  fingerprint of it.
- New files: `src/lib/pq-seal.server.ts`, `src/data/quantum-gap.ts`, `src/routes/quantum-gap.tsx`.
  Edited: `receipts.ts`, `exchange.functions.ts`, `ledger.ts`, `evidence.tsx`, `deck.tsx`,
  `shell.tsx`.

## Unchanged

Seven-step run order (with the seal inserted, not reordered), Arc Testnet only, Circle
wallets and USDC payouts, the blocked endoscopy lane, the classical-floor and
dequantization gates, and every clinical claim limit.
