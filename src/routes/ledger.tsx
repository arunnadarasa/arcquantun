import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell, Pill } from "@/components/shell";
import { Reveal } from "@/components/motion";
import { formatUsdc, txUrl } from "@/lib/arc-chain";
import { clearLedger, readLedger, type LedgerEntry } from "@/lib/ledger";
import { getPathway } from "@/data/pathways";
import { shortNullifier } from "@/lib/world";

const PAGE = 10;

export const Route = createFileRoute("/ledger")({
  head: () => ({
    meta: [
      { title: "Settlements — Clinical Quantum Exchange" },
      {
        name: "description",
        content:
          "One shared settlement ledger across every agent and every run: amount, receipt grade, anchor hash and Arcscan link.",
      },
      { property: "og:title", content: "Settlements — Clinical Quantum Exchange" },
      {
        property: "og:description",
        content: "Every USDC settlement and every receipt anchor on Arc Testnet, in one list.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LedgerPage,
});

function LedgerPage() {
  const [rows, setRows] = useState<LedgerEntry[]>([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setRows(readLedger());
  }, []);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const slice = rows.slice(page * PAGE, page * PAGE + PAGE);
  const total = rows.reduce((s, r) => s + r.amountMinor, 0);

  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h1 className="text-2xl font-semibold md:text-3xl">Settlements</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Every settlement path — payment and anchoring alike — writes to this one list, so there
          is a single place proving money moved. Amounts are USDC on Arc Testnet.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3 glass-card rounded px-4 py-3 text-xs">
          <span className="num text-primary">{formatUsdc(total)} USDC settled</span>
          <span className="num text-muted-foreground">{rows.length} entries</span>
          {rows.length > 0 ? (
            <button
              onClick={() => {
                clearLedger();
                setRows([]);
                setPage(0);
              }}
              className="ml-auto rounded border border-border px-2.5 py-1 transition-colors hover:bg-secondary"
            >
              Clear
            </button>
          ) : null}
        </div>

        {rows.length === 0 ? (
          <p className="mt-8 rounded border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No settlements yet. Run a pathway job on the exchange and it will appear here.
          </p>
        ) : (
          <>
            <Reveal>
            <ul className="mt-6 divide-y divide-border glass-card rounded-lg">
              {slice.map((r) => (
                <li key={r.id + r.at} className="px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{r.label}</span>
                    <Pill tone={r.grade === "PASS" ? "pass" : "gap"}>{r.grade}</Pill>
                    {r.simulated ? <Pill tone="gap">simulated</Pill> : <Pill tone="pass">on chain</Pill>}
                    <span className="num ml-auto text-xs text-primary">
                      {r.amountMinor ? `${formatUsdc(r.amountMinor)} USDC` : "—"}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {getPathway(r.pathwayId)?.service ?? r.pathwayId} ·{" "}
                    {new Date(r.at).toLocaleString()}
                  </div>
                  {r.ensName ? (
                    <div className="num mt-1 text-[0.68rem] text-muted-foreground">
                      paid to <span className="text-foreground">{r.ensName}</span>
                    </div>
                  ) : null}
                  {r.authorisedBy ? (
                    <div className="num mt-1 text-[0.68rem] text-muted-foreground">
                      authorised by human{" "}
                      <span className="text-foreground">{shortNullifier(r.authorisedBy)}</span>
                    </div>
                  ) : null}
                  {r.txHash ? (
                    <a
                      href={txUrl(r.txHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="num mt-1 inline-block text-[0.68rem] text-accent underline underline-offset-2"
                    >
                      {r.txHash.slice(0, 20)}…
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
            </Reveal>
            {pages > 1 ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {Array.from({ length: pages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`num size-8 rounded border text-xs ${
                      i === page
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            ) : null}
          </>
        )}
      </section>
    </Shell>
  );
}
