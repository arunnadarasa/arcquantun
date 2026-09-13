# Speculos support — emulated device transport for the Ledger gate

## Why

Oscar (Ledger) confirmed Speculos (their emulator) is acceptable as a fallback when a physical device can't be used — provided the demo makes clear that everything works identically with a real device, and provided the Key Ring still uses the real Ledger Key Ring (trust chain) protocol rather than a substitute. Speculos runs the genuine Ethereum app binary and the same APDU/personal_sign flow, so the bridge, server-side signature recovery, TTL, and receipt hashing all stay byte-for-byte the same. Only the transport (where the bytes come from) changes.

Constraint from the earlier sandbox investigation: the sandbox has no docker and no qemu today, so Speculos-in-sandbox is a probe outcome, not a promise. The reliable path is Speculos on the user's Mac next to the bridge (docker one-liner); the sandbox attempt is a best-effort add-on that enables in-sandbox end-to-end tests if qemu works.

## Changes

### 1. Bridge transport flag — `scripts/ledger/bridge.mjs`
- New env `LEDGER_TRANSPORT` = `hid` (default, unchanged) | `speculos`.
- `speculos` mode opens `@ledgerhq/hw-transport-node-speculos` against `LEDGER_SPECULOS_HOST` (default `127.0.0.1`) / `LEDGER_SPECULOS_PORT` (default `9999`) instead of Node-HID; `withDevice` switches on the flag.
- `GET /device` response gains `qualifier: "emulator" | "device"` and, in speculos mode, `emulated: true`. `POST /approve` returns the same shape plus `qualifier`.
- Ring endpoints untouched — Key Ring always uses the real device/CLI, never Speculos.

### 2. Speculos runner — `scripts/ledger/README.md` + helper script
- Document + provide `scripts/ledger/speculos.sh`: launches Speculos with the Ethereum app (docker one-liner on the Mac: `ghcr.io/ledgerhq/speculos`, or pip-installed `speculos` where qemu exists), APDU port 9999, REST/API port 5000, and an automation file that can optionally auto-accept.
- The REST port 5000 also serves the emulated device screen — the demo can show judges the exact release parameters rendered on the emulated device screen, same as the physical device.

### 3. Honest labelling (mirror of the quantum emulator convention)
- `src/lib/receipts.ts`: `DeviceApprovalRecord` gains `qualifier: "device" | "emulator"`; it folds into `receiptPayload` (and therefore the digest, seal, and anchor).
- `src/lib/exchange.functions.ts`: device step title/detail in the run ledger says "Speculos (emulated device)" when the approval's qualifier is `emulator`; `RunResult` carries it through.
- `src/routes/device.tsx` + `src/components/device-gate.tsx`: status panel and gate panel show "Speculos — emulated device" with the same treatment as `backendQualifier: "emulator"` for quantum; real-device mode unchanged.
- `src/components/device-gate.tsx` `BridgeChip`: dot stays green but the label reads "bridge (speculos)" in emulated mode.

### 4. Enrolment for emulator mode
- New optional secret `LEDGER_SIGNER_ADDRESS_EMULATOR` — the address derived from the Speculos seed. When the bridge reports `emulator`, the server compares against this (falling back to the main address if unset). The real device's enrolment (`LEDGER_SIGNER_ADDRESS`) is never touched or rebound.

### 5. Key Ring stays real (per Oscar's message)
- No substitution. `/device` page copy gets one clarifying line: Speculos emulates the signing device; Key Ring provisioning still requires the physical Ledger once (decryption afterwards needs no device).

### 6. End-to-end probe (best effort)
- Try running Speculos inside the Lovable Linux sandbox (pip `speculos` + qemu from nix, Ethereum app ELF fetched from Ledger's repo). If it boots: bridge + Speculos both run in-sandbox, enabling a full Playwright run of the gate (approve → signature → payable path) without any hardware. If qemu/gVisor blocks it: record that and keep the Mac as the Speculos host; the bridge code is identical either way.

### 7. Docs / submission text
- README: "Real device (primary) / Speculos (labelled fallback)" setup section.
- One sentence in the prize-form answer: a real Nano S signed the recorded runs; Speculos exists as an explicitly-labelled fallback that exercises the identical code path.

## Out of scope
- Replacing the Key Ring or wallet-cli.
- Any change to gate order, seal, anchor, or settlement logic.
- Mainnet / QPU.

## Verification
- `bunx tsgo --noEmit` clean.
- Bridge started in `speculos` mode against a local Speculos: `GET /device` shows the emulated address + `emulated: true`; `/approve` signs the canonical message and the signature recovers to the enrolled emulator address.
- Playwright (in `/tmp/browser/speculos-gate/`, 1280×1800): device page and gate panel render the "Speculos (emulated device)" label; a run's device step and receipt carry `qualifier: "emulator"`; the BridgeChip label switches.
- Real-device path re-checked: default `hid` mode behaviour unchanged (same responses as today, no `emulated` flag surprises the frontend).
