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
  /** Circle's internal transfer id. Not a transaction hash, never an Arcscan link. */
  transferId?: string | undefined;
  /** Independent Arcscan confirmation, once resolved. */
  arcscanStatus?: string | undefined;
  arcscanBlock?: number | undefined;
  simulated: boolean;
  grade: string;
  receiptHash: string;
  /** Post-quantum seal carried alongside the anchor. */
  sealScheme?: string | undefined;
  sealSignature?: string | undefined;
  sealVerified?: boolean | undefined;
  /** Nullifier of the human who authorised the release. Not an identifier of a person. */
  authorisedBy?: string | undefined;
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
      txHash: s.txHash ?? null,
      transferId: s.transferId,
      simulated: result.simulated,
      grade: result.grade,
      receiptHash: result.receiptHash,
      sealScheme: result.seal?.scheme,
      sealSignature: result.seal?.signatureFingerprint,
      sealVerified: result.seal?.verified,
      authorisedBy: result.authorisedBy ?? undefined,
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

/** Write back hashes for rows that were still pending when the run ended. */
export function applyResolutions(
  updates: Array<{
    transferId: string;
    txHash: string | null;
    arcscan?: { status: string | null; block: number | null } | undefined;
  }>,
): LedgerEntry[] {
  if (typeof window === "undefined") return [];
  const byId = new Map(updates.map((u) => [u.transferId, u]));
  const merged = readLedger().map((e) => {
    const u = e.transferId ? byId.get(e.transferId) : undefined;
    if (!u) return e;
    return {
      ...e,
      txHash: u.txHash ?? e.txHash,
      arcscanStatus: u.arcscan?.status ?? e.arcscanStatus,
      arcscanBlock: u.arcscan?.block ?? e.arcscanBlock,
    };
  });
  try {
    window.localStorage.setItem(KEY, JSON.stringify(merged));
  } catch {
    /* storage full — keep the in-memory copy */
  }
  return merged;
}

export function clearLedger(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
