// Arc Testnet constants. USDC is the native gas token and has 6 decimals.
export const ARC_CHAIN_ID = 5042002;
export const ARC_RPC_URL = "https://rpc.testnet.arc.network";
export const ARC_EXPLORER = "https://testnet.arcscan.app";
export const ARC_CIRCLE_BLOCKCHAIN = "ARC-TESTNET";
export const ARC_USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
export const ARC_USDC_DECIMALS = 6;
export const ARC_FAUCET = "https://faucet.circle.com/";

export function txUrl(hash: string): string {
  return `${ARC_EXPLORER}/tx/${hash}`;
}

export function addressUrl(address: string): string {
  return `${ARC_EXPLORER}/address/${address}`;
}

/** Format USDC minor units (6dp) for display. */
export function formatUsdc(minor: number, dp = 2): string {
  return (minor / 10 ** ARC_USDC_DECIMALS).toFixed(dp);
}

export function toMinor(usdc: number): number {
  return Math.round(usdc * 10 ** ARC_USDC_DECIMALS);
}

export function shortAddress(a: string): string {
  if (!a || a.length < 12) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
