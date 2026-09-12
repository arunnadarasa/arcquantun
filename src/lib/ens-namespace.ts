// Client-safe ENS namespace model. No chain calls here — this module is imported
// by routes and components. All reads happen in ens.server.ts.
import ensCfg from "@/data/ens.json";
import type { AgentId } from "@/data/agents";

/** The action a payment leg is about to perform. Must be in the name's allow list. */
export type Intent =
  | "release-budget"
  | "settle"
  | "classical-floor"
  | "dequantization"
  | "cohort-fitness"
  | "quantum-submit"
  | "anchor";

/** Which intent each agent is paid to perform in a run. */
export const INTENT_FOR_AGENT: Record<AgentId, Intent> = {
  trust: "settle",
  baseline: "classical-floor",
  nexus: "quantum-submit",
  registry: "anchor",
};

export interface EnsAgentRecord {
  id: AgentId;
  label: string;
  name: string;
  agentId: string;
  arcActor: string | null;
  intents: Intent[];
  records: { setAt: string | null; tx: string | null };
}

export const ensNamespace = ensCfg as unknown as {
  parent: string;
  network: string;
  chainId: number;
  registered: boolean;
  registeredAt: string | null;
  tokenId: string | null;
  registerTx: string | null;
  contracts: Record<string, string>;
  attestationRegistry: { caip2: string; chainId: number; address: string; note: string };
  maxAttestationAgeDays: number;
  agents: EnsAgentRecord[];
};

export function ensAgent(id: AgentId): EnsAgentRecord | undefined {
  return ensNamespace.agents.find((a) => a.id === id);
}

/** The ENSIP-25 text-record key that binds a name to a registry entry. */
export function agentRegistrationKey(registry: string, agentId: string): string {
  return `agent-registration[${registry}][${agentId}]`;
}

/** CAIP-10 form of the cross-chain actor pointer written into `arc:actor`. */
export function actorPointer(address: string): string {
  return `${ensNamespace.attestationRegistry.caip2}:${address}`;
}

export function ensAppUrl(name: string): string {
  return `https://sepolia.app.ens.domains/${name}`;
}

/** Sepolia Etherscan link for an ENS-side contract or transaction. */
export function sepoliaUrl(hashOrAddress: string): string {
  const kind = hashOrAddress.length > 42 ? "tx" : "address";
  return `https://sepolia.etherscan.io/${kind}/${hashOrAddress}`;
}

/** How a resolution was obtained. A committed record is never called a live read. */
export type IdentitySource = "onchain" | "committed";

export type IdentityState = "verified" | "one-sided" | "unverified" | "mismatch";

export interface IdentityCheck {
  agentId: AgentId;
  ensName: string;
  /** The Arc address the name claims as its actor. */
  claimedArcActor: string | null;
  /** The Arc address this run is about to pay. */
  payeeArcAddress: string | null;
  addressMatch: boolean;
  intent: Intent;
  intentAllowed: boolean;
  attestation: { present: boolean; registry: string | null; agentId: string | null };
  state: IdentityState;
  source: IdentitySource;
  checkedAt: string;
  ok: boolean;
  reason: string;
}

export function identityTone(state: IdentityState): "pass" | "gap" | "fail" | "muted" {
  switch (state) {
    case "verified":
      return "pass";
    case "one-sided":
      return "gap";
    case "mismatch":
      return "fail";
    default:
      return "muted";
  }
}
