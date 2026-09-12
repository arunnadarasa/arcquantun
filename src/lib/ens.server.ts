// ENS reads on Sepolia through the Universal Resolver V2, which resolves v1, v2,
// offchain (CCIP-Read) and L2 names without us guessing which resolver backs a name.
//
// Demo-fallback contract, same as every other server module here: nothing throws
// at module scope, and with no RPC configured the callers fall back to the
// committed namespace in src/data/ens.json, labelled `source: "committed"`.
import { createPublicClient, http, encodeFunctionData, decodeAbiParameters, toHex } from "viem";
import { sepolia } from "viem/chains";
import { namehash, packetToBytes } from "viem/ens";
import type { AgentId } from "@/data/agents";
import {
  ensNamespace,
  ensAgent,
  agentRegistrationKey,
  INTENT_FOR_AGENT,
  type IdentityCheck,
  type IdentitySource,
  type IdentityState,
  type Intent,
} from "@/lib/ens-namespace";

const UNIVERSAL_RESOLVER = ensNamespace.contracts["universalResolver"] as `0x${string}`;

const UNIVERSAL_RESOLVER_ABI = [
  {
    inputs: [
      { name: "name", type: "bytes" },
      { name: "data", type: "bytes" },
    ],
    name: "resolve",
    outputs: [
      { name: "result", type: "bytes" },
      { name: "resolver", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const TEXT_ABI = [
  {
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "key", type: "string" },
    ],
    name: "text",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const ADDR_ABI = [
  {
    inputs: [{ name: "node", type: "bytes32" }],
    name: "addr",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function ensRpcUrl(): string | null {
  return process.env["SEPOLIA_RPC_URL"] ?? null;
}

/** True when a live Sepolia read is possible. Writes additionally need ENS_PRIVATE_KEY. */
export function ensConfigured(): boolean {
  return !!ensRpcUrl();
}

function client() {
  const url = ensRpcUrl();
  if (!url) throw new Error("SEPOLIA_RPC_URL is not configured");
  return createPublicClient({ chain: sepolia, transport: http(url) });
}

async function resolveCall(name: string, data: `0x${string}`): Promise<`0x${string}` | null> {
  try {
    const res = (await client().readContract({
      address: UNIVERSAL_RESOLVER,
      abi: UNIVERSAL_RESOLVER_ABI,
      functionName: "resolve",
      args: [toHex(packetToBytes(name)), data],
    })) as readonly [`0x${string}`, `0x${string}`];
    return res[0];
  } catch {
    return null;
  }
}

/** Read one text record through the Universal Resolver. Null when absent or unreachable. */
export async function readText(name: string, key: string): Promise<string | null> {
  const raw = await resolveCall(
    name,
    encodeFunctionData({ abi: TEXT_ABI, functionName: "text", args: [namehash(name), key] }),
  );
  if (!raw || raw === "0x") return null;
  try {
    const [value] = decodeAbiParameters([{ type: "string" }], raw);
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

/** Read the ETH address record. Null when absent or unreachable. */
export async function readAddr(name: string): Promise<string | null> {
  const raw = await resolveCall(
    name,
    encodeFunctionData({ abi: ADDR_ABI, functionName: "addr", args: [namehash(name)] }),
  );
  if (!raw || raw === "0x") return null;
  try {
    const [value] = decodeAbiParameters([{ type: "address" }], raw);
    return value === "0x0000000000000000000000000000000000000000" ? null : value;
  } catch {
    return null;
  }
}

function same(a: string | null, b: string | null): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

/** The Arc address this agent is actually paid at, from the Circle wallet config. */
export function payoutAddress(id: AgentId): string | null {
  const fromEnv = process.env[`CIRCLE_${id.toUpperCase()}_ADDRESS`];
  if (fromEnv) return fromEnv;
  return ensAgent(id)?.arcActor ?? null;
}

/**
 * The identity gate. Resolves the agent's ENS name, checks that it points at the
 * exact Arc address about to be paid, that the ENSIP-25 attestation is present,
 * and that this leg's intent is in the name's allow list.
 *
 * A committed-source check is never presented as an on-chain read.
 */
export async function checkAgentIdentity(
  id: AgentId,
  intent?: Intent,
): Promise<IdentityCheck> {
  const rec = ensAgent(id);
  const useIntent = intent ?? INTENT_FOR_AGENT[id];
  const checkedAt = new Date().toISOString();
  const payee = payoutAddress(id);

  if (!rec) {
    return {
      agentId: id,
      ensName: "—",
      claimedArcActor: null,
      payeeArcAddress: payee,
      addressMatch: false,
      intent: useIntent,
      intentAllowed: false,
      attestation: { present: false, registry: null, agentId: null },
      state: "unverified",
      source: "committed",
      checkedAt,
      ok: false,
      reason: "No ENS name is registered for this agent, so the payee cannot be named.",
    };
  }

  const registry = ensNamespace.attestationRegistry.address;
  const attKey = agentRegistrationKey(registry, rec.agentId);

  let source: IdentitySource = "committed";
  let claimed: string | null = rec.arcActor;
  let intents: Intent[] = rec.intents;
  let attestationPresent = false;

  if (ensConfigured() && ensNamespace.registered) {
    const [actorText, intentsText, attText] = await Promise.all([
      readText(rec.name, "arc:actor"),
      readText(rec.name, "agent:intents"),
      readText(rec.name, attKey),
    ]);
    if (actorText || intentsText || attText) {
      source = "onchain";
      // arc:actor is written as a CAIP-10 pointer: eip155:5042002:0x…
      claimed = actorText ? (actorText.split(":").pop() ?? null) : null;
      intents = intentsText
        ? (intentsText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean) as Intent[])
        : [];
      attestationPresent = !!attText;
    }
  }

  const addressMatch = same(claimed, payee);
  const intentAllowed = intents.includes(useIntent);

  let state: IdentityState;
  let reason: string;
  if (claimed && payee && !addressMatch) {
    state = "mismatch";
    reason = `${rec.name} resolves to ${claimed}, but this run is about to pay ${payee}. Payment refused.`;
  } else if (!intentAllowed) {
    state = "unverified";
    reason = `${rec.name} does not list the intent "${useIntent}", so it may not be paid for this leg.`;
  } else if (!addressMatch) {
    state = "unverified";
    reason = `${rec.name} carries no Arc actor pointer that matches a configured payout address.`;
  } else if (source === "onchain" && attestationPresent) {
    state = "verified";
    reason = `${rec.name} resolves to ${payee} on Arc, carries an ENSIP-25 attestation against the anchor registry, and permits "${useIntent}".`;
  } else if (source === "onchain") {
    state = "one-sided";
    reason = `${rec.name} resolves to ${payee} and permits "${useIntent}", but no ENSIP-25 attestation record was found. Named, not attested.`;
  } else {
    state = "one-sided";
    reason = `Committed namespace entry: ${rec.name} is bound to ${payee} for "${useIntent}". Not yet read from Sepolia.`;
  }

  return {
    agentId: id,
    ensName: rec.name,
    claimedArcActor: claimed,
    payeeArcAddress: payee,
    addressMatch,
    intent: useIntent,
    intentAllowed,
    attestation: {
      present: attestationPresent,
      registry: attestationPresent ? registry : null,
      agentId: rec.agentId,
    },
    state,
    source,
    checkedAt,
    ok: state === "verified" || state === "one-sided",
    reason,
  };
}

/** Free-form resolution so a reader can point the app at any name and see a real read. */
export async function resolveAnyName(name: string): Promise<{
  name: string;
  configured: boolean;
  address: string | null;
  arcActor: string | null;
  intents: string | null;
  avatar: string | null;
  error: string | null;
}> {
  const clean = name.trim().toLowerCase();
  if (!ensConfigured()) {
    return {
      name: clean,
      configured: false,
      address: null,
      arcActor: null,
      intents: null,
      avatar: null,
      error: "No Sepolia RPC is configured, so no live resolution can be performed.",
    };
  }
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(clean)) {
    return {
      name: clean,
      configured: true,
      address: null,
      arcActor: null,
      intents: null,
      avatar: null,
      error: "That does not look like an ENS name.",
    };
  }
  const [address, arcActor, intents, avatar] = await Promise.all([
    readAddr(clean),
    readText(clean, "arc:actor"),
    readText(clean, "agent:intents"),
    readText(clean, "avatar"),
  ]);
  return { name: clean, configured: true, address, arcActor, intents, avatar, error: null };
}
