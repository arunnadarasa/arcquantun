import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Shell, Pill } from "@/components/shell";
import { Reveal } from "@/components/motion";
import { pathways } from "@/data/pathways";
import { getRun, RUN_COMMIT } from "@/data/runs";
import { gradeReceipt } from "@/lib/receipts";
import { sealPathwayReceipt } from "@/lib/exchange.functions";
import type { ReceiptSeal } from "@/data/seal-info";
import { CHAT_IS_NOT_EVIDENCE } from "@/data/operations";

function SealPanel({ pathwayId }: { pathwayId: string }) {
  const seal = useServerFn(sealPathwayReceipt);
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "working" }
    | { status: "done"; digest: string; seal: ReceiptSeal }
    | { status: "error"; message: string }
  >({ status: "idle" });

  return (
    <div className="mt-4 rounded border border-border bg-surface-2/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
          Post-quantum seal
        </div>
        {state.status === "done" ? (
          <Pill tone={state.seal.verified ? "pass" : "fail"}>
            {state.seal.verified ? "signature verified" : "verification failed"}
          </Pill>
        ) : null}
      </div>
      {state.status === "done" ? (
        <div className="num mt-2 grid gap-1 text-[0.68rem] text-muted-foreground sm:grid-cols-2">
          <span className="sm:col-span-2 break-all">
            digest: <span className="text-foreground">{state.digest}</span>
          </span>
          <span>
            scheme: <span className="text-foreground">{state.seal.scheme}</span>
          </span>
          <span>
            standard: <span className="text-foreground">{state.seal.standard}</span>
          </span>
          <span>
            public key: <span className="text-foreground">{state.seal.publicKeyFingerprint}</span>
          </span>
          <span>
            signature: <span className="text-foreground">{state.seal.signatureFingerprint}</span>
          </span>
          <span>
            signature bytes:{" "}
            <span className="text-foreground">{state.seal.signatureBytes}</span>
          </span>
          <span>
            key source: <span className="text-foreground">{state.seal.keySource}</span>
          </span>
        </div>
      ) : (
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Sign this receipt digest with SLH-DSA and verify it on the spot. The signature is a few
          seconds of work, so it runs on request here and automatically on every live job.
        </p>
      )}
      {state.status === "error" ? (
        <p className="mt-1.5 text-xs text-fail">{state.message}</p>
      ) : null}
      <button
        onClick={async () => {
          setState({ status: "working" });
          try {
            const res = await seal({ data: { pathwayId } });
            setState({ status: "done", digest: res.digest, seal: res.seal });
          } catch (e) {
            setState({
              status: "error",
              message: e instanceof Error ? e.message : "Sealing failed",
            });
          }
        }}
        disabled={state.status === "working"}
        className="mt-2 rounded border border-border px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.12em] text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
      >
        {state.status === "working"
          ? "Signing…"
          : state.status === "done"
            ? "Sign again"
            : "Seal and verify"}
      </button>
    </div>
  );
}

export const Route = createFileRoute("/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence & Receipts — Clinical Quantum Exchange" },
      {
        name: "description",
        content:
          "Every run receipt with engine, backend qualifier, shots, seed and two separate verdicts: did the mechanism work, and did it beat the classical floor.",
      },
      { property: "og:title", content: "Evidence & Receipts — Clinical Quantum Exchange" },
      {
        property: "og:description",
        content:
          "Committed Quantinuum Nexus receipts, negatives published at full size, blocked legs named with their limit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EvidencePage,
});

