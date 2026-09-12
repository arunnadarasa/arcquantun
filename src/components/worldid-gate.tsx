// The human-authority gate. A pathway budget is released by an agent — this is
// where a real, unique human takes responsibility for that release.
import { lazy, Suspense, useCallback, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Fingerprint, Loader2, ShieldCheck } from "lucide-react";
import { WORLDID_CONFIG } from "@/config/worldid";
import { shortNullifier, type HumanAuthority } from "@/lib/world";
import { authoriseDemo, getWorldStatus } from "@/lib/world.functions";
import { Pill } from "@/components/shell";

const WorldIdInner = lazy(() => import("./worldid-inner"));

export function WorldIdGate({
  pathwayId,
  authority,
  onAuthorised,
  onCleared,
}: {
  pathwayId: string;
  authority: HumanAuthority | null;
  onAuthorised: (a: HumanAuthority) => void;
  onCleared: () => void;
}) {
  const statusFn = useServerFn(getWorldStatus);
  const demoFn = useServerFn(authoriseDemo);
  const { data: status } = useQuery({ queryKey: ["world-status"], queryFn: () => statusFn({}) });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((msg: string) => {
    setError(msg);
    setOpen(false);
  }, []);

  async function authorise() {
    setError(null);
    if (status?.live) {
      setOpen(true);
      return;
    }
    setBusy(true);
    try {
      onAuthorised(await demoFn({ data: { pathwayId } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass-card rounded-lg p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Fingerprint className="size-4 text-accent" aria-hidden />
        <h2 className="text-sm font-semibold">Human authority</h2>
        <Pill tone={authority ? (authority.simulated ? "gap" : "pass") : "gap"}>
          {authority ? (authority.simulated ? "simulated credential" : "verified human") : "not authorised"}
        </Pill>
        {status && !status.live ? <Pill tone="gap">sandbox pending</Pill> : null}
      </div>
      <p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        An agent releases the budget, but a person has to answer for it. World ID reduces that
        person to a single nullifier hash: stable for one human on this action, so a second
        release by the same person is visibly the same person — and telling you nothing about who
        they are. {WORLDID_CONFIG.purpose}
      </p>
      {status && !status.live ? (
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-gap">{status.reason}</p>
      ) : null}

      {authority ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
          <span className="num text-[0.68rem] text-muted-foreground">
            nullifier: <span className="text-foreground">{shortNullifier(authority.nullifierHash)}</span>
          </span>
          <span className="num text-[0.68rem] text-muted-foreground">
            credential: <span className="text-foreground">{authority.credential}</span>
          </span>
          <span className="num text-[0.68rem] text-muted-foreground">
            level: <span className="text-foreground">{authority.verificationLevel}</span>
          </span>
          <span className="num text-[0.68rem] text-muted-foreground">
            action: <span className="text-foreground">{authority.action}</span>
          </span>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 rounded border border-fail/40 bg-fail/10 p-3 text-[0.7rem] text-fail">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => void authorise()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded border border-accent/50 bg-accent/10 px-3 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}
          {authority ? "Re-authorise" : "Authorise budget release"}
        </button>
        {authority ? (
          <button
            onClick={onCleared}
            className="rounded border border-border px-3 py-2 text-xs transition-colors hover:bg-secondary"
          >
            Clear
          </button>
        ) : null}
      </div>

      {status?.live ? (
        <ClientOnly fallback={null}>
          <Suspense fallback={null}>
            <WorldIdInner
              open={open}
              onOpenChange={setOpen}
              appId={WORLDID_CONFIG.appId}
              action={WORLDID_CONFIG.action}
              signal={pathwayId}
              onVerified={(nullifierHash, level) => {
                setOpen(false);
                onAuthorised({
                  nullifierHash,
                  credential: WORLDID_CONFIG.credential,
                  verificationLevel: level,
                  action: WORLDID_CONFIG.action,
                  signal: pathwayId,
                  verifiedAt: new Date().toISOString(),
                  simulated: false,
                });
              }}
              onError={handleError}
            />
          </Suspense>
        </ClientOnly>
      ) : null}
    </div>
  );
}
