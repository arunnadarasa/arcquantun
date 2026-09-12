// One shared client settlement ledger. Every settlement path writes here, so
// there is a single list proving money moved, across every mode.
import type { RunResult } from "./exchange.functions";

export interface LedgerEntry {
  id: string;
  at: string;
  pathwayId: string;
  agentId: string;
  /** The ENS name this leg was paid to, where one is bound. */
  ensName?: string | undefined;
  label: string;
  amountMinor: number;
  txHash: string | null;
  simulated: boolean;
  grade: string;
  receiptHash: string;
  /** Post-quantum seal carried alongside the anchor. */
  sealScheme?: string | undefined;
  sealSignature?: string | undefined;
  sealVerified?: boolean | undefined;
}

const KEY = "cqx.ledger.v1";

export function readLedger(): LedgerEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LedgerEntry[]) : [];
  } catch {
    return [];
  }
}

export function recordRun(result: RunResult): LedgerEntry[] {
  if (typeof window === "undefined") return [];
  const rows: LedgerEntry[] = [];
  for (const s of result.steps) {
    if (s.kind !== "settlement" && s.kind !== "anchor") continue;
    if (!s.txHash && !s.transferId) continue;
    rows.push({
      id: `${result.receiptHash}:${s.kind}:${s.agentId ?? "n/a"}`,
      at: result.startedAt,
      pathwayId: result.pathwayId,
      agentId: s.agentId ?? "registry",
      ensName: s.ensName,
      label: s.kind === "anchor" ? "Receipt anchored" : s.title,
      amountMinor: s.amountMinor ?? 0,
      txHash: s.txHash ?? s.transferId ?? null,
      simulated: result.simulated,
      grade: result.grade,
      receiptHash: result.receiptHash,
      sealScheme: result.seal?.scheme,
      sealSignature: result.seal?.signatureFingerprint,
      sealVerified: result.seal?.verified,
    });
  }
  const existing = readLedger();
  const merged = [...rows, ...existing.filter((e) => !rows.some((r) => r.id === e.id))];
  try {
    window.localStorage.setItem(KEY, JSON.stringify(merged.slice(0, 300)));
  } catch {
    /* storage full — ledger stays in memory for this session */
  }
  return merged;
}

export function clearLedger(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
