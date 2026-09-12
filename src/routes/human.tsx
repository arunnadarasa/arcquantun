import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Fingerprint } from "lucide-react";
import { Shell, Pill } from "@/components/shell";
import { Reveal } from "@/components/motion";
import { WORLDID_CONFIG } from "@/config/worldid";
import { IDENTITY_LAYERS, NEVER_COLLECTED } from "@/lib/world";
import { getWorldStatus } from "@/lib/world.functions";
import agentbook from "@/data/agentbook.json";
import ensNamespace from "@/data/ens.json";

export const Route = createFileRoute("/human")({
  head: () => ({
    meta: [
      { title: "Human authority — World ID on the Clinical Quantum Exchange" },
      {
        name: "description",
        content:
          "An agent releases the budget; a real, unique human authorises it. World ID reduces that human to a nullifier hash, hashed into the sealed receipt before any USDC moves.",
      },
      { property: "og:title", content: "Human authority — World ID" },
      {
        property: "og:description",
        content:
          "Three identity layers: Arc proves money moved, ENS proves which agent was paid, World ID proves which unique human authorised it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HumanPage,
});

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 border-b border-border py-2 last:border-0">
      <span className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">{k}</span>
      <span className="num ml-auto text-xs break-all text-foreground">{v}</span>
    </div>
  );
}

function HumanPage() {
  const statusFn = useServerFn(getWorldStatus);
  const { data: status } = useQuery({ queryKey: ["world-status"], queryFn: () => statusFn({}) });

  return (
    <Shell>
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <Pill tone="signal">
            <Fingerprint className="size-3" /> World ID · Selfie Check · AgentBook
          </Pill>
          <h1 className="mt-5 max-w-3xl text-3xl leading-tight font-semibold md:text-4xl">
            Who authorised the spend
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            The money rail proves a payment happened. ENS proves which agent received it. Neither
            answers the question an auditor asks first: on whose authority was public money
            committed to this assessment? An autonomous process spending a budget on nobody&apos;s
            behalf is not an acceptable audit line for NHS-shaped work.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            So a budget release carries a human. World ID reduces that human to one nullifier hash
            — stable for one person on this action, so a second release by the same person is
            visibly the same person, and a bot farm cannot mint a fresh approver per run. The hash
            goes into the receipt, through the SHA-256 digest and the post-quantum seal, and is
            anchored on Arc alongside everything else.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-lg font-semibold">Three layers, three questions</h2>
        <div className="mt-5 overflow-hidden rounded-lg glass-card">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-normal">Layer</th>
                <th className="px-4 py-3 font-normal">Question it answers</th>
                <th className="px-4 py-3 font-normal">Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {IDENTITY_LAYERS.map((l) => (
                <tr key={l.layer}>
                  <td className="px-4 py-3 font-medium text-foreground">{l.layer}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.question}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.proof}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          The gate runs between the ENS identity check and the classical floor, so an unauthorised
          release is stopped before a penny of the budget is committed. An unauthorised run still
          executes and publishes at full size — it simply settles nothing.{" "}
          <Link to="/" className="text-accent underline underline-offset-2">
            Run one on the board
          </Link>{" "}
          and watch the human step.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12">
        <Reveal>
          <div className="glass-card rounded-lg p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-base font-semibold">The credential</h2>
              <Pill tone={status?.live ? "pass" : "gap"}>
                {status?.live ? "live" : "simulated — sandbox pending"}
              </Pill>
            </div>
            <p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">
              {WORLDID_CONFIG.purpose} Selfie Check is deliberately a low-assurance signal: it is
              evidence that a live person is behind the request, not evidence of identity,
              authority, professional registration or clinical competence. Nothing here is a
              clinical, diagnostic or outcome claim.
            </p>
            {status && !status.live ? (
              <p className="mt-3 rounded border border-gap/40 bg-gap/10 p-3 text-[0.7rem] leading-relaxed text-gap">
                {status.reason}
              </p>
            ) : null}
            <div className="mt-4">
              <Row k="app id" v={WORLDID_CONFIG.appId} />
              <Row k="action" v={WORLDID_CONFIG.action} />
              <Row k="credential" v={WORLDID_CONFIG.credential} />
              <Row k="flow" v="World ID v4 · RP-signed request context · server-side verify proxy" />
              <Row k="verify endpoint" v="developer.world.org/api/v4/verify/{rp_id}" />
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12">
        <h2 className="text-lg font-semibold">What is never collected</h2>
        <ul className="mt-4 space-y-2">
          {NEVER_COLLECTED.map((n) => (
            <li
              key={n}
              className="rounded border border-border bg-secondary/30 p-3 text-xs leading-relaxed text-muted-foreground"
            >
              {n}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">The agents in AgentBook</h2>
          <Pill tone={agentbook.registered ? "pass" : "gap"}>
            {agentbook.registered ? "registered" : "registration pending"}
          </Pill>
        </div>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          Each agent carries three bindings: a name under{" "}
          <span className="num text-foreground">{ensNamespace.parent}</span>, an Arc actor address
          it is paid at, and an AgentBook entry declaring it is human-backed. An agent missing from
          AgentBook is shown as missing rather than quietly passing.
        </p>
        {!agentbook.registered ? (
          <p className="mt-3 rounded border border-gap/40 bg-gap/10 p-3 text-[0.7rem] leading-relaxed text-gap">
            {agentbook.pendingReason}
          </p>
        ) : null}
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {agentbook.agents.map((a) => (
            <Reveal key={a.agentId}>
              <article className="glass-card h-full rounded-lg p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="num text-sm text-foreground">{a.handle}</span>
                  <Pill tone={a.entry ? "pass" : "gap"}>{a.entry ? "in AgentBook" : "queued"}</Pill>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {a.description}
                </p>
                <div className="mt-3">
                  <Row k="ens" v={a.ensName} />
                  <Row k="intents" v={a.intents.join(", ")} />
                  <Row k="human-backed" v={String(a.humanBacked)} />
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          Identity on Sepolia, authorisation through World, settlement on Arc Testnet. These are
          separate networks: the bindings are attested pointers between them, not a bridge and not
          message passing. World ID and ENS are both classically signed; only the receipt digest
          carries a post-quantum seal.
        </p>
      </section>
    </Shell>
  );
}
