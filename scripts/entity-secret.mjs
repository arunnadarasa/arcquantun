#!/usr/bin/env node
/**
 * Mint a new Circle entity secret and encrypt it for the console's
 * "Reset your Entity Secret" dialog.
 *
 *   CIRCLE_API_KEY=... node scripts/entity-secret.mjs
 *
 * Prints two things:
 *   1. the raw 64-char hex secret  -> save as CIRCLE_ENTITY_SECRET
 *   2. the base64 ciphertext       -> paste into the Circle console dialog
 *
 * Node built-ins only. No @circle-fin/* SDK (it breaks the worker runtime).
 */
import crypto from "node:crypto";

const CIRCLE_BASE = "https://api.circle.com/v1/w3s";

const apiKey = (process.env.CIRCLE_API_KEY ?? "").trim();
if (!apiKey) {
  console.error("CIRCLE_API_KEY is not set. Run:\n  CIRCLE_API_KEY=... node scripts/entity-secret.mjs");
  process.exit(1);
}

const reuse = (process.env.CIRCLE_ENTITY_SECRET ?? "").trim();
if (reuse && !/^[0-9a-fA-F]{64}$/.test(reuse)) {
  console.error("CIRCLE_ENTITY_SECRET is set but is not 64 hex characters.");
  process.exit(1);
}

// 1. the secret itself: 32 random bytes
const secretHex = reuse || crypto.randomBytes(32).toString("hex");
const secretBytes = Buffer.from(secretHex, "hex");

// 2. Circle's public key for this account
const res = await fetch(`${CIRCLE_BASE}/config/entity/publicKey`, {
  headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
});
const body = await res.text();
if (!res.ok) {
  console.error(`Circle rejected the public-key request [${res.status}]: ${body}`);
  process.exit(1);
}
const publicKey = JSON.parse(body)?.data?.publicKey;
if (!publicKey) {
  console.error(`No publicKey in Circle's response: ${body}`);
  process.exit(1);
}

// 3. RSA-OAEP(SHA-256). Circle rejects anything else.
const ciphertext = crypto
  .publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    secretBytes,
  )
  .toString("base64");

console.log("");
console.log("=== ENTITY SECRET (raw hex) ===================================");
console.log(secretHex);
console.log("Save this as CIRCLE_ENTITY_SECRET. It is shown once and never stored here.");
console.log("");
console.log("=== CIPHERTEXT (paste into the Circle console) ================");
console.log(ciphertext);
console.log("");
console.log("Console -> Configurator -> Entity Secret -> Reset (or Register).");
console.log("Paste the ciphertext, confirm, then download the recovery file Circle offers.");
console.log("Losing BOTH the hex above and that recovery file locks the wallets permanently.");
console.log("");
