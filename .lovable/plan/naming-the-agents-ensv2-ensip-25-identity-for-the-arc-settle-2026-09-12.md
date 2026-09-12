# Naming the agents: ENSv2 + ENSIP-25 identity for the Arc settlement lane

## The reason this belongs here, not bolted on

Today the exchange pays four agents at raw hex addresses on Arc Testnet. Nothing in
the record says *who* an address is, nothing stops a swapped address, and nothing
lets us retire a misbehaving agent except a code edit and a redeploy.

That is the actual hole in an agentic-economy claim: the money rail is verifiable,
the *payee* is not. Our own discipline already says a receipt must be re-checkable
by a stranger — but a stranger reading `0x5904…9d4f` learns nothing.

ENS closes it. Each agent gets a name under one parent, an ENSIP-25 attestation
binding that name to its Arc actor address as an ERC-7930 `eip155:5042002` pointer,
and a text record listing the intents it is permitted to perform. The Trust Agent
resolves the payee's name and refuses to release USDC unless:

1. the name resolves to exactly the Arc address the run is about to pay,
2. the ENSIP-25 attestation verifies and is not stale, and
3. the intent for this leg (`anchor`, `quantum-submit`, `classical-floor`,
   `settle`) is in that name's allowed list.

So identity becomes a **fourth gate**, sitting beside the policy cap, the receipt
grade and the anchor — all three already block payment. Revoking an agent becomes
one text-record edit, not a redeploy. And because the attestation is bidirectional
(ENS name → Arc address, and an on-chain registry claim back), neither side can be
forged alone.

Receipts and the ledger stop quoting hex and start quoting names, with the hex kept
beneath it. That is a strictly better evidence artefact.

## What gets built

### 1. Agent namespace on ENSv2 (Sepolia)
Register one parent name through the **permissionless ENSv2 `ETHRegistrar`** — no
DAO approval, paid in free mock USDC — then issue four subnames:
`trust.…`, `baseline.…`, `nexus.…`, `registry.…`. Each carries:
- `addr` for the Sepolia signer
- `arc:actor` text record — the Arc Testnet address the agent is paid at
- `agent:intents` — comma list of permitted intents
- `agent-registration[<registry>][<agentId>]` — the ENSIP-25 record
- `agent:policy` — the per-job and daily caps, mirroring `src/data/agents.ts`

Enhanced Access Control delegates only those specific text keys per subname, so a
compromised agent key cannot rewrite its own caps.

### 2. Identity gate in the run order
A new `identity` step lands between `policy` and `fitness` in
`src/lib/exchange.functions.ts`. It resolves every payee name, checks address match,
attestation freshness and intent, and records the result as a run step. Failure is
`identity-blocked`: published at full size, pays nothing — same treatment as the
32-qubit endoscopy block.

The fixed order becomes:

```text
policy -> identity -> fitness -> classical floor -> dequantization
       -> quantum leg -> receipt grading -> PQ seal -> anchor -> settlement
```

### 3. Receipts and ledger carry names
`src/lib/receipts.ts` gains `payeeEns`, `payeeArcAddress` and
`identityVerification` (verified / one-sided / unverified, with the checked-at
timestamp). The hash covers them, so the anchored digest commits to the identity
claim too. Ledger rows show `nexus.clinicalquantum.eth → 0x59…9d4f` with the ENS
app link beside the Arcscan link.

### 4. An `/identity` page
The parent name and its four subnames, live-resolved: resolved Arc address, intent
list, attestation state, last check, and the revocation story in one sentence.
Plus a "resolve any name" box so a judge can point it at something else and see a
real read, not a fixture.

### 5. Honest boundary block
ENS names live on **Sepolia**; settlement happens on **Arc Testnet**. The link
between them is the attested ERC-7930 pointer, not a bridge. No cross-chain message
passing is claimed. The evidence layer stays PQ-sealed; ENS records are signed with
classical ECDSA and that stays logged as the existing open hazard.

## Technical notes

- `viem` against Sepolia; ENSv2 `ETHRegistrar` `0xa88553F4…aa2Cc`, v2 registry
  `0xBDC85dD5…F0E2`, mock USDC `0x768F4245…7a39` (public mint). Flat positional
  ABI — not the v1 `RegistrationArgs` tuple — with the v2 custom errors included
  or reverts decode to garbage. `isAvailable` before `getRegisterPrice`.
- Commit/reveal: approve before commit, persist the 32-byte secret, wait 65s.
- Server-only module `src/lib/ens.server.ts` + client-safe
  `src/lib/ens.functions.ts`; nothing under `src/server/`. Boots with zero secrets
  and returns a `simulated: true` envelope, matching every other server module here.
- Registration runs as a polled job (commit wait exceeds a request), with the
  resulting names and records committed to `src/data/ens.json` so the UI reads a
  file and redeploys need no code edit — same pattern as `src/data/contract.json`.
- Secrets needed: `SEPOLIA_RPC_URL` and `ENS_PRIVATE_KEY` (a funded Sepolia EOA for
  the parent/subname writes). Optional bidirectional claim:
  `ENSIP25_REGISTRY_ADDRESS`, `ENSIP25_REGISTRY_CHAIN_ID`.
- Circle, Arc, the anchor contract, the PQ seal, the eight pathways and all
  clinical wording are untouched.

## Cards and skills updated

`cards/agent-card-exchange-agents.md` gains each agent's ENS name and intent list;
the system card gains the identity gate in its fixed order and its failure row;
`skills/quantum-exchange/SKILL_CARD.md` gains the rule *never pay a name that does
not resolve to the address on the receipt*.
