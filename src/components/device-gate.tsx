// The device gate: talks to the local signer bridge over loopback from the
// browser, builds the canonical release payload, and hands the signed
// approval to the run. It never sends secrets anywhere — the bridge returns
// only an address and a signature.
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Usb, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { DEVICE_BRIDGE_URL, buildDeviceApprovalMessage, type DeviceApproval } from "@/lib/device";
import { getDeviceStatus } from "@/lib/device.server";
import { formatUsdc } from "@/lib/arc-chain";

interface BridgeInfo {
  connected: boolean;
  address: string;
  path: string;
  app: string;
}

async function bridgeFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${DEVICE_BRIDGE_URL}${path}`, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `bridge ${res.status}`);
  }
  return (await res.json()) as T;
}

export function useDeviceBridge() {
  const statusFn = useServerFn(getDeviceStatus);
  const { data: status } = useQuery({
    queryKey: ["device-status"],
    queryFn: () => statusFn({}),
    staleTime: 60_000,
  });
  const bridge = useQuery({
    queryKey: ["device-bridge"],
    queryFn: () => bridgeFetch<BridgeInfo>("/device"),
    retry: false,
    refetchInterval: 30_000,
  });
  return { status, bridge };
}

// Compact bridge indicator for the top bar: green the moment the local signer
// bridge answers, so there is no need to check the terminal. Presentational
// only — it reuses the same polling query as the gate.
export function BridgeChip({ className = "" }: { className?: string }) {
  const { bridge } = useDeviceBridge();
  const online = bridge.data?.connected === true;
  const pending = bridge.isLoading;

  const tone = online
    ? "border-pass/40 bg-pass/10 text-pass"
    : "border-border bg-muted/40 text-muted-foreground";
  const label = online ? "bridge online" : pending ? "bridge…" : "bridge offline";

  return (
    <span
      aria-label={`Ledger bridge ${online ? "online" : "offline"}`}
      title={
        online
          ? "The local Ledger bridge is reachable — you can approve on the device."
          : "Bridge offline — start scripts/ledger on the machine the Ledger is plugged into."
      }
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.12em] ${tone} ${className}`}
    >
      <span
        className={`size-1.5 rounded-full bg-current ${online ? "animate-pulse" : ""}`}
        aria-hidden
      />
      {label}
    </span>
  );
}
  pathwayId,
  budgetMinor,
  engine,
  backendQualifier,
  shots,
  seed,
  approval,
  onApproved,
}: {
  pathwayId: string;
  budgetMinor: number;
  engine: string;
  backendQualifier: string;
  shots: number | null;
  seed: number | null;
  approval: DeviceApproval | null;
  onApproved: (a: DeviceApproval | null) => void;
}) {
  const { status, bridge } = useDeviceBridge();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A stale approval for another pathway is worse than none: clear it.
  useEffect(() => {
    if (approval && approval.message && !approval.message.includes(`pathway: ${pathwayId}`)) {
      onApproved(null);
    }
  }, [pathwayId, approval, onApproved]);

  const online = bridge.data?.connected === true;
  const required = status?.enrolled === true;
  const approvedForPathway =
    approval !== null && approval.message.includes(`pathway: ${pathwayId}`);

  const approve = async () => {
    setError(null);
    setBusy(true);
    try {
      const issuedAt = new Date().toISOString();
      const message = buildDeviceApprovalMessage({
        pathwayId,
        budgetMinor,
        engine,
        backendQualifier,
        shots,
        seed,
        issuedAt,
      });
      const { address, signature } = await bridgeFetch<{ address: string; signature: string }>(
        "/approve",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        },
      );
      onApproved({ message, signature, address, issuedAt });
    } catch (e) {
      setError(e instanceof Error ? e.message : "bridge unreachable");
      onApproved(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass-card rounded-lg p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Usb className="size-4 text-muted-foreground" aria-hidden />
        <span className="text-sm font-medium">Device confirmation</span>
        {approvedForPathway ? (
          <span className="inline-flex items-center gap-1 rounded border border-pass/40 bg-pass/10 px-2 py-0.5 text-[0.65rem] text-pass">
            <ShieldCheck className="size-3" /> signed by{" "}
            <span className="num">
              {approval!.address.slice(0, 8)}…{approval!.address.slice(-6)}
            </span>
          </span>
        ) : required ? (
          <span className="inline-flex items-center gap-1 rounded border border-gap/40 bg-gap/10 px-2 py-0.5 text-[0.65rem] text-gap">
            <ShieldAlert className="size-3" /> required before funds move
          </span>
        ) : (
          <span className="rounded border border-border bg-muted/40 px-2 py-0.5 text-[0.65rem] text-muted-foreground">
            no device enrolled
          </span>
        )}
        <span className="num ml-auto text-[0.65rem] text-muted-foreground">
          bridge {online ? "online" : "offline"} · {bridge.data?.path ?? "127.0.0.1:8943"}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        The enrolled Ledger signs the exact release parameters — pathway, budget, chain and
        quantum leg — after they are shown on its screen. No tap, no settlement.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={approve}
          disabled={busy || !online}
          className="inline-flex items-center gap-2 rounded bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Usb className="size-3.5" />}
          {approvedForPathway ? "Re-approve on Ledger" : "Approve on Ledger"}
        </button>
        {approvedForPathway ? (
          <button
            onClick={() => onApproved(null)}
            className="rounded border border-border px-3 py-2 text-xs transition-colors hover:bg-secondary"
          >
            Clear approval
          </button>
        ) : null}
        <span className="num text-[0.65rem] text-muted-foreground">
          payload: {formatUsdc(budgetMinor)} USDC · {engine} · {shots ?? 0} shots
        </span>
      </div>
      {error ? (
        <p className="mt-2 text-[0.7rem] text-fail">
          Bridge: {error}. Is <span className="num">scripts/ledger</span> running and the device
          unlocked with the Ethereum app open?
        </p>
      ) : null}
    </div>
  );
}
