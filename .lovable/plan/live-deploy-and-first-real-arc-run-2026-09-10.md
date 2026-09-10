# Live deploy and first real Arc run

Now that the Registry wallet is funded, move the app from demo mode to live execution on Arc Testnet.

## Steps

1. **Deploy ReceiptAnchor.sol**
   - Run `scripts/deploy-contract.mjs` with the Registry wallet.
   - It compiles the pinned solc 0.8.24 source, calls Circle SCP `/contracts/deploy`, polls to `COMPLETE`, and writes the deployed address/tx into `src/data/contract.json`.
   - Verify the deploy transaction appears on Arcscan.

2. **Verify the contract on Arcscan**
   - Use the standard-input JSON from the deploy script or a matching `verify-arc.mjs` script.
   - Confirm `is_verified: true` via the Arcscan v2 API.

3. **Run one small live job**
   - Pick a low-budget PASS pathway (not the blocked endoscopy route).
   - Click **Run job** in the preview.
   - The run flow will:
     - grade the receipt,
     - seal it with SLH-DSA,
     - anchor the SHA-256 digest through the deployed contract,
     - settle USDC agent payouts from the Trust wallet.
   - Capture the anchor tx hash and settlement tx hashes.

4. **Check balances and ledger**
   - Confirm Registry and Trust wallet balances changed as expected.
   - Confirm the settlement ledger shows real (non-simulated) rows with Arcscan links.

5. **Update deck/evidence with live proof points**
   - Add the deployed contract address and one real tx hash to the deck and evidence page.
   - Keep the simulated/demo fallback intact for users without Circle keys.

## Out of scope for this plan

- No changes to clinical-claim limits, policy caps, or the blocked endoscopy rule.
- No mainnet or cross-chain work.
- No new UI redesigns.
