# Roadmap

## In progress — Ledger Agent Stack integration (AI Agents x Ledger track, $3,500)
- [x] Confirm scope: AI Agents x Ledger only (not Continuity — new project)
- [x] Ground on Ledger docs (llms-full.txt): wallet-cli ring commands, DXK skills, edge-runtime constraint
- [ ] `src/lib/device.ts` — approval message builder + types
- [ ] `src/lib/device.server.ts` — signature verification, enrolled-address gate, getDeviceStatus
- [ ] `scripts/ledger/bridge.mjs` — local signer bridge (getAddress, personal_sign, ring encrypt/decrypt) + README
- [ ] Wire gate into `src/lib/exchange.functions.ts` (device step, payable condition, receipt payload)
- [ ] `src/lib/receipts.ts` — DeviceApprovalRecord in receipt payload
- [ ] `src/components/device-gate.tsx` + run flow on `/`
- [ ] `/device` page + nav link
- [ ] Ledger workspace skill (`.agents/skills/ledger-agent-stack`) + apply
- [ ] Prize-form answer text (Arc/ENS/World style) for Ledger
- [ ] Typecheck + preview verification

## Blocked / waiting
- LEDGER_SIGNER_ADDRESS secret — needs the device address from the user's bridge (form will be sent)
