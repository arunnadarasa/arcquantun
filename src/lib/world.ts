// The human-authority layer. ENS answers which agent is paid; World ID answers
// which unique human authorised the spend.
//
// Only the nullifier hash persists. It is stable per human per action, so a
// second release by the same person reuses it and the ledger shows one human
// across many runs — while saying nothing about who they are. No name, no
// image, no biometric, no wallet.

export interface HumanAuthority {
  /** Stable per human per action. The only identifier that persists anywhere. */
  nullifierHash: string;
  credential: string;
  verificationLevel: string;
  action: string;
  /** The pathway this authorisation was bound to. Not a blanket approval. */
  signal: string;
  verifiedAt: string;
  /** True while the sandbox entitlement is pending; never claims a real human. */
  simulated: boolean;
}

export function shortNullifier(n: string): string {
  if (!n || n.length < 14) return n;
  return `${n.slice(0, 10)}…${n.slice(-6)}`;
}

/**
 * Deterministic stand-in used while the World sandbox entitlement is pending.
 * Seeded, so the same operator on the same pathway gets the same nullifier and
 * the uniqueness property is still visible in the ledger. Always flagged
 * simulated, and never presented as a verified human.
 */
export function demoNullifier(seed: string): string {
  let h = 0x811c9dc5;
  const lanes: string[] = [];
  for (let lane = 0; lane < 8; lane++) {
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i) + lane * 31;
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    lanes.push((h >>> 0).toString(16).padStart(8, "0"));
  }
  return `0x${lanes.join("")}`;
}

/** The three identity layers, each answering a different question. */
export const IDENTITY_LAYERS = [
  {
    layer: "Arc · Circle",
    question: "Did money actually move?",
    proof: "A USDC transaction on Arcscan",
  },
  {
    layer: "ENS · ENSIP-25",
    question: "Which agent was paid, and is it permitted to do this?",
    proof: "Resolver records under clinicalquantum.eth on Sepolia",
  },
  {
    layer: "World ID",
    question: "Which unique human authorised the spend?",
    proof: "A Selfie Check credential, reduced to a nullifier hash",
  },
] as const;

/** Stated in full on the /human page and in the receipt discipline. */
export const NEVER_COLLECTED = [
  "No image, selfie, video or biometric template reaches this app — the credential is produced and held inside World App.",
  "No name, email, phone number or wallet address is stored against an authorisation.",
  "No cross-action linkage: the nullifier is scoped to this action, so it cannot be matched against a nullifier from any other app.",
  "No clinical, diagnostic or competence claim attaches to a verified human — it authorises a spend, nothing more.",
];
