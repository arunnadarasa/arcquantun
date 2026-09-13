---
name: ledger-agent-stack
description: Wire a Ledger hardware signer into an agent app for device-confirmed spend and Key Ring-sealed secrets — bridge pattern, wallet-cli ring commands, verification, and the traps (edge runtime, CORS, personal_sign recovery).
---

# Ledger Agent Stack in an agent app

Use when an app with autonomous agents needs device-backed security: a
hardware confirmation before anything irreversible (funds move, permissions
escalate), or secrets the agent cannot leak (Key Ring / LKRP). Applies to the
Clinical Quantum Exchange pattern in `src/lib/device.ts`,
`src/lib/device.server.ts` and `scripts/ledger/bridge.mjs`.

## The structural constraint first

The app runs in an edge worker (Cloudflare). Ledger device access needs USB
and Node — `@ledgerhq/hw-transport-node-hid` and `wallet-cli` cannot run in a
server function. The working shape is a **local signer bridge**: a small Node
process on the operator's machine, bound to `127.0.0.1`, and the browser calls
it directly over loopback. The bridge holds no keys and no state.

## Device confirmation gate

1. Browser builds a **canonical approval message**, one line per release
   parameter (action, pathway, budget, chain, workload, `issued:` timestamp).
   The server rebuilds the exact same string from committed data and refuses a
   signature over different bytes — the client cannot re-point an approval.
2. Bridge `POST /approve`: `eth.getAddress(path, true)` (verify on screen),
   then `eth.signPersonalMessage(path, hexOfMessage)`. Assemble the signature
   as `0x + r(64) + s(64) + v(2)`, left-padded hex.
3. Server verifies with viem `recoverMessageAddress({ message, signature })`
   and compares (case-insensitively) to the enrolled signer address stored in
   a project secret (`LEDGER_SIGNER_ADDRESS`). Enforce a TTL (~15 min) on the
   `issued:` timestamp; replay of the same payload is harmless because the
   message is bound to that run's parameters.
4. Fold the approval record (address, signature, message, issuedAt) into the
   receipt payload **before hashing**, so the digest that gets sealed and
   anchored commits to the tap. Gate order in this project:
   policy → ENS identity → World human → **device** → classical floor → … →
   seal → anchor → settlement.

## Key Ring (LKRP)

```bash
npm i -g @ledgerhq/wallet-cli
WALLET_PASS=$(security find-generic-password -a default -s ledger-wallet-cli -w) wallet-cli ring init
wallet-cli ring encrypt -i secrets.txt -o secrets.enc --key my-key
wallet-cli ring decrypt -i secrets.enc -o - --key my-key   # no device needed
```

- One device tap at `ring init`; after that encrypt/decrypt need network
  (trustchain restore) but **no device** — that is what makes it work for CI
  and hosted agents.
- The ring password comes from `WALLET_PASS`, injected from the OS keychain.
  Never a literal on the command line; never let the agent choose it.
- Pattern: the agent requests a scoped, short-lived capability per job; it
  never sees the underlying secret.

## Traps

- **Edge runtime:** `[unenv]` errors or module-not-found for LedgerJS Node
  transports in server functions — wrong place; move device code to the
  bridge, keep only verification (pure viem/crypto) server-side.
- **CORS/Origin:** the bridge must allow-list the app origins and require an
  Origin on POSTs; loopback binding alone is not sufficient once a webpage can
  hit `127.0.0.1`.
- **Signature recovery:** signatures from the device are `r||s||v` hex without
  the `0x` and may need padding to 64/64/2; recovery is case-sensitive per
  address — always compare lowercased.
- **`recoverMessageAddress` on EIP-191:** signPersonalMessage already applies
  the personal-message prefix; pass the raw string message to viem, not the
  hex.
- **Device refused / locked** surfaces as a transport error — publish the
  failure loudly with the reason; never retry in a loop or fall back to an
  unapproved settlement.
- **DMK migration:** LedgerJS transports are being migrated to the Device
  Management Kit; for new UI-side work prefer DMK, but the Node bridge above
  is the stable path for headless signing today.
