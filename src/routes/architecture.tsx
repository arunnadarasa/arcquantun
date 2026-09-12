import { createFileRoute } from "@tanstack/react-router";
import { Shell, Pill } from "@/components/shell";
import { Reveal } from "@/components/motion";
import { ARC_CHAIN_ID, ARC_RPC_URL, ARC_EXPLORER, ARC_USDC_ADDRESS } from "@/lib/arc-chain";
import { OPERATING_LESSONS } from "@/data/operations";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: "Architecture — Clinical Quantum Exchange" },
      {
        name: "description",
        content:
          "How the exchange is wired: Circle developer-controlled wallets, a ReceiptAnchor contract on Arc Testnet, USDC settlement gated on a graded receipt.",
      },
      { property: "og:title", content: "Architecture — Clinical Quantum Exchange" },
      {
        property: "og:description",
        content:
          "Agent stack, policy gate, receipt anchoring and settlement order — plus the limits we do not claim past.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ArchitecturePage,
});

const DIAGRAM = `Trust Agent (budget holder)
   |  posts pathway job + USDC budget
   v
Policy gate  -- per-job ceiling + 24h cap, checked before any transfer
   |
   v
Baseline Agent  -> classical FAMILY recorded FIRST (plain, balanced,
   |                resampled, tuned) -- the bar is the best POWERED
   |                member, never the weakest
   v
Cohort fitness gate -> does a large classical oracle clear the bar at all?
   |                   if not, the signal is weak, not the data scarce:
   |                   unfit-cohort, nothing is spent
   v
Dequantization gate -> can a classical surrogate reproduce it?
   |
   v
Nexus Agent -> emulator run (or assessed-blocked with the limit named)
   |
   v
Receipt grading -> PASS / GAP / STRUCTURAL / FAIL
   |
   v
Registry Agent -> anchor receipt hash on Arc (ReceiptAnchor.sol)
   |
   v
Settlement -> USDC to each agent, only against a PASS receipt

   [ control channel — chat / schedule ] --- sits BESIDE this path,
                                             never inside it: it can
                                             start a job and read a
                                             receipt back, and nothing
                                             it says becomes evidence`;

function ArchitecturePage() {
  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h1 className="text-2xl font-semibold md:text-3xl">Architecture</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The order of the stages is the product. A classical floor computed after a quantum result
          is a rationalisation, and a success criterion written after the result is the same
          mistake one stage later.
        </p>

        <Reveal>
          <pre className="mt-8 overflow-x-auto glass-card rounded-lg p-5 text-[0.7rem] leading-relaxed text-muted-foreground">
            {DIAGRAM}
          </pre>
        </Reveal>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Reveal className="h-full">
          <article className="glass-card h-full rounded-lg p-5">
            <h2 className="text-base font-semibold">Payment rail</h2>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li>— Circle developer-controlled wallets, one per agent.</li>
              <li>— USDC is the native gas token on Arc, so there is no second asset to fund.</li>
              <li>— The entity secret is re-encrypted on every request; nothing is cached.</li>
              <li>— The anchor contract is deployed from a Circle wallet, with no funded EOA.</li>
            </ul>
            <dl className="mt-4 grid gap-1.5 text-[0.68rem]">
              {[
                ["chain id", String(ARC_CHAIN_ID)],
                ["rpc", ARC_RPC_URL],
                ["explorer", ARC_EXPLORER],
                ["usdc", ARC_USDC_ADDRESS],
              ].map(([k, v]) => (
                <div key={k} className="num break-all text-muted-foreground">
                  {k}: <span className="text-foreground">{v}</span>
                </div>
              ))}
            </dl>
          </article>
          </Reveal>

          <Reveal className="h-full" delay={80}>
          <article className="glass-card h-full rounded-lg p-5">
            <h2 className="text-base font-semibold">Evidence rail</h2>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li>
                — Every receipt carries engine, backend qualifier, shots, seed, commit and the
                computed 4·√(0.5/shots) envelope.
              </li>
              <li>— A device name that shares a prefix with a QPU is not a QPU, and is labelled.</li>
              <li>
                — A run stopped by a hardware limit is assessed-blocked with the limit named, never
                a silent gap.
              </li>
              <li>— The receipt hash is anchored on-chain, so the record behind a payment is fixed.</li>
            </ul>
          </article>
          </Reveal>
        </div>

        <Reveal>
          <section className="mt-10">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">How the agents are actually operated</h2>
              <Pill tone="signal">operating model</Pill>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              The diagram is the pipeline. This is the discipline that kept it honest while it was
              being built — a scheduled agent with a searchable memory, driven from a phone, with
              the chat channel deliberately kept outside the evidence path.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {OPERATING_LESSONS.map((l) => (
                <article key={l.title} className="glass-card h-full rounded-lg p-5">
                  <h3 className="text-sm font-semibold">{l.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{l.body}</p>
                </article>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal>
        <article className="mt-6 glass-card rounded-lg p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">What this is not</h2>
            <Pill tone="gap">limits</Pill>
          </div>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
            <li>
              — No quantum advantage is claimed. On these pathways ordinary maths won, and that is
              the published result.
            </li>
            <li>
              — Waiting-list work is about capacity, cost and patient experience. No diagnosis, no
              efficacy and no patient-outcome claim is made anywhere in this build.
            </li>
            <li>
              — Receipt hashes are signed with classical signatures, so the provenance chain is not
              quantum-safe end to end. That stays an open item rather than a solved one.
            </li>
            <li>— Cohorts are synthetic. No patient data has ever entered this system.</li>
            <li>— Arc Testnet only, with test USDC.</li>
          </ul>
        </article>
        </Reveal>
      </section>
    </Shell>
  );
}
