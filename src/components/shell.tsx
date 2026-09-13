import { Link, useRouterState, ClientOnly } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { AuroraBackground } from "@/components/aurora-background";
import { BridgeChip } from "@/components/device-gate";
import { CHAT_FOOTER_CLAUSE } from "@/data/operations";

// The route list is the single source of truth. Ten flat links no longer fit a
// desktop bar, so they are read as three groups: the run itself, the proof
// layers that gate it, and the evidence that outlives it.
type NavItem = { to: string; label: string; hint?: string };
type NavGroup = { label: string; items: NavItem[] };

const primary: NavItem[] = [
  { to: "/", label: "Exchange" },
  { to: "/agents", label: "Agents" },
  { to: "/ledger", label: "Settlements" },
];

const groups: NavGroup[] = [
  {
    label: "Proof",
    items: [
      { to: "/identity", label: "Identity", hint: "ENS — which agent is paid" },
      { to: "/human", label: "Human", hint: "World ID — who released the budget" },
      { to: "/device", label: "Device", hint: "Ledger — the hardware tap" },
    ],
  },
  {
    label: "Evidence",
    items: [
      { to: "/evidence", label: "Evidence", hint: "Receipts, engines, shots, seeds" },
      { to: "/quantum-gap", label: "Quantum gap", hint: "Why receipts are sealed" },
      { to: "/sizing", label: "Job sizing", hint: "What a quantum job costs" },
      { to: "/architecture", label: "Architecture", hint: "The order a job runs in" },
      { to: "/deck", label: "Deck", hint: "The submission slides" },
    ],
  },
];

const allItems: NavItem[] = [...primary, ...groups.flatMap((g) => g.items)];

function linkClass(active: boolean) {
  return `relative rounded-md px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] transition-colors ${
    active
      ? "text-foreground after:absolute after:inset-x-3 after:-bottom-px after:h-px after:bg-primary"
      : "text-muted-foreground hover:text-foreground"
  }`;
}

function GroupMenu({ group, path }: { group: NavGroup; path: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const active = group.items.some((i) => i.to === path);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className={`${linkClass(active)} inline-flex items-center gap-1.5`}
      >
        {group.label}
        <ChevronDown
          className={`size-3 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute left-1/2 top-full z-50 w-[19rem] -translate-x-1/2 pt-2"
        >
          <div className="glass-card rounded-xl p-1.5">
            {group.items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2.5 transition-colors ${
                  path === item.to ? "bg-secondary" : "hover:bg-secondary/60"
                }`}
              >
                <span className="block text-sm font-medium text-foreground">{item.label}</span>
                {item.hint ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">{item.hint}</span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  return (
    <div className="relative min-h-screen">
      <AuroraBackground />
      <header
        className={`sticky top-0 z-40 border-b border-border/70 backdrop-blur-xl transition-[background-color,box-shadow,padding] duration-300 ${
          scrolled ? "bg-background/80 shadow-[var(--shadow-glass)]" : "bg-background/55"
        }`}
      >
        <div
          className={`mx-auto flex w-full max-w-[104rem] items-center gap-6 px-5 transition-[padding] duration-300 lg:px-10 ${
            scrolled ? "py-2.5" : "py-4"
          }`}
        >
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <span
              className="grid size-8 place-items-center rounded-lg text-[0.72rem] font-bold text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-signal)" }}
            >
              CQ
            </span>
            <span className="font-display text-sm font-semibold tracking-tight">
              Clinical Quantum Exchange
            </span>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {primary.map((n) => (
              <Link key={n.to} to={n.to} className={linkClass(path === n.to)}>
                {n.label}
              </Link>
            ))}
            {groups.map((g) => (
              <GroupMenu key={g.label} group={g} path={path} />
            ))}
          </nav>

          <ClientOnly fallback={null}>
            <span className="hidden xl:inline-flex">
              <BridgeChip />
            </span>
          </ClientOnly>

          <Link
            to="/"
            hash="board"
            className="hidden shrink-0 items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-primary transition-colors hover:bg-primary/20 lg:inline-flex"
          >
            Run a pathway
          </Link>

          <button
            className="ml-auto rounded-md border border-border p-2 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
        <div
          className="pointer-events-none h-px w-full opacity-60"
          style={{ backgroundImage: "var(--gradient-signal)" }}
        />
        {open ? (
          <nav className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-border bg-background/95 px-5 pb-6 pt-2 lg:hidden">
            <div className="border-b border-border/60 py-3">
              <ClientOnly fallback={null}>
                <BridgeChip />
              </ClientOnly>
            </div>
            {primary.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="block border-b border-border/60 py-3.5 text-base text-foreground"
              >
                {n.label}
              </Link>
            ))}
            {groups.map((g) => (
              <div key={g.label} className="mt-5">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-primary">{g.label}</p>
                {g.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="block border-b border-border/60 py-3 text-base text-muted-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        ) : null}
      </header>
      <main>{children}</main>
      <footer className="mt-24 border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 text-xs leading-relaxed text-muted-foreground md:grid-cols-[1.2fr_1fr_1.4fr]">
          <div>
            <p className="font-display text-sm font-semibold text-foreground">
              Clinical Quantum Exchange
            </p>
            <p className="mt-3">
              Autonomous agents are paid in USDC for clinical assessment work — and only for work
              that survives being read.
            </p>
          </div>
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-primary">The rails</p>
            <ul className="mt-3 space-y-1.5">
              <li>Arc Testnet · chain 5042002 · USDC is the gas token</li>
              <li>ENS on Sepolia · World ID · Ledger device tap</li>
              <li>Quantinuum Nexus H2-Emulator</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
              {allItems.map((n) => (
                <Link key={n.to} to={n.to} className="hover:text-foreground">
                  {n.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-primary">The boundary</p>
            <p className="mt-3">
              Ranking supports a clinician&rsquo;s review. Nothing here diagnoses, books or
              discharges a patient. Waiting-list framing is capacity, cost and patient experience —
              no efficacy or outcome claim is made. Every number is shown with its engine and shot
              count. Receipt digests are sealed with SLH-DSA; the Arc transaction carrying the
              anchor is still ECDSA-signed, so the chain is post-quantum at the evidence layer and
              classical underneath. That remaining leg is logged as an open hazard.{" "}
              {CHAT_FOOTER_CLAUSE}
            </p>
          </div>
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
    pass: "border-pass/40 bg-pass/10 text-pass shadow-[0_0_22px_-10px_var(--pass)]",
    fail: "border-fail/40 bg-fail/10 text-fail shadow-[0_0_22px_-10px_var(--fail)]",
    gap: "border-gap/40 bg-gap/10 text-gap shadow-[0_0_22px_-10px_var(--gap)]",
    signal: "border-primary/40 bg-primary/10 text-primary shadow-[0_0_22px_-10px_var(--primary)]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.68rem] font-medium uppercase tracking-[0.1em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
