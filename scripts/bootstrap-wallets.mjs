#!/usr/bin/env node
/**
 * Create the exchange's developer-controlled wallets on Arc Testnet.
 *
 *   CIRCLE_API_KEY=... CIRCLE_ENTITY_SECRET=<64 hex> node scripts/bootstrap-wallets.mjs
 *
 * Run this AFTER the entity secret is registered/reset in the Circle console.
 * Prints the wallet ids and addresses to save as project keys.
 */
import crypto from "node:crypto";

const CIRCLE_BASE = "https://api.circle.com/v1/w3s";
const BLOCKCHAIN = "ARC-TESTNET";

// One wallet per agent in src/data/agents.ts.
const AGENTS = [
  { id: "trust", env: "CIRCLE_TRUST" },
  { id: "baseline", env: "CIRCLE_BASELINE" },
  { id: "nexus", env: "CIRCLE_NEXUS" },
  { id: "registry", env: "CIRCLE_REGISTRY" },
];

const apiKey = (process.env.CIRCLE_API_KEY ?? "").trim();
const secretHex = (process.env.CIRCLE_ENTITY_SECRET ?? "").trim();
if (!apiKey || !/^[0-9a-fA-F]{64}$/.test(secretHex)) {
  console.error("Need CIRCLE_API_KEY and a 64-hex-char CIRCLE_ENTITY_SECRET in the environment.");
  process.exit(1);
}

/** Circle rejects a reused ciphertext, so encrypt fresh for every request. */
async function entitySecretCiphertext() {
  const res = await fetch(`${CIRCLE_BASE}/config/entity/publicKey`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`publicKey [${res.status}]: ${text}`);
  const publicKey = JSON.parse(text)?.data?.publicKey;
  if (!publicKey) throw new Error(`no publicKey in response: ${text}`);
  return crypto
    .publicEncrypt(
      { key: publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
      Buffer.from(secretHex, "hex"),
    )
    .toString("base64");
}

async function call(path, payload) {
  const res = await fetch(`${CIRCLE_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      idempotencyKey: crypto.randomUUID(),
      entitySecretCiphertext: await entitySecretCiphertext(),
      ...payload,
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path} [${res.status}]: ${text}`);
  return JSON.parse(text).data;
}

// Reuse an existing set when one was already created (WALLET_SET_ID=...).
let walletSetId = (process.env.WALLET_SET_ID ?? "").trim();
if (!walletSetId) {
  const set = await call("/developer/walletSets", { name: "Clinical Quantum Exchange" });
  walletSetId = set?.walletSet?.id;
  if (!walletSetId) throw new Error(`no wallet set id: ${JSON.stringify(set)}`);
}
console.log(`wallet set: ${walletSetId}`);

// `blockchains` must be unique; `count` is what multiplies the wallets.
const created = await call("/developer/wallets", {
  walletSetId,
  blockchains: [BLOCKCHAIN],
  accountType: "EOA",
  count: AGENTS.length,
});

const wallets = created?.wallets ?? [];
if (wallets.length !== AGENTS.length) {
  throw new Error(`expected ${AGENTS.length} wallets, got ${wallets.length}`);
}

console.log("");
console.log("=== SAVE THESE AS PROJECT KEYS ================================");
AGENTS.forEach((agent, i) => {
  const w = wallets[i];
  console.log(`${agent.env}_WALLET_ID=${w.id}`);
  console.log(`${agent.env}_ADDRESS=${w.address}`);
});
console.log("");
console.log(`Fund the trust wallet at https://faucet.circle.com (pick Arc Testnet):`);
console.log(`  ${wallets[0].address}`);
console.log("USDC is the gas token on Arc, so that one top-up covers gas and payouts.");
console.log("");
