import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shell, Pill } from "@/components/shell";
import { Reveal } from "@/components/motion";
import { agents } from "@/data/agents";
import { formatUsdc, ARC_FAUCET } from "@/lib/arc-chain";
import { getExchangeStatus } from "@/lib/exchange.functions";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Agents & Wallets — Clinical Quantum Exchange" },
      {
        name: "description",
        content:
          "Four agents with Circle developer-controlled wallets on Arc Testnet, each with a per-job ceiling and a 24-hour cap checked before any USDC moves.",
      },
      { property: "og:title", content: "Agents & Wallets — Clinical Quantum Exchange" },
      {
        property: "og:description",
        content:
          "Trust, Baseline, Nexus and Registry agents: decision logic, spend caps and Arc Testnet wallets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgentsPage,
});

function AgentsPage() {
  const statusFn = useServerFn(getExchangeStatus);
  const { data } = useQuery({ queryKey: ["exchange-status"], queryFn: () => statusFn({}) });

  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h1 className="text-2xl font-semibold md:text-3xl">Agents and wallets</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Each agent holds its own Circle developer-controlled wallet on Arc Testnet. USDC is the
          gas token, so no separate gas asset and no funded private key is needed. Every ticket
          passes the policy gate before any transfer is submitted.
        </p>

        <div className="mt-6 glass-card rounded p-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <Pill tone={data?.circleReady ? "pass" : "gap"}>
              {data?.circleReady ? "Circle keys present" : "demo mode"}
            </Pill>
            <Pill tone={data?.contractDeployed ? "pass" : "gap"}>
              {data?.contractDeployed ? "anchor contract live" : "anchor contract not deployed"}
            </Pill>
            <span className="num text-muted-foreground">chain {data?.chainId ?? 5042002}</span>
          </div>
          {!data?.circleReady ? (
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Running without keys. Every payment returns a realistic simulated envelope and is
              labelled as such — no silent pretending. Add the Circle keys and top the treasury up
              at{" "}
              <a
                href={ARC_FAUCET}
                target="_blank"
                rel="noreferrer"
                className="text-accent underline underline-offset-2"
              >
                the Circle faucet
              </a>{" "}
              to settle for real.
            </p>
          ) : null}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {agents.map((a, i) => (
            <Reveal key={a.id} delay={(i % 2) * 80} className="h-full">
            <article className="glass-card h-full rounded-lg p-5">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">{a.name}</h2>
                <Pill tone={a.feeShare === 0 ? "signal" : "muted"}>
                  {a.feeShare === 0 ? "payer" : `${Math.round(a.feeShare * 100)}% of budget`}
                </Pill>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{a.role}</p>
              <div className="mt-4 rounded border border-border bg-surface-2/40 p-3">
                <div className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                  Decision logic
                </div>
                <p className="mt-1.5 text-xs leading-relaxed">{a.decisionLogic}</p>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Per-job ceiling</dt>
                  <dd className="num mt-1">{formatUsdc(a.maxTicketMinor)} USDC</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">24-hour cap</dt>
                  <dd className="num mt-1">{formatUsdc(a.dailyCapMinor)} USDC</dd>
                </div>
              </dl>
            </article>
            </Reveal>
          ))}
        </div>
      </section>
    </Shell>
  );
}
