# Roadmap

## Ledger Agent Stack integration (AI Agents x Ledger track, $3,500)
- [x] Confirm scope: AI Agents x Ledger only (not Continuity — new project)
- [x] Ground on Ledger docs: wallet-cli ring commands, DMK skills, edge-runtime constraint
- [x] `src/lib/device.ts` — approval message builder + types
- [x] `src/lib/device.server.ts` — signature verification, enrolled-address gate, getDeviceStatus
- [x] `scripts/ledger/bridge.mjs` + README — local signer bridge (getAddress, personal_sign, ring)
- [x] Gate wired into `src/lib/exchange.functions.ts` (device step after human, payable condition, receipt payload)
- [x] `src/lib/receipts.ts` — DeviceApprovalRecord hashed into the digest
- [x] `src/components/device-gate.tsx` + run flow on `/`
- [x] `/device` page + nav link
- [x] Deck: new "The device tap" slide
- [x] Ledger workspace skill (ledger-agent-stack) — active
- [x] Typecheck + preview verification (/, /device render clean)

## Waiting on the user
- LEDGER_SIGNER_ADDRESS secret — form sent; paste the address the bridge shows (curl 127.0.0.1:8943/device or the Device page)
- First live tap: run scripts/ledger locally, approve a release on the device, run a pathway job

## Prize-form answer (Ledger — AI Agents x Ledger)
Delivered in chat; paste into the ETHGlobal form.
