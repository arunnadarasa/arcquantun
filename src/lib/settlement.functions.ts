// Back-filling and independent verification of settlements already submitted.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface ResolvedTx {
  transferId: string;
  txHash: string | null;
  state: string;
  arcscan: {
    found: boolean;
    status: string | null;
    block: number | null;
  };
}

/**
 * Ask Circle for the final state of transfers that were still pending when the
 * run finished, then confirm each resulting hash against Arcscan.
 */
export const resolveTransactions = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ transferIds: z.array(z.string().min(1)).max(40) }).parse(d))
  .handler(async ({ data }): Promise<{ resolved: ResolvedTx[]; configured: boolean }> => {
    const configured = Boolean(process.env["CIRCLE_API_KEY"] && process.env["CIRCLE_ENTITY_SECRET"]);
    if (!configured) return { resolved: [], configured: false };
    const { pollTransaction } = await import("./circle.server");
    const { readArcscanTx } = await import("./arcscan.server");
    const resolved: ResolvedTx[] = [];
    for (const transferId of data.transferIds) {
      // One immediate read per id; the page can be pressed again if it is still in flight.
      const { txHash, state } = await pollTransaction(transferId, 1, 0);
      const scan = txHash
        ? await readArcscanTx(txHash)
        : { found: false, status: null, block: null };
      resolved.push({
        transferId,
        txHash,
        state,
        arcscan: { found: scan.found, status: scan.status, block: scan.block },
      });
    }
    return { resolved, configured: true };
  });

export interface WalletReadiness {
  id: string;
  label: string;
  address: string | null;
  usdc: string | null;
  low: boolean;
  error: string | null;
}

/** Live balances for the wallets that spend. On Arc, USDC is also the gas token. */
export const readWalletReadiness = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ configured: boolean; wallets: WalletReadiness[] }> => {
    const configured = Boolean(process.env["CIRCLE_API_KEY"] && process.env["CIRCLE_ENTITY_SECRET"]);
    if (!configured) return { configured: false, wallets: [] };
    const { readWalletBalance } = await import("./circle.server");
    const specs = [
      {
        id: "trust",
        label: "Trust Agent — releases budgets",
        walletId: process.env["CIRCLE_TRUST_WALLET_ID"] ?? "",
        address: process.env["CIRCLE_TRUST_ADDRESS"] ?? null,
      },
      {
        id: "registry",
        label: "Registry Agent — anchors receipts",
        walletId: process.env["CIRCLE_REGISTRY_WALLET_ID"] ?? "",
        address: process.env["CIRCLE_REGISTRY_ADDRESS"] ?? null,
      },
    ];
    const wallets: WalletReadiness[] = [];
    for (const s of specs) {
      if (!s.walletId) {
        wallets.push({
          id: s.id,
          label: s.label,
          address: s.address,
          usdc: null,
          low: true,
          error: "No wallet configured",
        });
        continue;
      }
      try {
        const { usdc } = await readWalletBalance(s.walletId);
        wallets.push({
          id: s.id,
          label: s.label,
          address: s.address,
          usdc,
          low: Number(usdc) < 1,
          error: null,
        });
      } catch (e) {
        wallets.push({
          id: s.id,
          label: s.label,
          address: s.address,
          usdc: null,
          low: false,
          error: e instanceof Error ? e.message : "Balance read failed",
        });
      }
    }
    return { configured: true, wallets };
  },
);
