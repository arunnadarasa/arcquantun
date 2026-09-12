# World integration feedback — docs, Developer Portal, Sandbox

Kept as a running log while building the human-authority layer of the Clinical
Quantum Exchange (ETHOnline 2026). Written during the work rather than
reconstructed afterwards.

Context: app id `app_b54b380043842fef8b8c88c8e3bcdc5d`. Sandbox access requested
12 September 2026, not approved at time of writing, so everything below is from
the public docs, the Developer Portal and the IDKit package itself.

## AgentKit docs and integration flow

- The integration guide reads as a linear four-step flow, but step 2
  (AgentBook registration) is the one with an external dependency — sandbox
  entitlement — and that is not flagged at the top. A prerequisites block naming
  what needs approval, and roughly how long approval takes, would change how a
  hackathon team sequences its build. We designed the registration payloads up
  front and left the call behind a script so nothing blocks on it; that decision
  had to be inferred.
- "Human-backed agent" is the core concept and the most valuable one, but the
  docs define it mostly by what it enables (access, rate limits, continuity)
  rather than by what is actually attested and where the attestation lives. A
  one-paragraph data model — what a verified human contributes to an agent
  record, what a relying party can check, what it cannot infer — would be worth
  more than the feature list.
- The relationship between AgentBook identity and other agent naming systems
  (ENS, ERC-8004) is not addressed. We are registering the same four agents in
  both AgentBook and ENS, and had to decide for ourselves which is canonical.
  Guidance on coexistence would be useful.

## Developer Portal navigation and discovery

- The split between an app's `app_id` and a Relying Party's `rp_id` plus signing
  key is the single highest-friction concept, and the portal presents them in
  separate tabs without stating that a v4 flow needs both. It is easy to leave
  with an app id, assume that is the credential, and find out at verify time.
- The signing key is shown once on RP creation/reset. That is correct, but the
  warning deserves to be louder and to say explicitly that the only recovery is
  a reset that invalidates existing contexts.
- Search inside the docs returns v2 IDKit material alongside v4. For a
  production app id the v2 "Open World App" path silently does nothing, so a
  newcomer following a top search result gets a dead button and no error. A
  deprecation banner on v2 pages would save hours.

## Sandbox App — not yet reachable

Access is pending, so we cannot report on states, proof flows, test users,
errors or edge cases yet. What we would want to test on approval, recorded now
so it is not rationalised later:

1. A first-time verification against a fresh test user, end to end.
2. The same user re-verifying on the same action — confirming the nullifier is
   stable, which is the property our ledger relies on.
3. The same user on a different signal, confirming scope isolation.
4. An expired request context (>5 min), to see what the widget surfaces.
5. A cancelled/denied verification, to check the client gets a distinguishable
   error rather than a hang.

This section will be completed once access lands.

## What was confusing, missing or broken

- **Confusing:** which identifier goes in the v4 verify URL. The docs accept
  both `app_id` and `rp_id`; RP-backed requests want the RP. We implemented the
  RP path with a single fallback to the app id on a non-JSON 403, which should
  not be something an integrator has to invent.
- **Confusing:** the verify endpoint expects the IDKit proof response at the top
  level. Posting the natural client wrapper returns `invalid_proof`
  immediately after World App reports success — a failure that reads like a
  rejected human rather than a malformed request.
- **Missing:** guidance on what a relying party should persist. We settled on
  the nullifier hash only, and nothing else, but the docs do not state a
  recommended minimum. For a health-adjacent project that is a governance
  question, not a preference, and an explicit "store only the nullifier"
  recommendation would be quotable in a safety case.
- **Missing:** a documented verification-level string contract in the proof
  response across presets. We read defensively from several shapes.
- **Broken (docs, not product):** several agent-kit deep links in the prize
  resources resolve to the integration page anchor rather than the named step.

## What worked well

- IDKit's package split (`@worldcoin/idkit-core/signing`) makes the server half
  trivial: the whole RP-signature endpoint is about thirty lines and needs no
  SDK on the request path.
- The nullifier design is exactly the right primitive for our use case — we
  needed "one human, repeatedly recognisable, never identified", and got it
  without building anything.
- The credential never touching our infrastructure made the privacy section of
  our safety case short and true, which is rare.