function EvidencePage() {
  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h1 className="text-2xl font-semibold md:text-3xl">Evidence and receipts</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Two verdicts, never one. <strong className="text-foreground">Mechanism</strong> asks
          whether the circuit did what it was meant to, inside 4·√(0.5/shots).{" "}
          <strong className="text-foreground">Performance</strong> asks whether it beat the
          classical floor. The second never inherits the first&rsquo;s pass. Every run here lost or
          tied against ordinary maths, and that is published at full size.
        </p>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          Runs were executed offline against Quantinuum Nexus and committed at source revision{" "}
          <span className="num text-foreground">{RUN_COMMIT}</span>. Emulator is labelled emulator.
          Nothing on this page ran on a QPU.
        </p>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          Each receipt digest is signed with SLH-DSA, a NIST-standardised post-quantum signature
          scheme that Arc supports, and verified before anything is anchored or paid. The Arc
          transaction carrying the anchor is still ECDSA-signed —{" "}
          <Link to="/quantum-gap" className="text-accent underline underline-offset-2">
            why that gap matters
          </Link>
          .
        </p>

        <Reveal>
          <article className="mt-8 glass-card rounded-lg p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold">Chat is not the evidence layer</h2>
              <Pill tone="gap">operating rule</Pill>
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              {CHAT_IS_NOT_EVIDENCE.map((c) => (
                <li key={c}>— {c}</li>
              ))}
            </ul>
          </article>
        </Reveal>

        <Reveal>
          <article className="mt-6 glass-card rounded-lg p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold">Noisy-tier bands, committed first</h2>
              <Pill tone="signal">grading rule</Pill>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              A noiseless simulation says whether the construction is sound. A noisy emulator says
              whether it survives. The bands below are fixed before the run, so a result cannot be
              re-banded after the fact, and a run that lands outside its band is published rather
              than repeated.
            </p>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              {NOISE_BANDS.map((b) => (
                <li key={b.band} className="flex flex-wrap items-center gap-2">
                  <Pill
                    tone={
                      b.band === "sI-PASS" ? "pass" : b.band === "sIII-FAIL" ? "fail" : "gap"
                    }
                  >
                    {b.band}
                  </Pill>
                  <span>{b.meaning}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {REFERENCE_RUNS.map((ref) => (
                <div key={ref.id} className="rounded border border-border bg-surface-2/40 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={ref.band === "sI-PASS" ? "pass" : "fail"}>{ref.band}</Pill>
                    <span className="num text-[0.65rem] text-muted-foreground">{ref.tier}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold">{ref.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {ref.construction}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {ref.measurement}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed">{ref.reading}</p>
                  <div className="num mt-2 break-all text-[0.65rem] text-muted-foreground">
                    job id: <span className="text-foreground">{ref.jobId}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </Reveal>

        <div className="mt-10 space-y-6">
          {pathways.map((p) => {
            const run = getRun(p.id);
            if (!run) return null;
            const r = run.receipt;
            const { grade, reasons } = gradeReceipt(r);
            
            return (
              <Reveal key={p.id}>
              <article id={p.id} className="scroll-mt-20 glass-card rounded-lg p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold">{p.service}</h2>
                  <Pill tone={grade === "PASS" ? "pass" : grade === "FAIL" ? "fail" : "gap"}>
                    receipt {grade}
                  </Pill>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{p.question}</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded border border-border bg-surface-2/40 p-3">
                    <div className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                      Mechanism
                    </div>
                    <div
                      className={`num mt-1 text-lg ${
                        r.mechanism === "PASS"
                          ? "text-pass"
                          : r.mechanism === "FAIL"
                            ? "text-fail"
                            : "text-gap"
                      }`}
                    >
                      {r.mechanism}
                    </div>
                    <div className="num mt-1 text-[0.68rem] text-muted-foreground">
                      {r.measured !== null && r.envelope !== null
                        ? `measured ${r.measured.toFixed(4)} vs envelope ${r.envelope.toFixed(4)}`
                        : "no measurement exists"}
                    </div>
                  </div>
                  <div className="rounded border border-border bg-surface-2/40 p-3">
                    <div className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                      Performance vs classical floor
                    </div>
                    <div
                      className={`num mt-1 text-lg ${
                        r.performance === "WIN" ? "text-pass" : "text-fail"
                      }`}
                    >
                      {r.performance}
                    </div>
                    <div className="num mt-1 text-[0.68rem] text-muted-foreground">
                      floor {run.classical.value}
                      {p.classicalFloor.unit === "%" ? "%" : ` ${p.classicalFloor.unit}`}{" "}
                      {run.classical.metric} · {run.classical.method}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                    Claims
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {r.claims.map((c) => (
                      <li key={c} className="text-xs leading-relaxed text-muted-foreground">
                        — {c}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 grid gap-x-6 gap-y-1.5 text-[0.68rem] sm:grid-cols-3">
                  {[
                    ["engine", r.engine],
                    ["backend qualifier", r.backendQualifier],
                    ["shots", r.shots],
                    ["seed", r.seed],
                    ["device", r.device],
                    ["job id", r.jobId],
                    ["bell control", r.bellAnticorrelated],
                    ["billed HQC", r.billedHqc],
                    ["commit", r.commit],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="num text-muted-foreground">
                      {k}: <span className="text-foreground">{String(v ?? "—")}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded border border-border bg-surface-2/40 p-3">
                  <div className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                    Dequantization gate
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed">{run.dequantization.note}</p>
                </div>

                <details className="group mt-4">
                  <summary className="cursor-pointer text-xs text-accent underline underline-offset-2">
                    Execution spec ({run.spec.builder} · {run.spec.device})
                  </summary>
                  <div className="mt-2 rounded border border-border bg-surface-2/40 p-3 text-[0.68rem]">
                    <p className="text-muted-foreground">{run.spec.note}</p>
                    <div className="num mt-2 grid gap-1 sm:grid-cols-2">
                      <span>builder: {run.spec.builder}</span>
                      <span>config class: {run.spec.configClass}</span>
                      <span>device: {run.spec.device}</span>
                      <span>qubits: {run.spec.nQubits}</span>
                      <span>shots: {run.spec.shots}</span>
                      <span>seed: {run.spec.seed}</span>
                    </div>
                    <p className="mt-2 text-muted-foreground">
                      verification: {run.spec.verification}
                    </p>
                  </div>
                </details>

                <SealPanel pathwayId={p.id} />

                <div className="mt-4 border-t border-border pt-3">
                  <div className="text-[0.68rem] text-muted-foreground">
                    grade reason: {reasons.join(" ")}
                  </div>
                </div>
              </article>
              </Reveal>
            );
          })}
        </div>
      </section>
    </Shell>
  );
}
