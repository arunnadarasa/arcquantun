// Client-safe labels and shape for the receipt seal. The signing itself is
// server-only and lives in src/lib/pq-seal.server.ts.
export const SEAL_SCHEME = "SLH-DSA-SHA2-128f";
export const SEAL_STANDARD = "NIST FIPS 205";

export interface ReceiptSeal {
  scheme: string;
  standard: string;
  /** Full 32-byte public key — small enough to publish with the receipt. */
  publicKey: string;
  publicKeyFingerprint: string;
  /** SLH-DSA signatures are ~17 kB, so the receipt carries a fingerprint. */
  signatureFingerprint: string;
  signatureBytes: number;
  verified: boolean;
  keySource: "seed-secret" | "demo-fixed-seed";
  sealedAt: string;
}
