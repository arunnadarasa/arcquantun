# Bridge status chip in the navbar

## Goal
A small always-visible chip in the top bar that turns green the moment the local Ledger bridge
(`scripts/ledger`) is reachable, so there is no need to check the terminal. It answers the
question "can I tap yet?" at a glance.

Note: the bridge cannot run in the Lovable Linux sandbox (no USB, no inbound network, gone when
published) — it stays on the machine the Ledger is plugged into. The chip is the fix for the
ergonomics, not the location.

## Changes

1. New `BridgeChip` component (in `src/components/device-gate.tsx`, exported alongside
   `useDeviceBridge`, so no new import graph):
   - Reuses `useDeviceBridge()` — the existing `device-bridge` query already polls
     `GET /device` every 30 s with `retry: false`.
   - Renders a compact dot + label: green dot (`pass` token) + "bridge online" when
     `bridge.data?.connected === true`; muted dot + "bridge offline" otherwise; while the first
     fetch is in flight, a neutral "bridge…" state.
   - Pure presentational, no new server calls.

2. `src/components/shell.tsx`:
   - Desktop: render `<BridgeChip />` on the right side, before the "Run a pathway" CTA.
     It must not push the nav groups wide — keep it `hidden lg:inline-flex` sized to a dot and
     one short label; the existing scrolled/blur header treatment is unchanged.
   - Mobile: add the same chip as a row at the top of the full-height mobile menu panel.
   - Wrap the chip in `<ClientOnly>` (or gate on `useHydrated()`) so SSR renders nothing and
     there is no hydration mismatch — the browser is the only thing that can reach
     `127.0.0.1:8943` anyway.

3. No changes to the bridge itself, the gate order, receipts, or any server logic.

## Verification
- `bunx tsgo --noEmit` clean.
- Playwright against `http://localhost:8080` (script in `/tmp/browser/bridge-chip/`,
  viewport 1280×1800, no full_page): chip shows "bridge offline" with the bridge down and
  turns green online — the online case is verified by pointing a temporary fetch at a stub
  server on 8943 inside the test only; the app code is untouched by the stub.
- Device page and gate keep working (they share the same query cache).
