# Clinical Quantum Exchange — Arc x Quantinuum

An agentic marketplace where NHS waiting-list pathways buy quantum-and-classical
signal assessments from independent compute agents, paid in USDC on Arc Testnet,
with every result anchored on-chain as a tamper-evident receipt.

Target bounty: **Best Agentic Economy Application with Circle Agent Stack** ($3,500).

## The story in one line

A Trust Agent holds a USDC budget for a waiting-list pathway. It posts a job.
Compute Agents (a classical baseline agent and a Quantinuum Nexus agent) bid,
run, and get paid per job in USDC — but only after the receipt hash is anchored
on Arc and the receipt passes its verdict checks.

## Why this is not a demo with a blockchain bolted on

The payment is the enforcement mechanism. An agent is paid only when it returns
a receipt carrying engine, backend qualifier, shot count, seed and verdict. A
receipt missing a field is a GAP and pays nothing. The classical baseline agent
runs first and gets paid first — if it wins, the quantum agent still gets paid
for the run and the record says the quantum method lost. Negative results are
first-class and settled.

## What gets built

### 1. Pathway board (home page)
Real NHS waiting-list pathways as signal cards, each with the clinical question
in clinician language, the classical floor, and the pathway's USDC budget.
Reused from the Quantum Health Signals scoring approach, trimmed to 6-8 signals.

### 2. Agent roster and wallets
Four agents, each with a real Circle developer-controlled wallet on Arc Testnet:
- **Trust Agent** — holds the pathway budget, posts jobs, releases payment
- **Baseline Agent** — classical surrogate / dequantization gate, runs first
- **Nexus Agent** — submits to Quantinuum Nexus (qnexus) via a Python runner
- **Registry Agent** — anchors receipt hashes, takes a small anchoring fee

Balances, addresses and a low-gas warning shown on screen.

### 3. Live job run
Pick a pathway, press Run. The board shows each step as it lands: policy check
(per-agent ticket cap and daily cap), classical floor recorded, dequantization
gate, Nexus job submitted with device / shots / seed / job id, receipt built,
hash anchored on Arc, USDC settled to each agent. Every settlement links to
Arcscan.

### 4. Receipt anchoring contract
A small Solidity contract deployed to Arc Testnet through Circle's Smart
Contract Platform (USDC gas, no EOA, no funded private key), verified on
Arcscan. It stores `keccak256(receipt JSON)` plus signal id, engine string and
shot count, and emits an event the UI reads back as the settlement ledger.

### 5. Verdict discipline, visible
Two separate columns on every result, never merged:
- **Mechanism** — inside `4*sqrt(0.5/shots)`? PASS / FAIL
- **Performance** — beat the classical floor? WIN / LOSS
Plus a receipt grade: PASS / GAP / STRUCTURAL / FAIL. Emulator is labelled
emulator; a blocked leg is published as assessed-blocked with its limit named.

### 6. Architecture diagram page
Required by the bounty. Agents, wallets, payment flows, the Nexus lane, the
anchoring contract — one page, printable.

## Quantum lane: direct Nexus

Nexus jobs cannot be submitted from the app's serverless runtime, and they cost
real HQCs. So:

- Runs are executed in the sandbox against **qnexus**, pinned, with the spend
  ledger, submit-time job persistence and the Bell control from the Quantinuum
  discipline.
- Results are committed as JSON under `src/data/runs/` and served statically.
- The app also exposes a **credential-free execution spec** per pathway (device,
  shots, seed, config class, verification rule) so a judge can see exactly what
  would be submitted. A spec is labelled a spec, never an execution.
- If a Nexus session is available during the build, real job ids and billed HQC
  figures land in the committed receipts; if not, that leg publishes as
  assessed-blocked with the reason, and the emulator leg carries the claim.

## Order of work (non-negotiable)

```text
pathway questions in clinician words
  -> classical floor recorded first
  -> dequantization gate
  -> Nexus / emulator run with shots + seed
  -> receipt envelope built and graded
  -> hash anchored on Arc
  -> USDC settled per agent
  -> two verdicts published, negatives at full size
```

## Technical notes

- Chain: Arc Testnet, chainId 5042002, RPC `https://rpc.testnet.arc.network`,
  explorer `https://testnet.arcscan.app`, USDC as native gas at 6 decimals.
- Circle: hand-rolled `fetch` client against `api.circle.com/v1/w3s` — no
  `@circle-fin/*` SDK (it breaks the Worker runtime). Entity secret re-encrypted
  per request; `feeLevel: "MEDIUM"`.
- Deploy: Circle Smart Contract Platform, `solc` pinned to 0.8.24, exact pragma,
  then Blockscout verification. Contract address + ABI written to a JSON file
  the UI reads, so redeploys need no code edit.
- Every server module boots with zero secrets and returns a realistic envelope
  flagged `simulated: true`. Nothing throws at module scope.
- Policy gate mirrors the agent settlement policy: per-agent `max_ticket_minor`
  and `daily_cap_minor`, checked before any transfer.
- All settlements write to one shared ledger, paginated at 10, with Arcscan
  links and confirmed/pending status from the Arcscan v2 API.
- Reads of chain history go through Arcscan v2 REST, not wide `eth_getLogs`.

## Secrets needed

`CIRCLE_API_KEY`, `CIRCLE_ENTITY_SECRET` (for real wallets and the deploy).
Optionally a Nexus token, used only in the sandbox runner — never in the app.
Without them the whole app still runs in demo mode.

## Claim discipline

No efficacy claims, no patient-outcome claims, no "quantum-safe" — the signing
path is classical and that is logged as an open hazard. Waiting-list framing is
capacity, cost and patient experience only. Every published number carries its
engine and shot count in the same view.

## Build order

1. Design system, pathway board, agent roster (demo mode, no secrets)
2. Receipt envelope model, verdict grading, settlement ledger
3. Circle wallets + USDC transfers on Arc Testnet
4. Anchoring contract: write, deploy via SCP, verify, wire the UI to it
5. Nexus runner in the sandbox, committed run JSON, execution specs
6. Architecture diagram page, SEO metadata, publish
