#!/usr/bin/env node
// Register the exchange's parent name on the permissionless ENSv2 ETHRegistrar
// (Sepolia public beta) and write the agent identity records onto it.
//
// The v2 registrar is NOT DAO-gated and is priced in free mock USDC, so no ETH
// price maths and no controller approval. Commit/reveal with a 60s minimum age.
//
//   SEPOLIA_RPC_URL=... ENS_PRIVATE_KEY=0x... node scripts/ens-register.mjs
//
// Results are written back into src/data/ens.json so the app reads a file and a
// re-register needs no code edit — the same pattern as src/data/contract.json.
import { readFileSync, writeFileSync } from "node:fs";
import { createPublicClient, createWalletClient, http, parseAbi, namehash } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const CFG_PATH = new URL("../src/data/ens.json", import.meta.url);
const cfg = JSON.parse(readFileSync(CFG_PATH, "utf8"));

const RPC = process.env.SEPOLIA_RPC_URL;
const PK = process.env.ENS_PRIVATE_KEY;
if (!RPC || !PK) {
  console.error("Set SEPOLIA_RPC_URL and ENS_PRIVATE_KEY first.");
  process.exit(1);
}

const account = privateKeyToAccount(PK.startsWith("0x") ? PK : `0x${PK}`);
const pub = createPublicClient({ chain: sepolia, transport: http(RPC) });
const wallet = createWalletClient({ account, chain: sepolia, transport: http(RPC) });

const REGISTRAR = cfg.contracts.ethRegistrar;
const USDC = cfg.contracts.paymentToken;
const RESOLVER = cfg.contracts.permissionedResolverImpl;
const DURATION = 365n * 24n * 3600n;
const ZERO = "0x0000000000000000000000000000000000000000";
const ZERO32 = `0x${"0".repeat(64)}`;

// Custom errors must be in the ABI or reverts decode to garbage.
const registrarAbi = parseAbi([
  "function isAvailable(string label) view returns (bool)",
  "function getRegisterPrice(string label, uint64 duration, address paymentToken) view returns (uint256 base, uint256 premium)",
  "function makeCommitment(string label, address owner, bytes32 secret, address subregistry, address resolver, uint64 duration, bytes32 referrer) pure returns (bytes32)",
  "function commit(bytes32 commitment)",
  "function commitmentAt(bytes32 commitment) view returns (uint64)",
  "function register(string label, address owner, bytes32 secret, address subregistry, address resolver, uint64 duration, address paymentToken, bytes32 referrer) returns (uint256)",
  "error CommitmentTooNew(bytes32,uint64,uint64)",
  "error CommitmentTooOld(bytes32,uint64,uint64)",
  "error UnexpiredCommitmentExists(bytes32)",
  "error DurationTooShort(uint64,uint64)",
  "error NameNotAvailable(string)",
  "error NotValid(string)",
  "error InvalidOwner()",
  "error PaymentTokenNotSupported(address)",
  "error SafeERC20FailedOperation(address)",
  "error MaxCommitmentAgeTooLow()",
]);

const erc20Abi = parseAbi([
  "function mint(address to, uint256 amount)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
]);

const resolverAbi = parseAbi([
  "function setText(bytes32 node, string key, string value)",
  "function text(bytes32 node, string key) view returns (string)",
]);

const label = cfg.parent.replace(/\.eth$/, "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function send(hash, what) {
  console.log(`  ${what}: ${hash}`);
  const r = await pub.waitForTransactionReceipt({ hash });
  if (r.status !== "success") throw new Error(`${what} reverted`);
  return r;
}

async function registerParent() {
  const available = await pub.readContract({
    address: REGISTRAR,
    abi: registrarAbi,
    functionName: "isAvailable",
    args: [label],
  });
  if (!available) {
    console.log(`${cfg.parent} is not available — assuming it is already ours.`);
    return null;
  }

  const [base, premium] = await pub.readContract({
    address: REGISTRAR,
    abi: registrarAbi,
    functionName: "getRegisterPrice",
    args: [label, DURATION, USDC],
  });
  const price = base + premium;
  console.log(`Price: ${Number(price) / 1e6} USDC (mock, 6 decimals)`);

  // Free public mint, then approve BEFORE committing — a failed approve after a
  // commit wastes the whole 60 second wait.
  const bal = await pub.readContract({
    address: USDC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account.address],
  });
  if (bal < price * 2n) {
    await send(
      await wallet.writeContract({
        address: USDC,
        abi: erc20Abi,
        functionName: "mint",
        args: [account.address, 100_000000n],
      }),
      "mint mock USDC",
    );
  }
  await send(
    await wallet.writeContract({
      address: USDC,
      abi: erc20Abi,
      functionName: "approve",
      args: [REGISTRAR, price * 2n],
    }),
    "approve",
  );

  const secret = `0x${Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("hex")}`;
  const args = [label, account.address, secret, ZERO, RESOLVER, DURATION, ZERO32];
  const commitment = await pub.readContract({
    address: REGISTRAR,
    abi: registrarAbi,
    functionName: "makeCommitment",
    args,
  });
  await send(
    await wallet.writeContract({
      address: REGISTRAR,
      abi: registrarAbi,
      functionName: "commit",
      args: [commitment],
    }),
    "commit",
  );

  console.log("  waiting 65s for the commitment to mature…");
  await sleep(65_000);

  const receipt = await send(
    await wallet.writeContract({
      address: REGISTRAR,
      abi: registrarAbi,
      functionName: "register",
      args: [label, account.address, secret, ZERO, RESOLVER, DURATION, USDC, ZERO32],
    }),
    "register",
  );
  return receipt.transactionHash;
}

async function writeRecords() {
  const node = namehash(cfg.parent);
  const registry = cfg.attestationRegistry.address;
  for (const a of cfg.agents) {
    const actor = process.env[`CIRCLE_${a.id.toUpperCase()}_ADDRESS`] ?? a.arcActor;
    if (!actor) {
      console.log(`  ${a.id}: no Arc actor address known, skipping`);
      continue;
    }
    const entries = [
      [`arc:actor[${a.agentId}]`, `${cfg.attestationRegistry.caip2}:${actor}`],
      [`agent:intents[${a.agentId}]`, a.intents.join(",")],
      [
        `agent-registration[${registry}][${a.agentId}]`,
        `${cfg.attestationRegistry.caip2}:${registry}`,
      ],
    ];
    for (const [key, value] of entries) {
      const hash = await wallet.writeContract({
        address: RESOLVER,
        abi: resolverAbi,
        functionName: "setText",
        args: [node, key, value],
      });
      await send(hash, `setText ${key}`);
    }
    a.arcActor = actor;
    a.records = { setAt: new Date().toISOString(), tx: null };
  }
}

console.log(`Signer: ${account.address}`);
const tx = await registerParent();
if (tx) cfg.registerTx = tx;
await writeRecords();
cfg.registered = true;
cfg.registeredAt = new Date().toISOString();
writeFileSync(CFG_PATH, `${JSON.stringify(cfg, null, 2)}\n`);
console.log(`\nWrote src/data/ens.json — ${cfg.parent} is live with ${cfg.agents.length} agents.`);
