// Independent confirmation. Circle telling us a transfer completed is Circle's
// word; Arcscan reading the transaction back off the chain is the check.
import { ARC_EXPLORER } from "./arc-chain";

export interface ArcscanTx {
  found: boolean;
  status: string | null;
  block: number | null;
  from: string | null;
  to: string | null;
  method: string | null;
}

export async function readArcscanTx(hash: string): Promise<ArcscanTx> {
  const empty: ArcscanTx = {
    found: false,
    status: null,
    block: null,
    from: null,
    to: null,
    method: null,
  };
  if (!/^0x[a-f0-9]{64}$/i.test(hash)) return empty;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(`${ARC_EXPLORER}/api/v2/transactions/${hash}`, {
      headers: { accept: "application/json" },
      signal: ctrl.signal,
    });
    if (!res.ok) return empty;
    const j = (await res.json()) as {
      status?: string;
      block_number?: number;
      block?: number;
      from?: { hash?: string };
      to?: { hash?: string };
      method?: string;
    };
    return {
      found: true,
      status: j.status ?? null,
      block: j.block_number ?? j.block ?? null,
      from: j.from?.hash ?? null,
      to: j.to?.hash ?? null,
      method: j.method ?? null,
    };
  } catch {
    return empty;
  } finally {
    clearTimeout(t);
  }
}
