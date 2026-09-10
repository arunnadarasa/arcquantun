#!/usr/bin/env node
/**
 * Verify ReceiptAnchor.sol on Arcscan (Blockscout) using standard-json input.
 *
 *   node scripts/verify-arc.mjs
 */
import fs from "node:fs";
import solc from "solc";

const EXPLORER = "https://testnet.arcscan.app";
const CONTRACT_FILE = "contracts/ReceiptAnchor.sol";
const ARTIFACT_FILE = "src/data/contract.json";

const artifact = JSON.parse(fs.readFileSync(ARTIFACT_FILE, "utf8"));
const address = artifact.address;
if (!address) {
  console.error("No contract address in artifact");
  process.exit(1);
}

const source = fs.readFileSync(CONTRACT_FILE, "utf8");
const compilerversion = "v" + solc.version().split(".Emscripten")[0];
const input = JSON.stringify({
  language: "Solidity",
  sources: { "ReceiptAnchor.sol": { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
});

const params = new URLSearchParams({
  module: "contract",
  action: "verifysourcecode",
  contractaddress: address,
  contractname: "ReceiptAnchor.sol:ReceiptAnchor",
  compilerversion,
  optimizationUsed: "1",
  runs: "200",
  sourceCode: input,
  codeformat: "solidity-standard-json-input",
  licenseType: "3",
  constructorArguments: "",
  autodetectConstructorArguments: "true",
});

console.log(`Verifying ${address} with compiler ${compilerversion}`);
const res = await fetch(`${EXPLORER}/api?${params.toString()}`, { method: "POST" });
const text = await res.text();
console.log(`verify response [${res.status}]: ${text}`);

if (!res.ok) process.exit(1);

console.log("Polling for is_verified...");
for (let i = 0; i < 30; i++) {
  await new Promise((r) => setTimeout(r, 4000));
  const poll = await fetch(`${EXPLORER}/api/v2/smart-contracts/${address}`);
  const json = await poll.json();
  const verified = json?.is_verified === true;
  console.log(`  poll ${i + 1}: is_verified=${verified}`);
  if (verified) {
    artifact.verified = true;
    fs.writeFileSync(ARTIFACT_FILE, JSON.stringify(artifact, null, 2));
    console.log("Verified ✓");
    process.exit(0);
  }
}

console.error("Verification did not confirm in time");
process.exit(1);
