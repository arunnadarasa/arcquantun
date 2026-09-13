# Ledger signer bridge — Clinical Quantum Exchange

A small Node process that drives the Ledger from the browser over loopback.
The app itself runs in an edge runtime with no USB, so this bridge is the only
place device code lives. It holds no keys and keeps no state.

```bash
cd scripts/ledger && npm install && npm start
```

Endpoints (bound to `127.0.0.1:8943`, origin-allow-listed):

| Endpoint | Purpose |
| --- | --- |
| `GET /device` | connected Ethereum address + app status |
| `POST /approve` | `personal_sign` a release payload on the device |
| `POST /ring/encrypt` | Key Ring (LKRP) encrypt — `wallet-cli ring` |
| `POST /ring/decrypt` | Key Ring (LKRP) decrypt — `wallet-cli ring` |

## Transports

| Mode | Command | What it is |
| --- | --- | --- |
| Physical device (primary) | `npm start` | the real Ledger over USB |
| Speculos (labelled fallback) | `./speculos.sh` then `LEDGER_TRANSPORT=speculos npm start` | Ledger's device emulator — the genuine Ethereum app binary in software, same APDU flow and signing code path |

Speculos runs the same app binary and the same `personal_sign` flow as a
physical Ledger; only the hardware is simulated, so every surface in the app —
bridge chip, device page, gate panel, run ledger, receipt — labels it
`Speculos (emulated device)`. The emulator enrols separately via the
`LEDGER_SIGNER_ADDRESS_EMULATOR` secret and never touches the real device's
enrolment. Speculos accepts `LEDGER_SPECULOS_SEED` (default: the deterministic
`test test …` seed) and `LEDGER_SPECULOS_MODEL`.

The emulated screen is viewable at `http://127.0.0.1:5000` (Speculos API
port) — useful in a demo to show the exact release parameters the emulated
device is signing.

**The Key Ring never substitutes.** `wallet-cli ring` (LKRP, the real trust
chain protocol) always runs against the physical device for provisioning;
decryption afterwards needs no device.

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `LEDGER_TRANSPORT` | `hid` | `hid` (physical) or `speculos` |
| `LEDGER_SIGNER_PATH` | `44'/60'/0'/0/0` | derivation path |
| `LEDGER_SPECULOS_HOST` / `LEDGER_SPECULOS_PORT` | `127.0.0.1` / `9999` | where Speculos listens for APDUs |
| `LEDGER_BRIDGE_PORT` | `8943` | bridge port |
| `LEDGER_BRIDGE_ALLOWED_ORIGINS` | — | extra comma-separated origins |
| `WALLET_PASS` | — | Key Ring password, injected from the OS keychain — never typed |

Install note: the HID transport needs a native `usb` build, which requires
USB headers; an emulator-only machine can install with
`npm install --ignore-scripts` (the bridge lazy-loads each transport, so a
Speculos-only environment never touches the HID module).
