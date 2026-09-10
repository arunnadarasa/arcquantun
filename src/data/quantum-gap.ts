// Figures taken from the Circle Research Quantum Tracker, read on the date
// below. Tracker figures only — no other leaderboard number is mixed in.
// Circle Research is the source; no endorsement by Circle is implied.

export const TRACKER_URL = "https://www.circle.com/quantum-tracker";
export const TRACKER_POST_URL = "https://www.circle.com/blog/the-quantum-gap-is-closing";
export const TRACKER_READ_ON = "10 September 2026";

export const QUANTUM_GAP = {
  /** Blue line on the tracker: most error-corrected logical qubits demonstrated. */
  demonstrated: 96,
  /** Red line on the tracker: logical qubits needed to break ECDSA. */
  ecdsaThreshold: 824,
} as const;

export const GAP_REMAINING = QUANTUM_GAP.ecdsaThreshold - QUANTUM_GAP.demonstrated;

export interface GapNote {
  title: string;
  body: string;
}

export const WHY_IT_MATTERS: GapNote[] = [
  {
    title: "A receipt has to outlive its signature",
    body: "A clinical evidence receipt is meant to be re-checkable years after the run. If the only thing binding a receipt to its claims is a signature scheme that a future machine can forge, the record quietly stops being evidence.",
  },
  {
    title: "Capability and attack cost move towards each other",
    body: "The tracker plots both lines in one view: demonstrated logical qubits climbing, and the logical qubits needed to break ECDSA falling as better attack circuits are published.",
  },
  {
    title: "Arc already gives us the tool",
    body: "Arc supports SLH-DSA, one of NIST's standardised post-quantum signature schemes. Arc transactions themselves are still ECDSA-signed, with hybrid support intended once a final scheme is chosen.",
  },
];

export const WHAT_WE_CLAIM = [
  "Every receipt digest in this exchange is signed with SLH-DSA and verified before the receipt is anchored or paid.",
  "The Arc transaction that carries the anchor is still signed with ECDSA, so the chain is post-quantum at the evidence layer and classical underneath.",
  "That remaining classical leg stays an open hazard on the record, not a solved item.",
  "No claim is made that this system, Arc, or USDC is quantum-safe end to end.",
];
