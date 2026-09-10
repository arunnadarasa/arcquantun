# Start on a clean Circle account, then register the entity secret properly

Without the recovery file and without the July secret itself, that Circle account's wallet
signing key cannot be reset — Circle documents the recovery file as the only path back, and they
hold no copy of the secret. Nothing in this project ever used that account, so there is nothing
to rescue. The fastest route is a fresh testnet account where we register cleanly and keep the
recovery file this time.

## What you do

1. **Create a new Circle developer account** at `console.circle.com` with a different email
   (a `+arc` alias on your usual address works). Stay on the **Testnet** toggle — sandbox only,
   no real money.
2. **Create a testnet API key** there and save it when I open the key form.
3. I generate a fresh secret and its encrypted form. Since the new account has *no* secret yet,
   the console shows **Register**, not Reset — no `.dat` file is asked for. You paste the
   ciphertext and register.
4. **Download the recovery file immediately.** It is offered once. Put it in your password
   manager, separate from the secret. That file is what makes a future reset possible.
5. I create the four agent wallets on Arc Testnet and save their IDs and addresses.
6. **Fund the trust wallet** at `faucet.circle.com`, picking Arc Testnet.

If you'd rather keep the existing account, the only other route is Circle support — slower than
the deadline allows, so the new account is what this plan assumes.

## Housekeeping on this project

- The secret I minted an hour ago was for the old account, so it is now meaningless. I'll replace
  both stored keys with the new account's values; no code changes are needed for that.
- Payments and receipt anchoring stay simulated until the new keys resolve, exactly as the
  Evidence and Architecture pages already state. The seven-step run order, receipt grading, agent
  caps and claim wording are untouched.

## Technical notes

- `scripts/entity-secret.mjs` and `scripts/bootstrap-wallets.mjs` already exist from the last step
  and work unchanged against any account — they read `CIRCLE_API_KEY` from the environment,
  fetch `/v1/w3s/config/entity/publicKey`, and RSA-OAEP(SHA-256) the 32-byte secret.
- Registration in the console and rotation over the API both consume the same ciphertext shape,
  so nothing in `src/lib/circle.server.ts` changes.
- Keys to be replaced: `CIRCLE_API_KEY`, `CIRCLE_ENTITY_SECRET`, then the wallet IDs and agent
  addresses the bootstrap script prints.
