// Circle developer-controlled wallets on Arc Testnet.
// Hand-rolled fetch client — the @circle-fin/* SDKs assume Node and break the
// Worker runtime. Web Crypto + fetch only.
//
// Demo-fallback contract: nothing here throws at module scope. When secrets
// are absent, callers branch to simulated envelopes flagged simulated: true.
import { publicEncrypt, constants, randomUUID } from "crypto";
import { ARC_CIRCLE_BLOCKCHAIN, ARC_USDC_ADDRESS } from "./arc-chain";

const CIRCLE_BASE = "https://api.circle.com/v1/w3s";

export function circleConfigured(): boolean {
  return !!process.env["CIRCLE_API_KEY"] && !!process.env["CIRCLE_ENTITY_SECRET"];
}

function apiKey(): string {
  const k = process.env["CIRCLE_API_KEY"];
  if (!k) throw new Error("CIRCLE_API_KEY is not configured");
  return k;
}

let cachedPem: string | null = null;

async function publicKeyPem(): Promise<string> {
  if (cachedPem) return cachedPem;
  const res = await fetch(`${CIRCLE_BASE}/config/entity/publicKey`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  if (!res.ok) throw new Error(`Circle publicKey fetch failed ${res.status}`);
  const json = (await res.json()) as { data?: { publicKey?: string } };
  const pem = json?.data?.publicKey;
  if (!pem) throw new Error("Circle publicKey response missing data.publicKey");
  cachedPem = pem;
  return pem;
}

/** Re-encrypt the entity secret on every request — reused ciphertext is rejected. */
export async function encryptEntitySecret(): Promise<string> {
  const pem = await publicKeyPem();
  const secret = (process.env["CIRCLE_ENTITY_SECRET"] ?? "").trim();
  const buf = Buffer.from(secret, "hex");
  if (buf.length !== 32) {
    throw new Error("CIRCLE_ENTITY_SECRET must decode to 32 bytes (64 hex chars)");
  }
  return publicEncrypt(
    { key: pem, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
    buf,
  ).toString("base64");
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30_000);
  try {
    const res = await fetch(`${CIRCLE_BASE}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Circle ${path} failed ${res.status}: ${text.slice(0, 300)}`);
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(t);
  }
}

async function get<T>(path: string): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30_000);
  try {
    const res = await fetch(`${CIRCLE_BASE}${path}`, {
      headers: { Authorization: `Bearer ${apiKey()}` },
      signal: ctrl.signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Circle ${path} failed ${res.status}: ${text.slice(0, 300)}`);
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(t);
  }
}

export async function readWalletBalance(
  walletId: string,
): Promise<{ usdc: string; native: string | null }> {
  const json = await get<{ data?: { tokenBalances?: Array<Record<string, never>> } }>(
    `/wallets/${walletId}/balances?includeAll=true`,
  );
  const balances = (json?.data?.tokenBalances ?? []) as unknown as Array<{
    amount?: string;
    token?: { symbol?: string; isNative?: boolean; blockchain?: string };
  }>;
  const onArc = (b: { token?: { blockchain?: string } }) =>
    String(b?.token?.blockchain ?? "")
      .toUpperCase()
      .includes("ARC");
  const usdc = balances.find((b) => b.token?.symbol === "USDC" && onArc(b));
  const native = balances.find((b) => b.token?.isNative === true && onArc(b));
  return { usdc: String(usdc?.amount ?? "0"), native: native ? String(native.amount) : null };
}

const isHash = (v: unknown): v is string => typeof v === "string" && /^0x[a-f0-9]{64}$/i.test(v);

async function pollTransaction(
  txId: string,
  attempts = 0,
): Promise<{ txHash: string | null; state: string }> {
  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const json = await get<{ data?: { transaction?: { state?: string; txHash?: string } } }>(
        `/developer/transactions/${txId}`,
      );
      const tx = json?.data?.transaction;
      const state = String(tx?.state ?? "PENDING");
      const txHash = isHash(tx?.txHash) ? tx.txHash : null;
      if (["COMPLETE", "CONFIRMED", "FAILED", "DENIED", "CANCELED"].includes(state)) {
        return { txHash, state };
      }
    } catch {
      // transient — keep polling
    }
  }
  return { txHash: null, state: "PENDING" };
}

/** Real USDC transfer between agent wallets on Arc Testnet. */
export async function transferUsdc(opts: {
  walletId: string;
  toAddress: string;
  amountUsdc: string;
}): Promise<{ txHash: string | null; state: string; transferId: string }> {
  const create = await post<{ data?: { id?: string } }>("/developer/transactions/transfer", {
    idempotencyKey: randomUUID(),
    entitySecretCiphertext: await encryptEntitySecret(),
    walletId: opts.walletId,
    destinationAddress: opts.toAddress,
    amounts: [opts.amountUsdc],
    tokenAddress: ARC_USDC_ADDRESS,
    blockchain: ARC_CIRCLE_BLOCKCHAIN,
    feeLevel: "MEDIUM",
  });
  const txId = create?.data?.id;
  if (!txId) throw new Error("Circle transfer returned no transaction id");
  const { txHash, state } = await pollTransaction(txId);
  return { txHash, state, transferId: txId };
}

/** Write a receipt hash to the anchoring contract from a Circle wallet. */
export async function anchorReceipt(opts: {
  walletId: string;
  contractAddress: string;
  receiptHash: string;
  signalId: string;
  engine: string;
  shots: number;
}): Promise<{ txHash: string | null; state: string; transferId: string }> {
  const create = await post<{ data?: { id?: string } }>(
    "/developer/transactions/contractExecution",
    {
      idempotencyKey: randomUUID(),
      entitySecretCiphertext: await encryptEntitySecret(),
      walletId: opts.walletId,
      contractAddress: opts.contractAddress,
      abiFunctionSignature: "anchor(bytes32,string,string,uint32)",
      abiParameters: [opts.receiptHash, opts.signalId, opts.engine, opts.shots],
      feeLevel: "MEDIUM",
    },
  );
  const txId = create?.data?.id;
  if (!txId) throw new Error("Circle contractExecution returned no transaction id");
  const { txHash, state } = await pollTransaction(txId);
  return { txHash, state, transferId: txId };
}

export function preflight(): { ok: boolean; hints: string[] } {
  const hints: string[] = [];
  if (!process.env["CIRCLE_API_KEY"]) hints.push("CIRCLE_API_KEY is not configured");
  if (!process.env["CIRCLE_ENTITY_SECRET"]) hints.push("CIRCLE_ENTITY_SECRET is not configured");
  return { ok: hints.length === 0, hints };
}
