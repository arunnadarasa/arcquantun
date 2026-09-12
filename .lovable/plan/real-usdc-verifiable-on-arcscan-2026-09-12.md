# Real USDC, verifiable on Arcscan

## What I found

The transfers are already real. Circle keys, both wallet IDs and all four agent
addresses are configured, the anchoring contract is deployed and verified, and
the run takes the live branch — which is why the Trust wallet has been dropping
(around 20 to 18.72 USDC) as jobs run. Money is moving on Arc Testnet today.

The problem is that the app never learns the transaction hash, so nothing is
checkable.

Circle returns a transfer straight away with a transfer id and no hash yet — the
hash appears a few seconds later once Arc picks it up. The code has a polling
routine to wait for that, but it is called with a wait of zero attempts, so it
returns immediately, every time, with `state: PENDING` and no hash. That is the
whole bug, and it explains every symptom: settlements read "state PENDING", and
the ledger falls back to storing Circle's internal transfer id in the hash
field, which then builds an Arcscan link that goes nowhere.

## What changes

**1. Actually wait for the hash.** Poll Circle for around 12 seconds per
transaction (short interval, bounded, so a run never hangs) and take the hash
and final state. Applies to both the agent payments and the contract anchor.

**2. Never fabricate a link.** A Circle transfer id is not a transaction hash.
Store the two separately in the ledger, and only render an Arcscan link when
there is a real hash. A row still waiting shows as pending with its transfer id,
not as a dead link.

**3. Back-fill anything still pending.** Some transactions land after the run
finishes. Add a "Resolve pending" action on the Ledger page that asks Circle for
the final state of each unresolved row and writes the hash back into the stored
ledger. Existing rows recorded during this bug get resolved the same way.

**4. Confirm it on Arcscan, not just in Circle.** For each resolved hash, read
Arcscan's public API for that transaction and show its confirmed status and
block next to the link. This is the part that makes it independently checkable:
the claim stops resting on our own word, or Circle's.

**5. A wallet readiness panel.** On Arc, USDC is also the gas token, so an agent
wallet that runs dry fails in a way that looks like a bug. Show each wallet's
live balance with a warning when one is too low to settle, and a faucet link.

**6. Correct the wording everywhere.** Home, Evidence, Architecture, the deck's
"what is real, what is simulated" slide and the cards currently say transfers
are simulated until keys are configured. They are not — that line moves to the
things that genuinely are simulated: the quantum legs (committed emulator runs,
never a QPU), the synthetic cohorts, and the World credential while the sandbox
is pending. I will not soften the remaining limits.

## Technical notes

- `pollTransaction(txId, attempts = 0)` in `src/lib/circle.server.ts` — the
  default is the defect. Call it with a real budget from `transferUsdc` and
  `anchorReceipt`; treat `COMPLETE`/`CONFIRMED` as final.
- `RunStep` and `LedgerEntry` gain a distinct `transferId`; `txHash` becomes
  hash-only and nullable. `txUrl()` is only called on a `0x`-prefixed 64-hex
  value.
- New server function `resolveTransactions` taking transfer ids, returning
  `{ transferId, txHash, state }`, used by the Ledger page.
- Arcscan check via `GET https://testnet.arcscan.app/api/v2/transactions/{hash}`
  from a server function (keeps it off the browser and lets it fail quietly).
- Balances via the existing `readWalletBalance` for the Trust and Registry
  wallets; the other two agents are payees and hold no wallet id.
- No change to the gate order or the payment rules: PASS receipt, verified
  seal, ENS identity and human authority still decide whether anything is paid.

## Verification before I hand back

Run a pathway end to end and confirm the settlement steps carry real `0x`
hashes, that each one opens a real transaction on Arcscan showing the USDC
transfer between the expected addresses, and that the anchor transaction shows
the contract call. I will report the hashes.
