import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { AuroraBackground } from "@/components/aurora-background";

const nav = [
  { to: "/", label: "Exchange" },
  { to: "/agents", label: "Agents" },
  { to: "/ledger", label: "Settlements" },
  { to: "/evidence", label: "Evidence" },
  { to: "/architecture", label: "Architecture" },
  { to: "/deck", label: "Deck" },
];

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative min-h-screen">
      <AuroraBackground />
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded bg-primary text-[0.7rem] font-bold text-primary-foreground">
              CQ
            </span>
            <span className="font-display text-sm font-semibold tracking-tight">
              Clinical Quantum Exchange
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`rounded px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] transition-colors ${
                  path === n.to
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <button
            className="rounded border border-border p-2 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
        {open ? (
          <nav className="border-t border-border px-4 pb-3 md:hidden">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="block py-2.5 text-sm text-muted-foreground"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>
      <main>{children}</main>
      <footer className="mt-20 border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-10 text-xs leading-relaxed text-muted-foreground">
          <p className="max-w-3xl">
            Ranking supports a clinician&rsquo;s review. Nothing here diagnoses, books or
            discharges a patient. Waiting-list framing is capacity, cost and patient experience —
            no efficacy or outcome claim is made. Every number is shown with its engine and shot
            count. Receipt signing is classical, so this record is not quantum-safe end to end;
            that is logged as an open hazard.
          </p>
          <p className="mt-4">Arc Testnet · chain 5042002 · USDC is the gas token.</p>
        </div>
      </footer>
    </div>
  );
}

export function Pill({
  tone = "muted",
  children,
}: {
  tone?: "muted" | "pass" | "fail" | "gap" | "signal";
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    muted: "border-border bg-muted/50 text-muted-foreground",
    pass: "border-pass/40 bg-pass/10 text-pass",
    fail: "border-fail/40 bg-fail/10 text-fail",
    gap: "border-gap/40 bg-gap/10 text-gap",
    signal: "border-primary/40 bg-primary/10 text-primary",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[0.68rem] font-medium uppercase tracking-[0.1em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
