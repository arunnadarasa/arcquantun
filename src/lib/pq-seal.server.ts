// Post-quantum receipt seal.
//
// Arc supports SLH-DSA, one of NIST's standardised post-quantum signature
// schemes, so the evidence layer of this exchange is sealed with it. The Arc
// transaction that anchors the seal is still ECDSA-signed today: that is a
// hybrid chain, and the app says so rather than claiming "quantum-safe".
//
// Server-only. The private seed never leaves this module.
import { slh_dsa_sha2_128f as slh } from "@noble/post-quantum/slh-dsa.js";
import { SEAL_SCHEME, SEAL_STANDARD, type ReceiptSeal } from "@/data/seal-info";

export type { ReceiptSeal };

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", bytes as unknown as ArrayBuffer);
  return hex(new Uint8Array(d));
}

let cached: { keys: { publicKey: Uint8Array; secretKey: Uint8Array }; source: ReceiptSeal["keySource"] } | null =
  null;

function keys() {
  if (cached) return cached;
  const seedLen = slh.lengths.seed ?? 48;
  const seed = new Uint8Array(seedLen);
  const secret = process.env["PQ_SIGNING_SEED"];
  let source: ReceiptSeal["keySource"] = "demo-fixed-seed";
  if (secret && secret.length >= 16) {
    source = "seed-secret";
    const raw = new TextEncoder().encode(secret);
    for (let i = 0; i < seedLen; i++) seed[i] = (raw[i % raw.length] ?? 0) ^ (i * 31 + 7);
  } else {
    // Deterministic demo key so the build seals receipts with zero secrets.
    for (let i = 0; i < seedLen; i++) seed[i] = (i * 61 + 17) & 0xff;
  }
  cached = { keys: slh.keygen(seed), source };
  return cached;
}

/** Sign a receipt digest with SLH-DSA and verify the signature on the spot. */
export async function sealDigest(digest: string): Promise<ReceiptSeal> {
  const { keys: kp, source } = keys();
  const msg = new TextEncoder().encode(digest);
  const signature = slh.sign(msg, kp.secretKey);
  const verified = slh.verify(signature, msg, kp.publicKey);
  const sigDigest = await sha256Hex(signature);
  const pkHex = hex(kp.publicKey);
  return {
    scheme: SEAL_SCHEME,
    standard: SEAL_STANDARD,
    publicKey: `0x${pkHex}`,
    publicKeyFingerprint: `${pkHex.slice(0, 8)}…${pkHex.slice(-8)}`,
    signatureFingerprint: `0x${sigDigest.slice(0, 16)}…${sigDigest.slice(-8)}`,
    signatureBytes: signature.length,
    verified,
    keySource: source,
    sealedAt: new Date().toISOString(),
  };
}
