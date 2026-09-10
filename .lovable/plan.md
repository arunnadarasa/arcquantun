# Reset the Circle entity secret, then connect live payments

You have the Circle console open on the "Reset your Entity Secret" dialog. That dialog wants a
**ciphertext**, not the secret itself — so the new secret has to be minted and encrypted first,
and only then pasted in. After that the exchange can move real testnet USDC instead of simulated
amounts.

## What happens, in order

1. **Mint a new secret.** A one-off script generates a fresh 32-byte random value (64 hex
   characters) and prints it once. This is the raw entity secret. It is never committed.
2. **Encrypt it for Circle.** The same script fetches Circle's public key from
   `/v1/w3s/config/entity/publicKey`, encrypts the 32 bytes with RSA-OAEP (SHA-256), and prints
   the base64 ciphertext.
3. **You paste the ciphertext** into the "New entity secret ciphertext" box in the dialog and
   press Reset. Circle then offers a recovery file — download and keep it somewhere safe;
   losing both the secret and the recovery file locks the wallets permanently.
4. **You save the raw hex** into the secure key form I open, as `CIRCLE_ENTITY_SECRET`, alongside
   `CIRCLE_API_KEY` from the console's API-key page.
5. **Wallets.** With those two saved, a bootstrap step creates the four agent wallets on Arc
   Testnet and writes their IDs and addresses back as the remaining keys the app reads
   (`CIRCLE_TRUST_WALLET_ID`, `CIRCLE_REGISTRY_WALLET_ID`, and one address per agent).
6. **Fund the trust wallet** at `faucet.circle.com`, choosing Arc Testnet — about 20 USDC a day,
   which is plenty since each job settles fractions of a dollar.

## Important caveats

- Resetting deprecates the current secret: anything already created with the old one stops
  authorising. Since no wallets exist yet on this project, nothing is lost — but if you use this
  same Circle account elsewhere, that other app breaks the moment you press Reset.
- The ciphertext is single-use per request. Every live API call re-encrypts the secret fresh;
  that is already how the app's Circle client is written.
- Until the `ReceiptAnchor` contract is deployed, receipt hashes stay simulated even once
  payments are live. Deploying it is a separate step through Circle's contract platform, paid in
  USDC gas from the trust wallet.

## Technical notes

- New script `scripts/entity-secret.mjs`: `crypto.randomBytes(32)` → hex, fetch public key with
  the `CIRCLE_API_KEY` bearer, `crypto.publicEncrypt` with `RSA_PKCS1_OAEP_PADDING` and
  `oaepHash: "sha256"`, base64 output. Node built-ins only, no `@circle-fin/*` SDK.
- New script `scripts/bootstrap-wallets.mjs`: creates a wallet set and four Arc Testnet
  (`ARC-TESTNET`) developer-controlled wallets, prints IDs and addresses for the key form.
- No change to `src/lib/circle.server.ts` logic, the seven-step run order, receipt grading, agent
  caps, or claim wording. `src/lib/exchange.functions.ts` already switches from simulated to live
  the moment the keys resolve.

## What I need from you

`CIRCLE_API_KEY` first — the reset script needs it to fetch the public key. Then, after the reset,
`CIRCLE_ENTITY_SECRET` as the raw 64-character hex.
