# Ledger signer bridge

A tiny local process that lets the Clinical Quantum Exchange (an edge-hosted
app, with no USB) confirm budget releases on your Ledger and use the Key Ring.

## Run it

```bash
npm install
npm start            # listens on http://127.0.0.1:8943, loopback only
```

Keep the device unlocked with the **Ethereum** app open.

## Endpoints

| Endpoint | What it does |
| --- | --- |
| `GET /device` | connect, return the address at `LEDGER_SIGNER_PATH` (default `44'/60'/0'/0/0`) |
| `POST /approve {message}` | show the address on-device, then `personal_sign` the message — you confirm on the device screen |
| `POST /ring/encrypt {file,key}` / `POST /ring/decrypt` | Ledger Key Ring (LKRP) via `wallet-cli ring`, password from `WALLET_PASS` |

Cross-origin requests are allowed only for the app's own origins
(`LEDGER_BRIDGE_ALLOWED_ORIGINS` adds more); the app's browser code calls it
directly from your machine, so nothing about the device is network-exposed.

## Enrol the signer in the app

1. `curl http://127.0.0.1:8943/device` (or the Device page) and copy the address.
2. Save it as the `LEDGER_SIGNER_ADDRESS` project secret.
3. From then on `runPathwayJob` refuses to settle unless the run carries a
   signature over the exact release parameters that recovers to that address.

## Key Ring setup (once)

```bash
npm i -g @ledgerhq/wallet-cli
# password from your OS keychain, never typed inline:
WALLET_PASS=$(security find-generic-password -a default -s ledger-wallet-cli -w) wallet-cli ring init
```

Then seal the project's private credentials:

```bash
wallet-cli ring encrypt -i secrets.txt -o secrets.enc --key cqx
```

Decrypt later needs network (trustchain restore) but **no device** — that is
the point for CI and hosted agents.
