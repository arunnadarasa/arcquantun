import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell, Pill } from "@/components/shell";
import { Reveal, CountUp, Meter } from "@/components/motion";
import {
  QUANTUM_GAP,
  GAP_REMAINING,
  TRACKER_URL,
  TRACKER_POST_URL,
  TRACKER_READ_ON,
  WHY_IT_MATTERS,
  WHAT_WE_CLAIM,
} from "@/data/quantum-gap";
import { SEAL_SCHEME, SEAL_STANDARD } from "@/data/seal-info";

export const Route = createFileRoute("/quantum-gap")({
  head: () => ({
    meta: [
      { title: "The Quantum Gap — Clinical Quantum Exchange" },
      {
        name: "description",
        content:
          "Why every clinical receipt in this exchange carries a post-quantum SLH-DSA seal, read against the Circle Research Quantum Tracker.",
      },
      { property: "og:title", content: "The Quantum Gap — Clinical Quantum Exchange" },
      {
        property: "og:description",
        content:
          "Logical qubits demonstrated against logical qubits needed to break ECDSA, and what that means for a clinical evidence receipt.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuantumGapPage,
});

function QuantumGapPage() {
  const max = QUANTUM_GAP.ecdsaThreshold;
  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <Pill tone="signal">post-quantum provenance</Pill>
        <h1 className="mt-3 text-2xl font-semibold md:text-3xl">The gap is closing</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Quantum capability is climbing while the cost of attacking the signature scheme that
          secures most blockchain accounts is falling. Both figures below are read from the Circle
          Research Quantum Tracker on {TRACKER_READ_ON}. Circle Research is the source; no
          endorsement by Circle is implied.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Reveal className="glass-card rounded-lg p-5">
            <div className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
              Logical qubits demonstrated
            </div>
            <div className="num mt-2 text-4xl text-accent">
              <CountUp value={QUANTUM_GAP.demonstrated} />
            </div>
            <Meter value={QUANTUM_GAP.demonstrated} max={max} tone="signal" />
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              The most error-corrected logical qubits any lab has publicly demonstrated.
            </p>
          </Reveal>
          <Reveal delay={120} className="glass-card rounded-lg p-5">
            <div className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
              Logical qubits to break ECDSA
            </div>
            <div className="num mt-2 text-4xl text-fail">
              <CountUp value={QUANTUM_GAP.ecdsaThreshold} />
            </div>
            <Meter value={max} max={max} tone="fail" delay={200} />
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              What an attacker needs to forge the signatures securing on-chain accounts.
            </p>
          </Reveal>
          <Reveal delay={240} className="glass-card rounded-lg p-5">
            <div className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
              Gap remaining
            </div>
            <div className="num mt-2 text-4xl text-foreground">
              <CountUp value={GAP_REMAINING} />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Smaller than most people assume, and closing from both directions. Classified
              programmes are not publicly visible, so the true gap may be narrower.
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-[0.68rem]">
              <a
                href={TRACKER_URL}
                target="_blank"
                rel="noreferrer"
                className="text-accent underline underline-offset-2"
              >
                Circle Quantum Tracker
              </a>
              <a
                href={TRACKER_POST_URL}
                target="_blank"
                rel="noreferrer"
                className="text-accent underline underline-offset-2"
              >
                Circle Research write-up
              </a>
            </div>
          </Reveal>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {WHY_IT_MATTERS.map((n, i) => (
            <Reveal key={n.title} delay={i * 100} className="glass-card rounded-lg p-5">
              <h2 className="text-sm font-semibold">{n.title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{n.body}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 glass-card rounded-lg p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">What this exchange does about it</h2>
            <Pill tone="pass">{SEAL_SCHEME}</Pill>
            <Pill tone="muted">{SEAL_STANDARD}</Pill>
          </div>
          <ul className="mt-3 space-y-2">
            {WHAT_WE_CLAIM.map((c) => (
              <li key={c} className="text-xs leading-relaxed text-muted-foreground">
                — {c}
              </li>
            ))}
          </ul>
          <Link
            to="/evidence"
            className="mt-4 inline-block text-xs text-accent underline underline-offset-2"
          >
            See a receipt sealed and verified →
          </Link>
        </Reveal>
      </section>
    </Shell>
  );
}
