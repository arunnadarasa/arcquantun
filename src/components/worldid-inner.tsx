// Client-only. IDKit touches window at import time, so this module is reached
// solely through React.lazy inside <ClientOnly>.
import { useEffect, useState } from "react";
import { IDKitRequestWidget, orbLegacy } from "@worldcoin/idkit";

interface RpContext {
  rp_id: string;
  nonce: string;
  created_at: number;
  expires_at: number;
  signature: string;
}

export default function WorldIdInner({
  open,
  onOpenChange,
  appId,
  action,
  signal,
  onVerified,
  onError,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  appId: `app_${string}`;
  action: string;
  signal: string;
  onVerified: (nullifierHash: string, level: string) => void;
  onError: (msg: string) => void;
}) {
  const [rp, setRp] = useState<RpContext | null>(null);
  // The signal is frozen for the widget's open cycle: a re-render between proof
  // generation and verification would otherwise bind the proof to a different one.
  const [frozenSignal] = useState(signal);

  useEffect(() => {
    if (!open) {
      setRp(null);
      return;
    }
    let cancelled = false;
    // The request signature expires after ~5 minutes, so it is minted fresh on
    // every open rather than cached across the widget's lifetime.
    void (async () => {
      try {
        const res = await fetch("/api/public/idkit/rp-signature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const j = (await res.json()) as Partial<RpContext> & { detail?: string };
        if (cancelled) return;
        if (!res.ok || !j.signature) {
          onError(`rp-signature ${res.status}: ${j.detail ?? "no signature returned"}`);
          return;
        }
        setRp({
          rp_id: j.rp_id!,
          nonce: j.nonce!,
          created_at: j.created_at!,
          expires_at: j.expires_at!,
          signature: j.signature,
        });
      } catch (e) {
        if (!cancelled) onError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, action, onError]);

  if (!rp) return null;

  const Widget = IDKitRequestWidget as unknown as React.ComponentType<Record<string, unknown>>;

  return (
    <Widget
      open={open}
      onOpenChange={onOpenChange}
      app_id={appId}
      action={action}
      rp_context={rp}
      allow_legacy_proofs
      preset={orbLegacy({ signal: frozenSignal })}
      environment="production"
      handleVerify={async (result: unknown) => {
        const res = await fetch("/api/public/idkit/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ app_id: appId, idkitResponse: result }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { detail?: string; code?: string };
          throw new Error(`verify ${res.status}: ${j.detail ?? j.code ?? "rejected"}`);
        }
      }}
      onSuccess={(result: unknown) => {
        const r = (result ?? {}) as {
          nullifier_hash?: string;
          verification_level?: string;
          responses?: { nullifier_hash?: string; identifier?: string }[];
        };
        const nullifier = r.nullifier_hash ?? r.responses?.[0]?.nullifier_hash ?? "";
        const level = r.verification_level ?? r.responses?.[0]?.identifier ?? "device";
        if (!nullifier) {
          onError("Verification returned no nullifier hash.");
          return;
        }
        onVerified(nullifier, level);
      }}
      onError={(code: unknown, debug: unknown) => onError(JSON.stringify({ code, debug }))}
    />
  );
}
