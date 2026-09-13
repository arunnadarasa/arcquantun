// Client-safe device-approval model for the Ledger human-in-the-loop gate.
//
// Nothing irreversible happens without a device tap: before a budget is
// released, the enrolled Ledger signs the exact release parameters shown on
// its screen. The server rebuilds this message from committed data and refuses
// any signature over different bytes, so a client cannot swap the pathway,
// the budget or the quantum parameters inside an otherwise-valid signature.

/** The local signer bridge (scripts/ledger/bridge.mjs) binds to loopback only. */
export const DEVICE_BRIDGE_URL = "http://127.0.0.1:8943";

export const DEVICE_APPROVAL_CONTEXT = "Clinical Quantum Exchange — device approval";
export const ARC_TESTNET_CHAIN_ID = 5042002;

/** What the bridge returns for a signed approval. */
export interface DeviceApproval {
  message: string;
  signature: string;
  address: string;
  issuedAt: string;
}

export function formatUsdcFixed(minor: number): string {
  return (minor / 1e6).toFixed(6);
}

/**
 * The canonical approval message. One line per release parameter, because
 * that is what the device screen shows and what the server re-derives.
 */
export function buildDeviceApprovalMessage(input: {
  pathwayId: string;
  budgetMinor: number;
  engine: string;
  backendQualifier: string;
  shots: number | null;
  seed: number | null;
  issuedAt: string;
}): string {
  return [
    DEVICE_APPROVAL_CONTEXT,
    "action: release pathway budget",
    `pathway: ${input.pathwayId}`,
    `budget: ${formatUsdcFixed(input.budgetMinor)} USDC`,
    `chain: arc-testnet (${ARC_TESTNET_CHAIN_ID})`,
    `quantum leg: ${input.engine} (${input.backendQualifier}) · ${input.shots ?? 0} shots · seed ${input.seed ?? 0}`,
    `issued: ${input.issuedAt}`,
  ].join("\n");
}
