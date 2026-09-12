#!/usr/bin/env node
// Deploy AgentResolver on Sepolia, point clinicalquantum.eth at it through the
// ENSv2 registry, and write the agent identity records.
//
// The beta PermissionedResolver is role-gated per resource and a freshly
// registered name holds no roles on it, so writes revert with
// EACUnauthorizedAccountRoles. Owning the resolver outright is the shorter and
// more honest path: the registry entry still proves the name controls it.
//
//   SEPOLIA_RPC_URL=... ENS_PRIVATE_KEY=0x... node scripts/ens-resolver.mjs
import { readFileSync, writeFileSync } from "node:fs";
import solc from "solc";
import { createPublicClient, createWalletClient, http, parseAbi, labelhash } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const CFG_PATH = new URL("../src/data/ens.json", import.meta.url);
const cfg = JSON.parse(readFileSync(CFG_PATH, "utf8"));
const SRC = readFileSync(new URL("../contracts/AgentResolver.sol", import.meta.url), "utf8");

const account = privateKeyToAccount(process.env.ENS_PRIVATE_KEY);
const pub = createPublicClient({ chain: sepolia, transport: http(process.env.SEPOLIA_RPC_URL) });
const wallet = createWalletClient({ account, chain: sepolia, transport: http(process.env.SEPOLIA_RPC_URL) });

function compile() {
  const out = JSON.parse(
    solc.compile(
      JSON.stringify({
        language: "Solidity",
        sources: { "AgentResolver.sol": { content: SRC } },
        settings: {
          optimizer: { enabled: true, runs: 200 },
          outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
        },
      }),
    ),
  );
  for (const e of out.errors ?? []) if (e.severity === "error") throw new Error(e.formattedMessage);
  const c = out.contracts["AgentResolver.sol"].AgentResolver;
  return { abi: c.abi, bytecode: `0x${c.evm.bytecode.object}` };
}

async function wait(hash, what) {
  console.log(`  ${what}: ${hash}`);
  const r = await pub.waitForTransactionReceipt({ hash });
  if (r.status !== "success") throw new Error(`${what} reverted`);
  return r;
}

const { abi, bytecode } = compile();
console.log("Compiled AgentResolver with solc", solc.version());

let resolverAddress = cfg.contracts.agentResolver;
if (!resolverAddress) {
  const hash = await wallet.deployContract({ abi, bytecode, args: [account.address] });
  const r = await wait(hash, "deploy AgentResolver");
  resolverAddress = r.contractAddress;
  cfg.contracts.agentResolver = resolverAddress;
  console.log(`  address: ${resolverAddress}`);
}

const tokenId = BigInt(labelhash(cfg.parent.replace(/\.eth$/, ""))) & ~0xffffffffn;
const current = await pub.readContract({
  address: cfg.contracts.registry,
  abi: parseAbi(["function getResolver(string) view returns (address)"]),
  functionName: "getResolver",
  args: [cfg.parent.replace(/\.eth$/, "")],
});
if (current.toLowerCase() !== resolverAddress.toLowerCase()) {
  await wait(
    await wallet.writeContract({
      address: cfg.contracts.registry,
      abi: parseAbi(["function setResolver(uint256,address)"]),
      functionName: "setResolver",
      args: [tokenId, resolverAddress],
    }),
    "registry.setResolver",
  );
}

const registry = cfg.attestationRegistry.address;
const keys = [];
const values = [];
for (const a of cfg.agents) {
  const actor = process.env[`CIRCLE_${a.id.toUpperCase()}_ADDRESS`] ?? a.arcActor;
  if (!actor) {
    console.log(`  ${a.id}: no Arc actor address known, skipping`);
    continue;
  }
  keys.push(`arc:actor[${a.agentId}]`, `agent:intents[${a.agentId}]`, `agent-registration[${registry}][${a.agentId}]`);
  values.push(
    `${cfg.attestationRegistry.caip2}:${actor}`,
    a.intents.join(","),
    `${cfg.attestationRegistry.caip2}:${registry}`,
  );
  a.arcActor = actor;
  a.records = { setAt: new Date().toISOString() };
}
keys.push("description", "url");
values.push(
  "Clinical Quantum Exchange — agent namespace for USDC settlement on Arc Testnet",
  "https://arcquantum.lovable.app/identity",
);

const recordsTx = await wallet.writeContract({
  address: resolverAddress,
  abi,
  functionName: "setTexts",
  args: [keys, values],
});
await wait(recordsTx, `setTexts (${keys.length} records)`);

cfg.registered = true;
cfg.registeredAt = cfg.registeredAt ?? new Date().toISOString();
cfg.recordsTx = recordsTx;
cfg.tokenId = tokenId.toString();
writeFileSync(CFG_PATH, `${JSON.stringify(cfg, null, 2)}\n`);
console.log(`\n${cfg.parent} resolves through ${resolverAddress} with ${keys.length} records.`);
