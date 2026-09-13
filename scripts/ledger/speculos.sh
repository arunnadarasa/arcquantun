#!/usr/bin/env bash
# Launch Speculos — Ledger's device emulator — with the Ethereum app.
#
# Speculos runs the genuine Ethereum app binary in software, so the bridge
# exercises the identical APDU flow and signing code path as a physical
# Ledger; every surface in the app labels it as an emulated device.
#
#   1. start the emulator:        ./speculos.sh
#   2. start the bridge:          LEDGER_TRANSPORT=speculos npm start
#   3. (optional) watch the emulated screen: open http://127.0.0.1:5000
#
# Docker path (macOS, simplest) and pip path are both handled below.
# The Key Ring is unaffected: wallet-cli ring always uses the real device.
set -euo pipefail

MODEL="${LEDGER_SPECULOS_MODEL:-nanos}"
API_PORT="${LEDGER_SPECULOS_API_PORT:-5000}"
APDU_PORT="${LEDGER_SPECULOS_PORT:-9999}"
APP_DIR="${LEDGER_SPECULOS_APPS:-$HOME/.speculos/apps}"

mkdir -p "$APP_DIR"
APP="$APP_DIR/app.elf"

fetch_app() {
  # Deterministic build of the Ethereum app for the chosen model.
  local url="https://github.com/LedgerHQ/app-ethereum/releases/download/v1.15.1/ethereum_${MODEL}.elf"
  echo "Fetching Ethereum app (${MODEL})…"
  curl -fL --progress-bar -o "$APP" "$url"
}

if command -v docker >/dev/null 2>&1; then
  [ -f "$APP" ] || fetch_app
  echo "Starting Speculos (docker) — APDU ${APDU_PORT}, API ${API_PORT}"
  exec docker run --rm -p "${APDU_PORT}:${APDU_PORT}" -p "${API_PORT}:${API_PORT}" \
    -v "$APP_DIR:/speculos/apps" ghcr.io/ledgerhq/speculos:latest \
    --model "$MODEL" --seed "${LEDGER_SPECULOS_SEED:-test test test test test test test test test test test test}" \
    --apdu-port "$APDU_PORT" --api-port "$API_PORT" apps/app.elf
fi

# pip fallback (needs qemu-arm on the PATH; on macOS use docker instead).
python3 -m pip show speculos >/dev/null 2>&1 || python3 -m pip install speculos
[ -f "$APP" ] || fetch_app
echo "Starting Speculos (pip) — APDU ${APDU_PORT}, API ${API_PORT}"
exec python3 -m speculos.cli --model "$MODEL" \
  --seed "${LEDGER_SPECULOS_SEED:-test test test test test test test test test test test test}" \
  --apdu-port "$APDU_PORT" --api-port "$API_PORT" "$APP"
