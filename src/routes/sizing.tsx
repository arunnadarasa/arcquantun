import { createFileRoute } from "@tanstack/react-router";
import { Shell, Pill } from "@/components/shell";
import { Reveal } from "@/components/motion";
import cost from "@/data/nexus-cost.json";

export const Route = createFileRoute("/sizing")({
  head: () => ({
    meta: [
      { title: "Job sizing — Clinical Quantum Exchange" },
      {
        name: "description",
        content:
          "The Quantinuum credit formula, the operating envelope we refuse runs against, and every candidate circuit costed before one was chosen.",
      },
      { property: "og:title", content: "Job sizing — Clinical Quantum Exchange" },
      {
        property: "og:description",
        content:
          "Gate counts, credit estimates and ideal scores for three feature maps, so the circuit choice is evidence rather than taste.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SizingPage,
});

const num = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 });

function SizingPage() {
  const chosen = cost.candidates.find((c) => c.key === cost.chosen);
  const saving = cost.prior.batchHqc - (chosen?.batchHqc ?? 0);

  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <Pill tone="signal">sizing spec</Pill>
        <h1 className="mt-3 text-2xl font-semibold md:text-3xl">What a job costs, before it runs</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          The first version of this experiment was sized by hand and cost roughly{" "}
          {num(cost.prior.batchHqc)} credits of work. The cost formula now lives in the code: gate
          counts are read off the compiled circuit, the estimate is printed before anything is
          uploaded, and a batch outside the envelope is refused with the number named rather than
          quietly trimmed. {cost.note}
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Reveal className="glass-card rounded-lg p-5">
            <div className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
              Previous sizing
            </div>
            <div className="num mt-2 text-3xl text-fail">{num(cost.prior.batchHqc)}</div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {cost.prior.programs} programs, {cost.prior.nQubits} qubits, {cost.prior.shots} shots.
            </p>
          </Reveal>
          <Reveal delay={120} className="glass-card rounded-lg p-5">
            <div className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
              Current sizing
            </div>
            <div className="num mt-2 text-3xl text-accent">{num(chosen?.batchHqc ?? 0)}</div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {cost.sizing.programs} programs, {cost.sizing.nQubits} qubits, {cost.sizing.shots}{" "}
              shots.
            </p>
          </Reveal>
          <Reveal delay={240} className="glass-card rounded-lg p-5">
            <div className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
              Credits not spent
            </div>
            <div className="num mt-2 text-3xl text-foreground">{num(saving)}</div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Same question, same cohort, same verdict discipline.
            </p>
          </Reveal>
        </div>

        <Reveal className="glass-card mt-10 rounded-lg p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">The formula</h2>
          <pre className="num mt-3 overflow-x-auto rounded-md bg-muted/40 p-4 text-sm">
            {cost.formula.expression}
          </pre>
          <dl className="mt-4 grid gap-2 text-xs text-muted-foreground md:grid-cols-4">
            {Object.entries(cost.formula.terms).map(([k, v]) => (
              <div key={k}>
                <dt className="num text-foreground">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            {cost.formula.note}
          </p>
        </Reveal>

        <Reveal className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">
            The operating envelope
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left text-xs">
              <thead className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Knob</th>
                  <th className="py-2 pr-4">Limit</th>
                  <th className="py-2">Why</th>
                </tr>
              </thead>
              <tbody>
                {cost.envelope.map((row) => (
                  <tr key={row.knob} className="border-t border-border/60 align-top">
                    <td className="py-3 pr-4 font-medium text-foreground">{row.knob}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{row.limit}</td>
                    <td className="py-3 text-muted-foreground">{row.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            {cost.hardwareNote}
          </p>
        </Reveal>

        <Reveal className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">
            Candidate circuits, costed side by side
          </h2>
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            Three feature maps for the same classification question. Gate counts come from the
            circuit itself; the score column is an ideal noiseless calculation used only to choose
            between designs, never reported as a measured result. Classical floor:{" "}
            {cost.classicalFloor.method} — {cost.classicalFloor.metric} {cost.classicalFloor.value}.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[48rem] border-collapse text-left text-xs">
              <thead className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Design</th>
                  <th className="py-2 pr-4">Qubits</th>
                  <th className="py-2 pr-4">Depth</th>
                  <th className="py-2 pr-4">1-qubit</th>
                  <th className="py-2 pr-4">2-qubit</th>
                  <th className="py-2 pr-4">Credits / program</th>
                  <th className="py-2 pr-4">Batch</th>
                  <th className="py-2">Ideal score</th>
                </tr>
              </thead>
              <tbody>
                {cost.candidates.map((c) => (
                  <tr
                    key={c.key}
                    className={`border-t border-border/60 ${
                      c.key === cost.chosen ? "bg-accent/5 text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <td className="py-3 pr-4 font-medium text-foreground">
                      {c.label}
                      {c.key === cost.chosen ? (
                        <span className="ml-2 rounded bg-accent/15 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-[0.12em] text-accent">
                          chosen
                        </span>
                      ) : null}
                    </td>
                    <td className="num py-3 pr-4">{c.nQubits}</td>
                    <td className="num py-3 pr-4">{c.depth}</td>
                    <td className="num py-3 pr-4">{c.n1q}</td>
                    <td className="num py-3 pr-4">{c.n2q}</td>
                    <td className="num py-3 pr-4">{num(c.perProgramHqc)}</td>
                    <td className="num py-3 pr-4">{num(c.batchHqc)}</td>
                    <td className="num py-3">{c.idealAuroc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            Generated {new Date(cost.generatedAt).toUTCString()} by {cost.engine}. Nothing on this
            page was submitted or billed.
          </p>
        </Reveal>
      </section>
    </Shell>
  );
}
