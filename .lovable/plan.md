# A human behind the budget — World ID and AgentKit for the exchange

ENS answered *which agent* is being paid. It cannot answer *who authorised the
spend*. That is the gap World fills, and it is the one gap the exchange still
has: right now a pathway budget is released by an agent, on behalf of nobody in
particular.

## The reason this integration is not cosmetic

The exchange is an agentic economy: four agents hold wallets and move real USDC
against a clinical question. For NHS-shaped work, "an autonomous process spent
money on an assessment" is not an acceptable audit line. A budget release has to
trace to a real, unique human who authorised it — and to exactly one human, not
a bot farm minting fresh approvers.

So the run order gains one more gate, and the receipt gains one more field:

```text
policy cap  ->  agent identity (ENS: which agent)
            ->  human authority (World ID: which human authorised it)
            ->  classical floor -> fitness -> dequantization -> quantum
            ->  receipt -> seal -> anchor -> settlement
```

Three layers, each answering a different question, all hashed into the same
sealed receipt:

| Layer | Question | Proof |
| --- | --- | --- |
| Arc / Circle | Did money move? | Transaction on Arcscan |
| ENS / ENSIP-25 | Which agent was paid, and may it do this? | Resolver records on Sepolia |
| World ID | Which unique human authorised the spend? | Selfie Check credential, nullifier only |

The nullifier hash is the load-bearing part. It is stable per human per action,
so a second budget release by the same person reuses the same nullifier and the
ledger shows one human across many runs — while telling you nothing about who
they are. No name, no face, no image, no wallet: the receipt carries the
nullifier hash, the credential type, the verification level and the timestamp,
and nothing else.

## What gets built

### 1. Human authority gate (Selfie Check)

A "Authorise this budget" action on the pathway card, backed by the World ID v4
flow: an RP-signed request context minted server-side, `IDKitRequestWidget`
mounted client-only, and a server-side verify proxy. The nullifier is bound to
a per-pathway action so the authorisation is for *this* budget, not a blanket
approval.

An unauthorised run still executes — and publishes as `human-unauthorised`,
settling nothing. Consistent with how a blocked pathway is already published at
full size rather than hidden.

### 2. The four agents in AgentBook (AgentKit)

Each agent registers through AgentKit and carries its AgentBook entry beside its
ENS name, so the identity page shows one row per agent with three bindings:
ENS name, Arc actor address, AgentBook registration. The identity gate resolves
the AgentBook entry alongside the ENS record; an agent absent from AgentBook is
reported as such rather than silently passing.

### 3. Receipt and ledger

`HumanAuthority` is added to the receipt payload — nullifier hash, credential,
verification level, action, timestamp — and therefore lands inside the SHA-256
digest, the SLH-DSA seal and the Arc anchor. `isPayable` gains one condition:
a PASS receipt with a verified seal, a verified agent identity *and* a human
authority. The settlement ledger shows the authorising nullifier, shortened.

### 4. A `/human` page

Why a human gate exists on an agentic rail; the Selfie Check flow live; the
three-layer identity table; the AgentBook roster; and an explicit statement of
what is never collected. Plus the honest limits: Selfie Check is a
low-friction, low-assurance credential and is treated as an authorisation and
abuse-prevention signal, never as a clinical identity or a claim about
competence.

### 5. Sandbox feedback document

The AgentKit and Selfie Check prizes both require written feedback on the docs,
Developer Portal and Sandbox. A `feedback/world-sandbox.md` is kept as a running
log while the integration is built — navigation, proof flows, error surfaces,
edge cases, what was missing or confusing — rather than written from memory at
the end.

## Until sandbox access lands

You have `app_b54b380043842fef8b8c88c8e3bcdc5d`; the sandbox entitlement is
requested but not approved. The gate therefore runs in deterministic demo mode:
a seeded, stable pseudo-nullifier, every surface flagged `simulated: true`
exactly like the Circle envelopes, and the page stating plainly that the
credential is simulated pending sandbox access. Nothing claims a real human was
verified. When the entitlement and RP keys arrive, the same flow flips live with
no code change — the demo path is the fallback, not the implementation.

## Technical notes

- World ID **v4**: `IDKitRequestWidget` + `orbLegacy` preset +
  `allow_legacy_proofs`, server-signed `rp_context`, and a server-side verify
  proxy. The v2 widget is deliberately not used — its deep link is silently dead
  on production app ids.
- Two routes under `src/routes/api/public/idkit/` (`rp-signature`, `verify`), the
  only prefix reachable by World App on a published site. Both read
  `process.env` inside the handler, never at module scope.
- IDKit is mounted behind `<ClientOnly>` + `React.lazy`; a top-level import
  breaks the server render.
- The upstream verify posts the **unwrapped** proof to
  `developer.world.org/api/v4/verify/{rp_id}`, with JSON and user-agent headers.
- Secrets needed: `WORLDID_RP_ID` and `WORLDID_RP_SIGNING_KEY` from the Relying
  Parties tab. The `app_id` is public and lives in config.
- AgentKit runs server-side only; agent registration is a script writing its
  results into a committed JSON file, the same pattern as the ENS and contract
  configs, so a re-registration needs no code edit.

## Claim discipline, unchanged

No biometric data, image, or personal identifier is stored or transmitted by
this app — the nullifier hash is the only thing that persists. Selfie Check is
a low-assurance signal used for authorisation and abuse prevention, and is
described as such everywhere it appears. No clinical, diagnostic, efficacy or
outcome claim attaches to it. A simulated credential is labelled simulated on
every surface that shows it.
