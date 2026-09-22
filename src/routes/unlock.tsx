import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { AuroraBackground } from "@/components/aurora-background";
import { unlockSite } from "@/lib/gate.functions";

export const Route = createFileRoute("/unlock")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } =>
    typeof search["redirect"] === "string" ? { redirect: search["redirect"] } : {},
  head: () => ({
    meta: [
      { title: "Enter — Clinical Quantum Exchange" },
      { name: "description", content: "This exchange is private. Enter the access password." },
      { property: "og:title", content: "Enter — Clinical Quantum Exchange" },
      {
        property: "og:description",
        content: "This exchange is private. Enter the access password.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UnlockPage,
});

function UnlockPage() {
  const router = useRouter();
  const search = Route.useSearch();
  const unlock = useServerFn(unlockSite);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    try {
      const { ok } = await unlock({ data: { password } });
      if (ok) {
        const target = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/";
        await router.navigate({ to: target, replace: true });
        router.invalidate();
        return;
      }
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center px-5">
      <AuroraBackground />
      <div className="glass-card w-full max-w-sm rounded-2xl p-8">
        <div className="flex items-center gap-2.5">
          <span
            className="grid size-8 place-items-center rounded-lg text-[0.72rem] font-bold text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-signal)" }}
          >
            CQ
          </span>
          <span className="font-display text-sm font-semibold tracking-tight">
            Clinical Quantum Exchange
          </span>
        </div>
        <h1 className="mt-6 text-lg font-semibold">This exchange is private</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the access password to continue. You stay unlocked on this device for seven days.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            autoFocus
            aria-label="Access password"
            placeholder="Access password"
            className="w-full rounded-lg border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary/60"
          />
          {error ? <p className="text-xs text-fail">Incorrect password</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-primary transition-colors hover:bg-primary/20 disabled:opacity-60"
          >
            {busy ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
