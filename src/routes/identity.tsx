import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Shell, Pill } from "@/components/shell";
import { Reveal } from "@/components/motion";
import { getIdentityStatus, resolveName } from "@/lib/ens.functions";
import {
  ensNamespace,
  ensAppUrl,
  identityTone,
  actorPointer,
  agentRegistrationKey,
} from "@/lib/ens-namespace";
import { shortAddress, addressUrl } from "@/lib/arc-chain";

export const Route = createFileRoute("/identity")({
  head: () => ({
    meta: [
      { title: "Agent identity — ENS names for the Arc settlement lane" },
      {
        name: "description",
        content:
          "Every agent paid on Arc Testnet is named on ENSv2 Sepolia, bound to its Arc actor address by an ENSIP-25 attestation, and limited to the intents its record permits.",
      },
      { property: "og:title", content: "Agent identity — ENS names for the Arc settlement lane" },
      {
        property: "og:description",
        content:
          "A name that does not resolve to the address on the receipt is not paid. Resolve the namespace live on Sepolia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IdentityPage,
});

function IdentityPage() {
  const { data } = useQuery({
    queryKey: ["identity-status"],
    queryFn: () => getIdentityStatus(),
  });
  const [name, setName] = useState("vitalik.eth");
  const lookup = useMutation({
    mutationFn: (n: string) => resolveName({ data: { name: n } }),
  });

  const registry = ensNamespace.attestationRegistry.address;

  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <Pill tone="signal">ens · ensip-25 · sepolia</Pill>
        <h1 className="mt-3 text-2xl font-semibold md:text-3xl">Who is being paid</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          The money rail was already verifiable. The payee was not. A reader of{" "}
          <span className="num">0x5904…9d4f</span> learns nothing about who earned it, nothing stops
          a swapped address, and retiring a misbehaving agent meant a code change. Every agent in
          this exchange now carries a name under{" "}
          <span className="num text-foreground">{ensNamespace.parent}</span>, an ENSIP-25
          attestation binding that name to its Arc actor address, and a record listing the intents
          it is permitted to perform.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Identity is a gate, not a label. It sits between the policy cap and the cohort-fitness
          check: a name that does not resolve to the exact address the run is about to pay, or that
          does not list this leg&rsquo;s intent, blocks the settlement. Revocation is a text-record
          edit, not a redeploy.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            { k: "Parent name", v: ensNamespace.parent },
            { k: "Network", v: `Sepolia · chain ${ensNamespace.chainId}` },
            { k: "Attested to", v: ensNamespace.attestationRegistry.caip2 },
            {
              k: "Namespace state",
              v: ensNamespace.registered
                ? "registered on the ENSv2 beta registrar"
                : "committed, not yet registered",
            },
          ].map((c) => (
            <Reveal key={c.k} className="glass-card rounded-lg p-4">
              <div className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                {c.k}
              </div>
              <div className="num mt-1.5 text-sm text-foreground">{c.v}</div>
            </Reveal>
          ))}
        </div>

        <Reveal className="glass-card mt-4 rounded-lg p-5">
          <h2 className="text-base font-semibold">The live wiring on Sepolia</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            The name is registered on the permissionless ENSv2 beta registrar and its registry entry
            points at a resolver this project owns. The beta&rsquo;s shared permissioned resolver is
            role-gated per resource and a freshly registered name holds no write role on it, so
            records are served from{" "}
            <span className="num text-foreground">AgentResolver.sol</span> instead — an ENSIP-10
            wildcard resolver read through the Universal Resolver V2, exactly as any ENS client
            would.
          </p>
          <dl className="mt-3 space-y-2 text-xs">
            {[
              ["ENSv2 registry", ensNamespace.contracts.registry],
              ["ETHRegistrar", ensNamespace.contracts.ethRegistrar],
              ["Universal Resolver V2", ensNamespace.contracts.universalResolver],
              ["AgentResolver", ensNamespace.contracts.agentResolver],
              ["records tx", (ensNamespace as { recordsTx?: string }).recordsTx],
            ].map(([k, v]) =>
              v ? (
                <Row key={k} label={String(k)}>
                  <a
                    className="num text-primary hover:underline"
                    href={sepoliaUrl(String(v))}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {String(v)}
                  </a>
                </Row>
              ) : null,
            )}
          </dl>
        </Reveal>

        <h2 className="mt-12 text-lg font-semibold">The namespace</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {ensNamespace.agents.map((a) => {
            const check = data?.checks.find((c) => c.agentId === a.id);
            const tone = check ? identityTone(check.state) : "muted";
            return (
              <Reveal key={a.id} className="glass-card rounded-lg p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="num text-sm text-foreground">{a.name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{a.label}</div>
                  </div>
                  <Pill tone={tone}>{check ? check.state : "checking"}</Pill>
                </div>

                <dl className="mt-4 space-y-2 text-xs">
                  <Row label="arc:actor">
                    {check?.payeeArcAddress ? (
                      <a
                        className="num text-primary hover:underline"
                        href={addressUrl(check.payeeArcAddress)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {actorPointer(shortAddress(check.payeeArcAddress))}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">
                        no Arc payout address configured yet
                      </span>
                    )}
                  </Row>
                  <Row label="agent:intents">
                    <span className="num text-foreground">{a.intents.join(", ")}</span>
                  </Row>
                  <Row label="ENSIP-25">
                    <span className="num break-all text-muted-foreground">
                      {agentRegistrationKey(shortAddress(registry), a.agentId)}
                    </span>
                  </Row>
                  <Row label="source">
                    <span className="text-muted-foreground">
                      {check?.source === "onchain"
                        ? "read live from Sepolia"
                        : "committed namespace entry — not yet read from Sepolia"}
                    </span>
                  </Row>
                </dl>

                {check ? (
                  <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
                    {check.reason}
                  </p>
                ) : null}

                <a
                  className="mt-3 inline-block text-xs text-primary hover:underline"
                  href={ensAppUrl(a.name)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open on the ENS app →
                </a>
              </Reveal>
            );
          })}
        </div>

        <h2 className="mt-12 text-lg font-semibold">Resolve any name</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          This box performs a real read through the Universal Resolver V2 on Sepolia, which covers
          v1 names, ENSv2 names, offchain CCIP-Read names and L2 subnames alike. Point it anywhere;
          nothing here is a fixture.
        </p>
        <form
          className="mt-4 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            lookup.mutate(name);
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="num min-w-0 flex-1 rounded border border-border bg-background/60 px-3 py-2 text-sm"
            aria-label="ENS name to resolve"
            placeholder="name.eth"
          />
          <button
            type="submit"
            disabled={lookup.isPending}
            className="rounded bg-primary px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-primary-foreground disabled:opacity-50"
          >
            {lookup.isPending ? "Resolving…" : "Resolve"}
          </button>
        </form>
        {lookup.data ? (
          <div className="glass-card mt-4 rounded-lg p-5 text-xs">
            {lookup.data.error ? (
              <p className="text-muted-foreground">{lookup.data.error}</p>
            ) : (
              <dl className="space-y-2">
                <Row label="name">
                  <span className="num text-foreground">{lookup.data.name}</span>
                </Row>
                <Row label="addr">
                  <span className="num text-foreground">
                    {lookup.data.address ?? "no address record"}
                  </span>
                </Row>
                <Row label="arc:actor">
                  <span className="num text-foreground">{lookup.data.arcActor ?? "—"}</span>
                </Row>
                <Row label="agent:intents">
                  <span className="num text-foreground">{lookup.data.intents ?? "—"}</span>
                </Row>
              </dl>
            )}
          </div>
        ) : null}

        <h2 className="mt-12 text-lg font-semibold">What this does not claim</h2>
        <ul className="mt-3 max-w-3xl space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            ENS names live on Sepolia; settlement happens on Arc Testnet. The link between them is
            an attested cross-chain pointer, not a bridge. No message passing between the two chains
            is claimed.
          </li>
          <li>
            An attestation proves a binding was asserted by the name&rsquo;s controller. It does not
            prove the agent behaved well — that is what the receipt grade is for.
          </li>
          <li>
            ENS records are signed with classical ECDSA. Only the receipt digest carries a
            post-quantum seal, and that remaining leg stays logged as an open hazard.
          </li>
        </ul>
      </section>
    </Shell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <dt className="w-28 shrink-0 text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 break-all">{children}</dd>
    </div>
  );
}
