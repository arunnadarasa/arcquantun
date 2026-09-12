import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, CircleDot, Loader2, ShieldCheck } from "lucide-react";
import { Shell, Pill } from "@/components/shell";
import { CountUp, Meter, Reveal } from "@/components/motion";
import { pathways } from "@/data/pathways";
import { getRun } from "@/data/runs";
import { formatUsdc, txUrl } from "@/lib/arc-chain";
import { gradeReceipt } from "@/lib/receipts";
import { runPathwayJob, type RunResult } from "@/lib/exchange.functions";
import { recordRun } from "@/lib/ledger";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Clinical Quantum Exchange — Agents, Receipts, USDC on Arc" },
      {
        name: "description",
        content:
          "NHS waiting-list pathways buy quantum and classical assessments from independent agents. Payment clears only against a graded receipt anchored on Arc Testnet.",
      },
      { property: "og:title", content: "Clinical Quantum Exchange" },
      {
        property: "og:description",
        content:
          "An agentic marketplace where a receipt with engine, shots and seed is the condition for getting paid in USDC on Arc.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

// A bar is only drawn where the floor has a bounded scale it can honestly sit
// against; open-ended counts get no bar rather than an invented ceiling.
function floorScale(floor: { value: number; unit: string }): { value: number; max: number } | null {
  if (floor.unit === "%") return { value: floor.value, max: 100 };
  const outOf = /^of\s+(\d+(?:\.\d+)?)$/.exec(floor.unit.trim());
  if (outOf) return { value: floor.value, max: Number(outOf[1]) };
  if (floor.unit === "" && floor.value > 0 && floor.value <= 1) {
    return { value: floor.value, max: 1 };
  }
  return null;
}

function Index() {
  const [selected, setSelected] = useState<string | null>(null);
  const runFn = useServerFn(runPathwayJob);
  const [result, setResult] = useState<RunResult | null>(null);

  const mutation = useMutation({
    mutationFn: (pathwayId: string) => runFn({ data: { pathwayId } }),
    onSuccess: (r) => {
      setResult(r);
      recordRun(r);
    },
  });

  return (
    <Shell>
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 grid-fade opacity-40" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <Pill tone="signal">
            <CircleDot className="size-3" /> Arc Testnet · Agentic Economy
          </Pill>
          <h1 className="mt-5 max-w-3xl text-3xl leading-[1.1] font-semibold md:text-5xl">
            Agents get paid for the truth, not for the result.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            A Trust Agent holds a USDC budget for an NHS waiting-list pathway and posts a job.
            Independent agents run the classical baseline and the quantum leg. Payment clears only
            when the receipt carries its engine, shot count, seed and verdict, and its hash is
            anchored on Arc. A method that loses still gets paid — and the record says it lost.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#board"
              className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Run a pathway job <ArrowRight className="size-4" />
            </a>
            <Link
              to="/architecture"
              className="inline-flex items-center gap-2 rounded border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
            >
              See the architecture
            </Link>
          </div>
          <dl className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              [7, "pathways posted"],
              [4, "agents with wallets"],
              [2048, "shots per run"],
              [0, "advantage claims"],
            ].map(([v, l]) => (
              <div key={String(l)}>
                <dt className="num text-2xl font-medium text-primary">
                  <CountUp value={Number(v)} />
                </dt>
                <dd className="mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  {l}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="board" className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-xl font-semibold md:text-2xl">Pathway board</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Each question was written in clinician language before any method was chosen. The
          classical floor was recorded first, in every case.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {pathways.map((p, i) => {
            const run = getRun(p.id);
            const grade = run ? gradeReceipt(run.receipt).grade : "STRUCTURAL";
            const active = selected === p.id;
            const scale = floorScale(p.classicalFloor);
            return (
              <Reveal key={p.id} delay={(i % 2) * 80} className="h-full">
              <article
                className={`glass-card h-full rounded-lg p-5 ${active ? "border-primary" : ""}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={p.status === "assessed" ? "muted" : "gap"}>{p.status}</Pill>
                  <Pill
                    tone={grade === "PASS" ? "pass" : grade === "FAIL" ? "fail" : "gap"}
                  >
                    receipt {grade}
                  </Pill>
                  <span className="num ml-auto text-xs text-muted-foreground">
                    {formatUsdc(p.budgetMinor)} USDC
                  </span>
                </div>
                <h3 className="mt-3 text-[0.72rem] uppercase tracking-[0.14em] text-muted-foreground">
                  {p.service}
                </h3>
                <p className="mt-2 text-[0.95rem] leading-snug font-medium">{p.question}</p>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {p.whyItMatters}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 rounded border border-border bg-surface-2/40 p-3 text-xs">
                  <div>
                    <div className="text-muted-foreground">Classical floor</div>
                    <div className="num mt-1 text-foreground">
                      {p.classicalFloor.value}
                      {p.classicalFloor.unit === "%" ? "%" : ` ${p.classicalFloor.unit}`}{" "}
                      {p.classicalFloor.metric}
                    </div>
                    {scale ? (
                      <div className="mt-2">
                        <Meter value={scale.value} max={scale.max} delay={120} />
                      </div>
                    ) : null}
                    <div className="mt-2 text-[0.65rem] leading-relaxed text-muted-foreground">
                      best of {p.classicalFloor.family.length} classical methods
                      {powered ? ` · ${powered.method}` : ""}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Register</div>
                    <div className="num mt-1 text-foreground">{p.qubitsNeeded} qubits</div>
                    <div className="mt-2">
                      <Meter
                        value={p.qubitsNeeded}
                        max={32}
                        tone={p.status === "assessed" ? "signal" : "gap"}
                        delay={200}
                      />
                    </div>
                  </div>
                </div>
                {p.ceiling ? (
                  <p className="mt-3 rounded border border-gap/40 bg-gap/10 p-3 text-[0.7rem] leading-relaxed text-muted-foreground">
                    <span className="text-gap">Cohort unfit.</span> Classical ceiling{" "}
                    <span className="num text-foreground">{p.ceiling.oracle}</span> at{" "}
                    <span className="num text-foreground">
                      {p.ceiling.oracleN.toLocaleString()}
                    </span>{" "}
                    records against a bar of {p.ceiling.bar}. No quantum budget released.
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelected(p.id);
                      setResult(null);
                      mutation.mutate(p.id);
                    }}
                    disabled={mutation.isPending}
                    className="inline-flex items-center gap-2 rounded bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {mutation.isPending && active ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="size-3.5" />
                    )}
                    Run job
                  </button>
                  <Link
                    to="/evidence"
                    hash={p.id}
                    className="inline-flex items-center gap-1.5 rounded border border-border px-3 py-2 text-xs transition-colors hover:bg-secondary"
                  >
                    Receipt
                  </Link>
                </div>
              </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {mutation.isError ? (
        <section className="mx-auto max-w-6xl px-4 pb-10">
          <div className="rounded border border-fail/40 bg-fail/10 p-4 text-sm text-fail">
            The job could not be run: {String(mutation.error)}
          </div>
        </section>
      ) : null}

      {result ? <RunPanel result={result} /> : null}
    </Shell>
  );
}

function RunPanel({ result }: { result: RunResult }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20">
      <div className="glass-card rounded-lg">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Run ledger</h2>
          <Pill tone={result.grade === "PASS" ? "pass" : "gap"}>receipt {result.grade}</Pill>
          <Pill tone={result.simulated ? "gap" : "signal"}>
            {result.simulated ? "demo mode" : "live on arc"}
          </Pill>
          <span className="num ml-auto text-xs text-muted-foreground">
            {formatUsdc(result.totalPaidMinor)} USDC settled
          </span>
        </div>
        <ol className="divide-y divide-border">
          {result.steps.map((s, i) => (
            <li key={i} className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`num text-[0.68rem] ${s.ok ? "text-pass" : "text-fail"}`}
                  aria-hidden
                >
                  {s.ok ? "✓" : "✕"}
                </span>
                <span className="text-sm font-medium">{s.title}</span>
                <span className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                  {s.kind}
                </span>
                {s.amountMinor ? (
                  <span className="num ml-auto text-xs text-primary">
                    {formatUsdc(s.amountMinor)} USDC
                  </span>
                ) : null}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.detail}</p>
              {s.meta ? (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {Object.entries(s.meta).map(([k, v]) => (
                    <span key={k} className="num text-[0.68rem] text-muted-foreground">
                      {k}: <span className="text-foreground">{String(v ?? "—")}</span>
                    </span>
                  ))}
                </div>
              ) : null}
              {s.txHash ? (
                <a
                  href={txUrl(s.txHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="num mt-2 inline-block text-[0.68rem] text-accent underline underline-offset-2"
                >
                  {s.txHash.slice(0, 18)}… on Arcscan
                </a>
              ) : s.transferId ? (
                <a
                  href={`https://console.circle.com/wallets/transactions/${s.transferId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="num mt-2 inline-block text-[0.68rem] text-muted-foreground underline underline-offset-2"
                >
                  {s.transferId.slice(0, 18)}… pending on Circle
                </a>
              ) : null}
            </li>
          ))}
        </ol>
        <div className="border-t border-border px-5 py-4">
          <div className="num text-[0.68rem] break-all text-muted-foreground">
            receipt digest (SHA-256) {result.receiptHash}
          </div>
          {result.seal ? (
            <div className="num mt-1 text-[0.68rem] break-all text-muted-foreground">
              sealed with {result.seal.scheme} · signature {result.seal.signatureFingerprint} ·{" "}
              {result.seal.verified ? "verified" : "NOT verified"}
            </div>
          ) : null}
          <Link
            to="/ledger"
            className="mt-2 inline-block text-xs text-accent underline underline-offset-2"
          >
            Recent settlements →
          </Link>
        </div>
      </div>
    </section>
  );
}
