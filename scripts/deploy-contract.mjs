#!/usr/bin/env node
/**
 * Deploy ReceiptAnchor.sol to Arc Testnet via Circle Smart Contract Platform.
 *
 *   CIRCLE_API_KEY=... CIRCLE_ENTITY_SECRET=... node scripts/deploy-contract.mjs
 *
 * Uses the Registry wallet (CIRCLE_REGISTRY_WALLET_ID) so the same wallet later
 * calls anchor() through contractExecution. Writes the deployed address and tx
 * to src/data/contract.json.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import solc from "solc";

const CIRCLE_BASE = "https://api.circle.com/v1/w3s";
const BLOCKCHAIN = "ARC-TESTNET";
const CONTRACT_FILE = "contracts/ReceiptAnchor.sol";
const ARTIFACT_FILE = "src/data/contract.json";

const apiKey = (process.env.CIRCLE_API_KEY ?? "").trim();
const secretHex = (process.env.CIRCLE_ENTITY_SECRET ?? "").trim();
const walletId = (process.env.CIRCLE_REGISTRY_WALLET_ID ?? "").trim();

if (!apiKey || !/^[0-9a-fA-F]{64}$/.test(secretHex) || !walletId) {
  console.error("Need CIRCLE_API_KEY, a 64-hex-char CIRCLE_ENTITY_SECRET, and CIRCLE_REGISTRY_WALLET_ID.");
  process.exit(1);
}

function headers() {
  return { Authorization: `Bearer ${apiKey}`, Accept: "application/json" };
}

async function entitySecretCiphertext() {
  const res = await fetch(`${CIRCLE_BASE}/config/entity/publicKey`, { headers: headers() });
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
    headers: { ...headers(), "Content-Type": "application/json" },
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

async function get(path) {
  const res = await fetch(`${CIRCLE_BASE}${path}`, { headers: headers() });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path} [${res.status}]: ${text}`);
  return JSON.parse(text).data;
}

function compile() {
  const source = fs.readFileSync(CONTRACT_FILE, "utf8");
  const input = {
    language: "Solidity",
    sources: { "ReceiptAnchor.sol": { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
    },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = output.errors?.filter((e) => e.severity === "error") ?? [];
  if (errors.length) {
    throw new Error(`Compilation failed:\n${errors.map((e) => e.formattedMessage).join("\n")}`);
  }
  const contract = output.contracts["ReceiptAnchor.sol"].ReceiptAnchor;
  return { abi: contract.abi, bytecode: "0x" + contract.evm.bytecode.object };
}

async function deploy({ abi, bytecode }) {
  const created = await call("/contracts/deploy", {
    name: "ReceiptAnchor",
    walletId,
    blockchain: BLOCKCHAIN,
    abiJson: JSON.stringify(abi),
    bytecode,
    constructorParameters: [],
    feeLevel: "MEDIUM",
  });
  const contractId = created?.contract?.id ?? created?.contractId;
  if (!contractId) throw new Error(`no contract id: ${JSON.stringify(created)}`);
  console.log(`deploy initiated: ${contractId}`);

  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 2500));
    const status = await get(`/contracts/${contractId}`);
    const state = status?.contract?.status;
    const address = status?.contract?.contractAddress;
    const deployTx = status?.contract?.transaction?.txHash;
    console.log(`  poll ${i + 1}: ${state} ${address ?? ""} ${deployTx ?? ""}`);
    if (state === "COMPLETE") {
      return { contractId, address, deployTx };
    }
    if (["FAILED", "CANCELLED", "DENIED"].includes(state)) {
      throw new Error(`deploy failed: ${JSON.stringify(status?.contract)}`);
    }
  }
  throw new Error("deploy timed out");
}

const { abi, bytecode } = compile();
console.log(`bytecode length: ${bytecode.length} chars`);

const { contractId, address, deployTx } = await deploy({ abi, bytecode });

const artifactPath = path.resolve(ARTIFACT_FILE);
const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
artifact.deployed = true;
artifact.address = address;
artifact.deployTx = deployTx;
artifact.contractId = contractId;
artifact.abi = abi;
artifact.bytecode = bytecode;
artifact.verified = false;
artifact.chainId = 5042002;
artifact.explorer = "https://testnet.arcscan.app";
artifact.solc = "0.8.24";
fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));

console.log("");
console.log("=== DEPLOYED ================================================");
console.log(`address:    ${address}`);
console.log(`deploy tx:  ${deployTx ? `https://testnet.arcscan.app/tx/${deployTx}` : "pending"}`);
console.log(`explorer:   https://testnet.arcscan.app/address/${address}`);
console.log(`artifact:   ${artifactPath}`);
