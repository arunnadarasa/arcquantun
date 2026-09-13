# Ledger: device-backed approval and Key Ring secrets

Two Ledger prize rows, one implementation: Continuity ($1,500) — this project already existed and gains a hardware signer — and AI Agents x Ledger ($3,500) — an autonomous agent stack where the device holds secrets and approves spend. Submissions close today, so the build is scoped to what can be demonstrated live with your device plugged in.

## What Ledger adds that isn't here today

Right now a run is authorised by a World human proof and an ENS agent identity, then the four Circle wallet agents move real USDC on Arc with no hardware in the loop. The private keys and the Circle entity secret live in project secrets — software all the way down.

After this:

- **Nothing irreversible happens without a device tap.** Before any budget is released, the Ledger signs the exact receipt digest, pathway and amount shown on its screen. No signature, no settlement — the run publishes `assessed-unapproved` and settles 0.00 USDC.
- **The agent never sees the API key.** The Circle entity secret and the Nexus token move onto the Key Ring, encrypted under keys derived from your Ledger seed. The local broker decrypts and hands the agent a scoped, short-lived capability instead of the key itself.
- **A clear before/after** on the evidence page: the same pathway, run once without the device and once with it, side by side.

## How it fits together

The app runs in an edge worker, which cannot talk to USB. So the device is driven by a small local bridge you run next to the app, and the browser talks to it directly.

```text
browser  ──approve(digest, pathway, amount)──▶  local bridge (127.0.0.1)
                                                   │ wallet-cli / DMK
                                                   ▼
                                              Ledger device  (screen shows
                                                              digest + amount)
browser  ◀──────── signature ─────────────────────┘
   │
   └─ signature + device address ──▶ server: recover, compare to enrolled
                                     address, fold into receipt, then seal,
                                     anchor, settle
```

Enrolment is one-time: the bridge reports the device address, and you bind it to the project as the approving signer. Only that address can approve; a signature from any other device is rejected.

## Build steps

1. **Local bridge** (`scripts/ledger/bridge.mjs`) — Node process on your machine wrapping the Ledger CLI: `GET /device` (connected, address, app version), `POST /approve` (sign a typed approval payload), `POST /ring/decrypt` (Key Ring read). Localhost-bound, origin-checked, no network exposure.
2. **Key Ring secret backend** (`scripts/ledger/ring.mjs`) — `wallet-cli ring` encrypts the Circle entity secret and the Nexus token into a committed, device-encrypted file. A capability broker mints a short-lived scoped token for one pathway run; the agent gets that, never the underlying key.
3. **Approval gate** (`src/lib/device.server.ts`, wired into `src/lib/exchange.functions.ts`) — new gate placed after the World check and before the classical floor. `isPayable` gains `deviceOk`. Receipt envelope gains `approvedBy` (device address), `approvalSig`, and `deviceModel`; the digest covers them, so the post-quantum seal binds the tap to the result.
4. **Device page** (`/device`) — bridge status, enrolment, the approval prompt, and the before/after pair for one pathway. Naming stays distinct from the existing settlement ledger page.
5. **Run history and evidence** — every settled run shows whether it was device-approved, with the device address truncated; unapproved runs show the refusal reason, never a quiet fallback.
6. **Deck and submission text** — two track write-ups plus the required developer-experience feedback, based on what actually cost us time during this build.
7. **Ledger skill** — a reusable workspace skill (`.agents/skills/ledger-agent-stack`) covering the bridge pattern, `wallet-cli ring`, the edge-runtime USB limitation, and the traps we hit, then activated.

## Technical notes

- `@ledgerhq/wallet-cli` and the DMK are Node-only and need USB; they can never run in the Cloudflare worker or in a server function. The bridge is the only place device code executes, and the app treats it as an untrusted client — signature recovery and enrolment comparison happen server-side.
- Approval payload is EIP-191 over a canonical string containing receipt digest, pathway id, amount, chain id and a single-use nonce, so it cannot be replayed onto another pathway or amount.
- If the bridge is unreachable or the tap is declined, the gate fails loudly with a named reason — consistent with how blocked quantum legs are already handled.
- Skill drafts under `.agents/skills/` are inert until applied; the skill is activated at the end.
- Clinical framing unchanged: capacity, cost and patient experience only.

## Not in scope

Moving Arc transaction signing itself onto the device — the Circle wallets are developer-controlled and sign server-side. Ledger governs authority and secrets here, not the raw transfer key.
