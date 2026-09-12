# Quantum Arc Health — Clinical Quantum Exchange

An agentic marketplace where NHS waiting-list pathways buy quantum and classical assessments from independent agents — and payment clears **only against a graded, receipt-sealed result anchored on Arc Testnet**.

Built for the Arc blockchain × health hackathon track, with a clinical-quantum lens. No quantum-advantage claim is made anywhere in this project; advantage is something a run has to earn, and the repo publishes the times it was assessed-blocked as loudly as the times it ran.

**Live app**: [arcquantun.lovable.app](https://arcquantun.lovable.app) · **Built with [Lovable](https://lovable.dev)** · 216 commits

---

## What the exchange does

Eight NHS capacity questions (endo-triage, gynae-backlog, derm-2ww, msk-physio, cardio-echo, endoscopy-slots, mh-capacity, rare-subgroup) go through a fixed seven-step pipeline:

```text
policy check → classical floor → dequantization gate → quantum leg
             → receipt grading → on-chain anchor → USDC settlement
```

Reordering any step invalidates the result it produces. A floor computed after a quantum result is a rationalisation; an anchor written after payment is not a receipt.

### Four agents, one job each

| Agent | Role | Authority | Refuses when |
|---|---|---|---|
| **Trust** | Holds the pathway budget, posts jobs, releases payment | 0.50 USDC/job, 5.00/24h | Any required receipt field missing; no envelope; envelope contradicted |
| **Baseline** | Runs the classical floor + dequantization gate, always first | 0.12 USDC/job, 1.20/24h | Asked to run after a quantum result exists |
| **Nexus** | Submits circuits to Quantinuum Nexus, returns a graded receipt | 0.15 USDC/job, 1.50/24h | Register wider than the emulator ceiling → returns `assessed-blocked`, never a number |
| **Registry** | Anchors the receipt hash on Arc, serves the settlement ledger | 0.04 USDC/job, 0.40/24h | The grade is not PASS |

Each agent carries its own identity (`trust.clinicalquantum.eth`, `baseline.clinicalquantum.eth`, …), its own memory, and never grades its own work. Spend authority is bounded **before** any transfer, and no transfer has been observed outside a cap.

### The trust boundary: the receipt

A receipt carries `engine`, `backend qualifier`, `shots`, `seed` and `verdict` (`qas/envelope/0.1`). Everything upstream of it is a claim; everything downstream is settlement; nothing crosses it ungraded — and only a PASS receipt pays.

Receipts are then sealed with **SLH-DSA** (NIST FIPS 205, via `@noble/post-quantum`) — the post-quantum signature scheme Arc supports. The app is explicit that this is a *hybrid* chain: the Arc transaction anchoring the seal is still ECDSA-signed today, so the project says so rather than claiming "quantum-safe".

### Honesty discipline (the parts that make this worth reading)

- **The classical floor is a family, not a number.** Plain, balanced, resampled and tuned members are all run; the best one is the bar, and it is recorded *before* the quantum leg. A comparison against a single unpowered baseline can never read as a win.
- **Bars are pre-registered.** `prereg/<pathway>@<commit>` bars and their amendments are committed before the compute they govern. Amendments fix the tool — never the target.
- **Blocked lanes are published at full size.** The endoscopy-slots pathway needs a 32-qubit Ising register; the account's Nexus emulator ceiling is 26 qubits. That lane returned `assessed-blocked` with the limit named — a model card exists for it, with no number to interpret and none inferred.
- **No clinical claims.** These are capacity, cost and patient-experience questions — never diagnosis, efficacy or outcome improvement.

## Live integrations

| Layer | State |
|---|---|
| **Quantinuum Nexus** | Connected and smoke-tested 2026-09-12 (H2-Emulator: bit-order probe + Bell control, 128 shots, PASS, 0 billed HQC). `src/data/nexus-live.json` |
| **Quantum legs** | Run offline (jobs cost real HQCs, can't run in the serverless runtime); results committed statically in `src/data/runs.ts` |
| **On-chain anchoring** | **Deployed and verified** — [`ReceiptAnchor.sol`](contracts/ReceiptAnchor.sol) at `0xd924f134e69f678e09bd31394f975b3cdbd2f52f` on Arc Testnet (chain 5042002, [testnet.arcscan.app](https://testnet.arcscan.app)) |
| **ENS agent namespace** | [`AgentResolver.sol`](contracts/AgentResolver.sol) — single-name ENSIP-10 wildcard resolver for `*.clinicalquantum.eth` (Sepolia) |
| **USDC settlement** | Simulated until Circle testnet keys are configured — envelopes flagged `simulated: true` |
| **World ID** | Human-authority gate on budget release (Selfie Check credential, `budget-release` action); the RP signing key is server-only |
| **AgentBook** | The 4 agents are queued for registration at `world.org`; sandbox entitlement requested 2026-09-12, payloads staged in `src/data/agentbook.json` |

## Pages

| Route | What it is |
|---|---|
| `/` | Pathway board — pick a question, run the pipeline, watch the bar vs the floor |
| `/agents` | The four agents, their caps, refusals and fee shares |
| `/identity` | ENS namespace + World ID human authority |
| `/human` | Where the human sits in the loop (authorisation, not delegation) |
| `/ledger` | Browser-local settlement ledger, paginated |
| `/evidence` | Committed run records + live post-quantum receipt sealing |
| `/quantum-gap` | The Circle Research quantum tracker framing (96 demonstrated logical qubits vs 824 needed to break ECDSA, read 2026-09-10) |
| `/architecture` | Components, trust boundary, fixed order of operations |
| `/deck` | The demo deck (slide navigation + print view) |

## Repo layout

```text
cards/        NVIDIA Trustworthy-AI Agent / Model / System cards (CC0-1.0 template)
contracts/    ReceiptAnchor.sol (Arc) · AgentResolver.sol (Sepolia ENS)
feedback/     world-sandbox notes
scripts/      bootstrap-wallets, deploy-contract, ens-register, ens-resolver,
              verify-arc, agentbook-register, quantum/
skills/       agent skills shipped with the repo (quantum-exchange, nvidia-card-portfolio)
src/
  data/       committed ground truth: runs, pathways, nexus-live, agentbook,
              quantum-gap, agents, operations
  lib/        pq-seal (server-only SLH-DSA), receipts, policy, ledger, arc-chain, world
  routes/     the pages above
```

## Tech stack

[TanStack Start](https://tanstack.com/start) (React 19 · Vite 8 · TypeScript) · Tailwind CSS v4 · Radix UI · Recharts · viem (EVM) · [@worldcoin/idkit](https://worldcoin.org) · `@noble/post-quantum` (SLH-DSA) · solc 0.8.24 · zod · bun.

## Development

```sh
git clone https://github.com/arunnadarasa/arcquantun.git
cd arcquantun
bun install        # or: npm i
bun run dev        # or: npm run dev  →  http://localhost:5173
```

Other scripts: `bun run build` / `bun run lint` / `bun run format`.

Server-only secrets (World ID RP signing key, Circle keys, wallet seeds) live in environment variables and never appear in the repo — there is a dedicated `scripts/entity-secret.mjs` for generating them.

## Built with Lovable

- **Ship faster** — describe what you want and Lovable handles the code in the [Lovable editor](https://lovable.dev/projects/9306ea96-b091-4e2f-a363-fa86dc81cbf5).
- **Stay in sync** — every Lovable change commits straight to this repository.
- **Full ownership** — push to `main` and changes sync back into Lovable, ready for the next prompt.

> ⚠️ The repo is connected to Lovable: don't force-push or rewrite published history, or the Lovable-side project history is lost.

## Credits

NVIDIA Trustworthy-AI card templates (CC0-1.0) · Circle Research quantum tracker (source only, no endorsement implied) · Quantinuum Nexus (H2-Emulator) · Worldcoin World ID · [Lovable](https://lovable.dev). Companion builds referenced during development: Arc Blockchain Catalyst, StreetRail, Quantinuum Catalyst, Quantum Singapore NHS, Quantum Health Signals, NHS EndoTrack v2.