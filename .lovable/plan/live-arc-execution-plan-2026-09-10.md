# Live Arc execution plan

Goal: move the Clinical Quantum Exchange from simulated/demo mode to real Circle/Arc Testnet execution using the funded treasury wallet and your Alchemy RPC.

## What we know
- Four Arc Testnet wallets exist and are saved as project keys.
- Treasury wallet (`CIRCLE_TRUST_ADDRESS`) has been funded with test USDC.
- You have an Alchemy Arc RPC URL.
- `ReceiptAnchor.sol` is ready but not deployed; `src/data/contract.json` has `deployed: false`.
- The app currently runs jobs in demo mode and shows simulated USDC.

## Plan

1. **Add Alchemy Arc RPC as a server-side secret**
   - Store the URL under `ALCHEMY_ARC_RPC_URL` (not a `VITE_*` variable).
   - Use it only in server scripts/deployment helpers; the browser continues to read via Arcscan v2 or public RPC proxies.
   - Keep the public `https://rpc.testnet.arc.network` as the default fallback.

2. **Verify treasury balance**
   - Run a balance check against the Trust wallet ID using the Circle API.
   - Confirm USDC is available on `ARC-TESTNET` and report the amount.
   - Abort the rest if the balance is insufficient for one full job + gas.

3. **Deploy the `ReceiptAnchor` contract via Circle SCP**
   - Add `scripts/deploy-contract.mjs` that:
     - Compiles `contracts/ReceiptAnchor.sol` with solc 0.8.24.
     - Deploys through Circle `contractExecution` or the appropriate SCP path using the Registry wallet.
     - Polls to `status: "COMPLETE"`.
     - Writes the deployed address, tx hash, chainId, and ABI to `src/data/contract.json` with `deployed: true`.
   - Prefer the public Arc RPC / Alchemy URL for deployment reads; never expose it in client code.

4. **Update the app to recognize live mode**
   - `src/lib/exchange.functions.ts` already switches to live when `circleConfigured()` and `contractCfg.deployed === true`.
   - No logic changes; only the contract artifact changes.

5. **Run one real end-to-end job**
   - Pick a small-budget pathway (e.g., `msk-physio`, 0.18 USDC) to keep gas/top-up cost low.
   - Trigger `runPathwayJob` in live mode.
   - Expect: policy checks, classical floor, dequantization gate, quantum leg, receipt grade, on-chain anchor, then USDC payouts to Baseline/Nexus/Registry from the Trust wallet.

6. **Verify on Arcscan**
   - Capture the anchor tx hash and each settlement tx hash.
   - Link to `https://testnet.arcscan.app/tx/{hash}` in the run ledger.
   - Confirm the `ReceiptAnchor` event shows the receipt hash, engine, shots, and signal ID.

## Out of scope
- No new pages, routes, or UI redesign.
- No changes to receipt grading, policy caps, agent shares, or clinical claim wording.
- No Quantinuum Nexus live integration; receipts stay committed/offline.

## Success check
- `getExchangeStatus` returns `circleReady: true`, `contractDeployed: true`, and a non-null contract address.
- A live job returns `simulated: false`, `mode: "live"`, with real `txHash` values for anchor and settlements.
