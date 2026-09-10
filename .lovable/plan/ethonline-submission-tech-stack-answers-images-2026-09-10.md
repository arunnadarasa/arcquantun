# ETHOnline submission: tech stack answers + images

Two things: the exact values to select in the ETHGlobal form, and three generated
image assets (logo, cover, plus screenshots captured from the live app).

## Tech Stack form answers

**Ethereum developer tools** — Alchemy

**Blockchain networks** — Arc (already selected)

**Programming languages** — TypeScript, JavaScript, Solidity, Python, Bash/Shell

**Web frameworks** — React (add "TanStack Start" via the free-text "other technologies" box if React is the closest match in the list)

**Databases** — None (the app has no database; runs are committed JSON and the
settlement ledger is browser-local)

**Design tools** — None

**Other specific technologies / libraries / tools** (type and hit enter for each):
Lovable, TanStack Start, TanStack Router, Vite, Tailwind CSS, Bun,
Circle Developer-Controlled Wallets, Circle Smart Contract Platform, USDC,
Arcscan, solc 0.8.24, @noble/post-quantum (SLH-DSA / FIPS 205), Quantinuum Nexus (qnexus), Playwright

**Describe how AI tools were used:**

> Built with Lovable as the primary AI development environment: it wrote the
> TanStack Start front end, the run-orchestration server functions, the receipt
> grading and post-quantum sealing modules, the Solidity ReceiptAnchor contract
> and the Circle deployment/bootstrap scripts, and drove browser testing with
> Playwright. Two authored skill specifications in `skills/` (quantum-exchange
> and nvidia-card-portfolio) plus the NVIDIA-style cards in `cards/` constrain
> what the agent is allowed to claim — the fixed seven-step run order, the four
> receipt grades, and the clinical-claim limits. Planning artefacts for every
> build step are committed under `.lovable/plan/`.

## Images

Three assets, in the app's amber-and-teal palette so they match the live site.

1. **Logo** — 512×512 square. A minimal mark: an amber-and-teal atomic/orbital
   glyph fused with a receipt/ledger stamp, flat vector, dark navy background.
   Saved to `/mnt/documents/eth-submission/logo.png`.
2. **Cover image** — 1920×1080 (16:9). Dark aurora background matching the app,
   the title "Clinical Quantum Exchange" and the line "Agents paid in USDC only
   when the receipt survives reading". Generated at premium quality for legible
   text.
3. **Screenshots** (minimum 3, captured from the running app with Playwright at
   1280×800 so they are real product shots, not renders):
   - Home pathway board with a completed run ledger
   - Evidence page showing a graded receipt and its SLH-DSA seal
   - Architecture or ledger page showing the Arc settlement rows
   - Optionally the `/quantum-gap` page

   Each screenshot is then framed with the product-shot generator (macOS window
   frame, mesh gradient, `midnight` preset) and saved under
   `/mnt/documents/eth-submission/`.

## Notes

- No app code changes. Nothing in `src/` is touched.
- Screenshots are captured from the live preview, so they show real values —
  no invented figures.
- All files land in the project Files panel for download and upload to ETHGlobal.
