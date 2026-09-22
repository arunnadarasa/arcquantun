# Password-protect the whole site

Everyone who opens the site sees a single unlock screen first. After typing the shared
password once, they stay unlocked on that device for 7 days and browse normally.

## How it behaves

- Any page visited while locked sends the visitor to an unlock screen styled like the rest
  of the site (aurora background, glass card, the CQ mark).
- Correct password → returned to the page they asked for.
- Wrong password → a plain "Incorrect password" message, nothing else revealed.
- The password is checked on the server and never appears in the page code.
- A small "Lock" action in the site footer clears the unlock for that device.

## Setup step

Two stored values are needed before this works:

- the shared password `nhscep2026`
- a random key used to sign the unlock cookie (generated automatically, never shown)

## Technical notes

- `SITE_PASSWORD` stored via `set_secret` (value given in chat); `SESSION_SECRET` minted
  with `generate_secret` (64 chars). Neither is `VITE_`-prefixed.
- New `src/lib/gate.functions.ts`:
  - `sessionConfig` using `useSession` from `@tanstack/react-start/server`, cookie
    `cqx-gate`, httpOnly/secure/sameSite lax, 7-day maxAge.
  - `unlockSite` — POST server fn, sha256 + `timingSafeEqual` compare, sets
    `{ unlocked: true }`, returns `{ ok }` only.
  - `lockSite` — clears the session.
  - `getGateState` — GET server fn returning `{ unlocked: boolean }`.
- New `src/routes/unlock.tsx` — ungated route with the password form, `useServerFn`,
  redirects to the `redirect` search param (default `/`) on success. Generic head meta.
- Gate in `src/routes/__root.tsx` `beforeLoad`: skip when the path is `/unlock` or under
  `/api/public/`; otherwise call `getGateState()` and `throw redirect({ to: "/unlock",
  search: { redirect: location.href } })` when locked.
- Footer gains a "Lock this device" button in `src/components/shell.tsx` calling `lockSite`
  then navigating to `/unlock`.
- No changes to pathway runs, Nexus scripts, settlement, ENS/World/Ledger logic, or any
  existing page content.

## Caveat

A shared password is a gate, not accounts — one secret for everyone, no per-person
revocation. The route gate controls navigation; page content already in the bundle is
still served by the static build, so this suits a demo/reviewer audience rather than
protecting secrets.
