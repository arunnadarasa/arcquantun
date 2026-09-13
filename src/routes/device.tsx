import { createFileRoute, Link } from "@tanstack/react-router";
import { Usb, KeyRound, ShieldCheck, TerminalSquare } from "lucide-react";
import { Shell, Pill } from "@/components/shell";
import { Reveal } from "@/components/motion";
import { useDeviceBridge } from "@/components/device-gate";
import { DEVICE_BRIDGE_URL, DEVICE_APPROVAL_CONTEXT } from "@/lib/device";

export const Route = createFileRoute("/device")({
  head: () => ({
    meta: [
      { title: "Device confirmation — Ledger on the Clinical Quantum Exchange" },
      {
        name: "description",
        content:
          "The enrolled Ledger signs the exact release parameters before any USDC moves: a hardware tap between agent autonomy and the budget, verified server-side.",
      },
      { property: "og:title", content: "Device confirmation — Ledger" },
      {
        property: "og:description",
        content:
          "No tap, no settlement: the Ledger Key Ring holds the secrets, the device signs the release, and the approval is hashed into the sealed receipt.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DevicePage,
});

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 border-b border-border py-2 last:border-0">
      <span className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">{k}</span>
      <span className="num ml-auto text-xs break-all text-foreground">{v}</span>
    </div>
  );
}

const RING_COMMANDS: [string, string][] = [
  ["provision (once, device present)", "wallet-cli ring init"],
  ["seal a secret under a named key", "wallet-cli ring encrypt -i secrets.txt -o secrets.enc --key cqx"],
  ["open it — no device, no vault", "wallet-cli ring decrypt -i secrets.enc -o - --key cqx"],
  ["list this machine's keys", "wallet-cli ring keys"],
];

function DevicePage() {
  const { status, bridge } = useDeviceBridge();
  const online = bridge.data?.connected === true;

  return (
    <Shell>
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <Pill tone="signal">
            <Usb className="size-3" /> Ledger Agent Stack · Key Ring · device confirmation
          </Pill>
          <h1 className="mt-5 max-w-3xl text-3xl leading-tight font-semibold md:text-4xl">
            The tap between autonomy and the budget
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            The agents run autonomously up to the last irreversible step. Before a USDC budget is
            released, the enrolled Ledger signs the exact release parameters — pathway, budget,
            chain, quantum leg — after they are shown on its screen. The signature is recovered on
            the server against the enrolled signer and hashed into the sealed receipt. No tap, no
            settlement.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-lg font-semibold">Bridge status</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          The app runs in an edge runtime with no USB, so the device is driven by a local bridge on
          your machine and the browser reaches it over loopback. The bridge holds no keys and
          keeps no state; every request needs the device present.
        </p>
        <div className="glass-card mt-5 rounded-lg p-5">
          <Row
            k="bridge"
            v={online ? `online — ${DEVICE_BRIDGE_URL}` : `offline — start scripts/ledger`}
          />
          <Row k="device" v={bridge.data ? `${bridge.data.app} app at ${bridge.data.path}` : "—"} />
          <Row
            k="signer"
            v={
              bridge.data
                ? `${bridge.data.address.slice(0, 10)}…${bridge.data.address.slice(-6)}`
                : "—"
            }
          />
          <Row k="enrolled on this deployment" v={status?.enrolled ? "yes — gate mandatory" : "no — gate open"} />
          <Row k="approval context" v={DEVICE_APPROVAL_CONTEXT} />
        </div>
        {bridge.error ? (
          <p className="mt-3 text-xs text-fail">
            Bridge unreachable: {String(bridge.error)}. Run{" "}
            <span className="num">cd scripts/ledger && npm install && npm start</span>{" "}
            with the device unlocked and the Ethereum app open.
          </p>
        ) : null}
        {!status?.enrolled ? (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            To make the gate mandatory, enrol the signer: read the address above and save it as
            the <span className="num">LEDGER_SIGNER_ADDRESS</span> secret in Project Settings →
            Secrets. From then on, a run without the device's signature settles 0.00 USDC and says
            so.
          </p>
        ) : null}
      </section>

      <section className="border-t border-border bg-surface-2/30">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <KeyRound className="size-4" aria-hidden /> Key Ring — secrets the agent cannot leak
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The exchange's private credentials — the Circle entity secret, the Nexus token — do not
            sit in a hosted vault for the agent to read. They are sealed under keys derived from
            the Ledger seed with the Ledger Key Ring: one device tap to provision, then decryption
            needs no device at all. The agent requests a scoped, short-lived capability per
            pathway run; it never handles the underlying key.
          </p>
          <div className="glass-card mt-5 rounded-lg p-5">
            {RING_COMMANDS.map(([label, cmd]) => (
              <Row key={cmd} k={label} v={cmd} />
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            The ring password comes from your OS keychain at call time —{" "}
            <span className="num">WALLET_PASS</span> is injected, never typed. The bridge refuses
            to run ring commands with a literal password on the command line.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ShieldCheck className="size-4" aria-hidden /> Before and after
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Reveal className="h-full">
            <div className="glass-card h-full rounded-lg p-5">
              <Pill tone="gap">before Ledger</Pill>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Authority was software all the way down: a World proof said which human authorised
                the release, but the release parameters themselves — how much, to whom, on which
                chain — were assembled in code. The Circle entity secret and the Nexus token lived
                in a secret store any deployment could read.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120} className="h-full">
            <div className="glass-card h-full rounded-lg p-5">
              <Pill tone="signal">after Ledger</Pill>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                The device sits between the agent's decision and the money. The release parameters
                are shown on a screen the agent does not control, signed by a key that never
                leaves secure hardware, and the approval is hashed into the receipt digest that is
                sealed with SLH-DSA and anchored on Arc. Secrets are sealed under the seed, so a
                leaked repo yields no keys.
              </p>
            </div>
          </Reveal>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Try it: open the{" "}
          <Link to="/" className="text-accent underline underline-offset-2">
            pathway board
          </Link>
          , approve a release on the device, then run the job — the run ledger shows the device
          step between human authority and the classical floor.
        </p>
      </section>

      <section className="border-t border-border bg-surface-2/30">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <TerminalSquare className="size-4" aria-hidden /> How the check works
          </h2>
          <ol className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>
              <span className="num text-foreground">1.</span> The browser builds the canonical
              release payload and sends it to the bridge over loopback.
            </li>
            <li>
              <span className="num text-foreground">2.</span> The bridge shows the address on the
              device, then asks the Ethereum app to personal-sign the payload — you review it on
              the device screen.
            </li>
            <li>
              <span className="num text-foreground">3.</span> The server rebuilds the same payload
              from committed data, recovers the signer with ECDSA verification, compares it to the
              enrolled address, and rejects anything expired or re-pointed at another pathway.
            </li>
            <li>
              <span className="num text-foreground">4.</span> The approval travels into the
              receipt payload, so the SHA-256 digest that is SLH-DSA-sealed and anchored on Arc
              commits to the tap as well.
            </li>
          </ol>
        </div>
      </section>
    </Shell>
  );
}
