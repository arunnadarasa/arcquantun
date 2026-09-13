// The submission deck, twelve slides, one idea each.
//
// Every figure here is read from the app's own committed data — pathways,
// agents, receipts. Nothing is invented for the pitch, and the claim rules that
// govern the app govern the deck: capacity, cost and patient experience only,
// an emulator is never called a QPU, and the blocked lane gets its own slide.
import type { ReactNode } from "react";
import { SlideBullets, SlideCard, SlideCanvas, SlideFrame } from "@/components/slide";
import { agents } from "@/data/agents";
import { pathways } from "@/data/pathways";
import { QUANTUM_GAP, GAP_REMAINING, TRACKER_READ_ON } from "@/data/quantum-gap";
import { SEAL_SCHEME, SEAL_STANDARD } from "@/data/seal-info";
import { OPERATING_LESSONS } from "@/data/operations";
import CONTRACT from "@/data/contract.json";
import ENS from "@/data/ens.json";
import COST from "@/data/nexus-cost.json";

const CHOSEN_BATCH_HQC =
  COST.candidates.find((c) => c.key === COST.chosen)?.batchHqc ?? 0;


export interface Slide {
  id: string;
  /** Shown in the grid view and the tab title. */
  label: string;
  /** What the presenter says. Kept with the slide so the two never drift. */
  notes: string;
  render: (index: number, total: number) => ReactNode;
}

const usd = (minor: number) => `${(minor / 1e6).toFixed(2)} USDC`;

const ORDER = `policy check
   -> agent identity           ENS: is this the right payee, for this intent?
   -> human authority          World ID: one unique human released the budget
   -> device confirmation      Ledger: the release parameters tapped on hardware
   -> classical floor          recorded FIRST, never revised after
   -> dequantization gate      can a classical surrogate reproduce it?
   -> quantum leg              a measurement, or assessed-blocked
   -> receipt grading          PASS / GAP / STRUCTURAL / FAIL
   -> post-quantum seal        SLH-DSA signature, verified on the spot
   -> anchor on Arc            written BEFORE money moves
   -> USDC settlement          only against a PASS receipt`;

export const deck: Slide[] = [
  {
    id: "title",
    label: "Title",
    notes:
      "Clinical Quantum Exchange. Four autonomous agents assess NHS waiting-list questions and pay each other in USDC on Arc — but only against a receipt a stranger can re-check.",
    render: (i, n) => (
      <SlideCanvas>
        <div className="pointer-events-none absolute inset-0 aurora-field opacity-60" />
        <div className="pointer-events-none absolute inset-0 grid-veil opacity-25" />
        <div className="relative flex h-full flex-col justify-center px-[140px]">
          <p className="slide-kicker text-primary">ETHOnline 2026 · Arc · Agentic Economy</p>
          <h1 className="slide-title-lg mt-[34px] max-w-[1500px] text-gradient">
            Clinical Quantum Exchange
          </h1>
          <p className="slide-subtitle mt-[38px] max-w-[1360px] text-muted-foreground">
            Autonomous agents are paid in USDC for clinical assessment work — and only for work
            that survives being read.
          </p>
          <div className="mt-[64px] flex gap-[20px]">
            {["Arc Testnet 5042002", "Circle wallets", "Quantinuum Nexus", "NHS waiting lists"].map(
              (t) => (
                <span
                  key={t}
                  className="slide-badge rounded-full border border-primary/40 bg-primary/10 px-[26px] py-[14px] text-primary"
                >
                  {t}
                </span>
              ),
            )}
          </div>
          <p className="slide-chrome absolute bottom-[70px] left-[140px] text-muted-foreground">
            {i + 1} / {n}
          </p>
        </div>
      </SlideCanvas>
    ),
  },
  {
    id: "problem",
    label: "The problem",
    notes:
      "Waiting-list questions get assessed constantly, by people and increasingly by models. Almost none of that assessment leaves a record you could check afterwards.",
    render: (i, n) => (
      <SlideFrame
        index={i}
        total={n}
        kicker="The problem"
        title="Assessment happens. Evidence of it does not."
      >
        <SlideBullets
          items={[
            "Waiting-list questions are analysed constantly — by analysts, vendors and now models.",
            "What survives is a number in a slide, not the engine, the shot count or the seed.",
            "A result you cannot re-derive is indistinguishable from one that was never run.",
            "So the money follows confidence, not legibility.",
          ]}
        />
      </SlideFrame>
    ),
  },
  {
    id: "idea",
    label: "The idea",
    notes:
      "Make payment conditional on the receipt. Not on the answer being flattering — on the record being checkable.",
    render: (i, n) => (
      <SlideFrame index={i} total={n} kicker="The idea" title="Pay for the receipt, not the answer">
        <div className="grid grid-cols-2 gap-[40px]">
          <SlideCard>
            <p className="slide-kicker text-primary">What the exchange buys</p>
            <p className="slide-body-lg mt-[26px] text-foreground/90">
              An assessment whose engine, shots, seed and commit are all present, so a stranger can
              re-decide the verdict without asking us anything.
            </p>
          </SlideCard>
          <SlideCard>
            <p className="slide-kicker text-primary">What it refuses to buy</p>
            <p className="slide-body-lg mt-[26px] text-foreground/90">
              A number without its envelope. Losing is paid in full; being unreadable pays nothing.
            </p>
          </SlideCard>
        </div>
        <p className="slide-body mt-[46px] max-w-[1500px] text-muted-foreground">
          That is the only incentive in the system, and it points at legibility rather than at
          optimism.
        </p>
      </SlideFrame>
    ),
  },
  {
    id: "order",
    label: "The order",
    notes:
      "Seven steps, enforced in code. A classical floor computed after a quantum result is a rationalisation. An anchor written after payment is not evidence.",
    render: (i, n) => (
      <SlideFrame index={i} total={n} kicker="How a job runs" title="The order is the product">
        <pre className="slide-caption whitespace-pre rounded-2xl border border-border bg-card/70 p-[42px] font-mono leading-[1.75] text-foreground/90">
          {ORDER}
        </pre>
      </SlideFrame>
    ),
  },
  {
    id: "agents",
    label: "The agents",
    notes:
      "Four agents, each with its own Circle wallet on Arc, each with a per-job ceiling and a rolling daily cap checked before any transfer.",
    render: (i, n) => (
      <SlideFrame
        index={i}
        total={n}
        kicker="The agents"
        title="Four wallets, four jobs, hard ceilings"
      >
        <div className="grid grid-cols-4 gap-[28px]">
          {agents.map((a) => (
            <SlideCard key={a.id} className="flex flex-col">
              <p className="slide-kicker text-primary">{a.name}</p>
              <p className="slide-caption mt-[22px] flex-1 text-foreground/85">{a.role}</p>
              <p className="slide-caption mt-[26px] num text-muted-foreground">
                fee {Math.round(a.feeShare * 100)}%
              </p>
              <p className="slide-caption num text-muted-foreground">
                cap {usd(a.maxTicketMinor)} / job
              </p>
            </SlideCard>
          ))}
        </div>
        <p className="slide-body mt-[44px] text-muted-foreground">
          The Baseline Agent is paid for winning. A classical method that beats the quantum leg is
          exactly what the exchange commissioned.
        </p>
      </SlideFrame>
    ),
  },
  {
    id: "receipt",
    label: "The receipt",
    notes:
      "Two verdicts held apart, four grades rather than two, and a tolerance stored on the artefact so a later reader can re-decide it.",
    render: (i, n) => (
      <SlideFrame index={i} total={n} kicker="The receipt" title="Two verdicts, four grades">
        <div className="grid grid-cols-2 gap-[40px]">
          <SlideCard>
            <p className="slide-kicker text-primary">Every receipt carries</p>
            <p className="slide-body mt-[26px] text-foreground/90">
              engine · backend qualifier · shots · seed · commit · tolerance 4·√(0.5/shots) ·
              measured value · Bell control
            </p>
            <p className="slide-caption mt-[28px] text-muted-foreground">
              Mechanism and performance are separate columns. The second never inherits the
              first&rsquo;s PASS.
            </p>
          </SlideCard>
          <SlideCard>
            <p className="slide-kicker text-primary">Grades</p>
            <div className="mt-[26px] space-y-[18px]">
              {[
                ["PASS", "complete and consistent — the only payable grade"],
                ["GAP", "information missing; not the same as a false claim"],
                ["STRUCTURAL", "no recognised envelope attached at all"],
                ["FAIL", "envelope present and contradicted"],
              ].map(([g, d]) => (
                <p key={g} className="slide-caption text-foreground/90">
                  <span className="num text-primary">{g}</span> — {d}
                </p>
              ))}
            </div>
          </SlideCard>
        </div>
      </SlideFrame>
    ),
  },
  {
    id: "blocked",
    label: "The blocked lane",
    notes:
      "The lane we could not run is on the board at full size. Thirty-two qubits against a twenty-six qubit ceiling, published as assessed-blocked, paid nothing.",
    render: (i, n) => {
      const p = pathways.find((x) => x.id === "endoscopy-slots");
      return (
        <SlideFrame
          index={i}
          total={n}
          kicker="The lane that did not run"
          title="Endoscopy: assessed-blocked, published at full size"
        >
          <div className="grid grid-cols-[1.15fr_1fr] gap-[40px]">
            <SlideCard>
              <p className="slide-body text-foreground/90">{p?.question}</p>
              <p className="slide-caption mt-[30px] text-muted-foreground">
                Needs a {p?.qubitsNeeded}-qubit register. The account&rsquo;s emulator ceiling is 26
                qubits, so no execution lane exists.
              </p>
            </SlideCard>
            <SlideCard>
              <p className="slide-kicker text-primary">Outcome</p>
              <p className="slide-body-lg mt-[26px] num text-foreground">GAP · 0.00 USDC</p>
              <p className="slide-caption mt-[26px] text-muted-foreground">
                No number was produced by quietly shrinking the problem. The classical floor —
                maximum site imbalance of 4 patients — stands unchallenged.
              </p>
            </SlideCard>
          </div>
          <p className="slide-body mt-[44px] text-muted-foreground">
            A limit that stops a run is a finding. Publishing it small is how a project starts
            hiding.
          </p>
        </SlideFrame>
      );
    },
  },
  {
    id: "false-win",
    label: "What stops a false win",
    notes:
      "Every one of these four gates exists because something got past us first. The floor is a family because a kernel 'win' turned out to be measured against an untuned baseline. Cohort fitness exists because a cohort topped out at 0.40 recall no matter what we threw at it. Bands exist because a noiseless success does not survive noise. And the negative stays published.",
    render: (i, n) => (
      <SlideFrame
        index={i}
        total={n}
        kicker="Gates added after being caught out"
        title="What stops a false win"
      >
        <div className="grid grid-cols-2 gap-[36px]">
          {[
            [
              "The floor is a family",
              "Plain, balanced, resampled, tuned — the bar is the best of them. A win over an untuned baseline reads UNPOWERED-FLOOR and pays nothing.",
            ],
            [
              "Fitness before spend",
              "A 20,000-record classical oracle ceiling of 0.40 against a 0.80 bar. Weak signal, not scarce data: unfit-cohort, no quantum budget released.",
            ],
            [
              "Pre-register, then amend",
              "Bars fixed before compute, amendments listed. An amendment fixes the tool; it never moves the target.",
            ],
            [
              "Negatives kept at full size",
              "A 17-qubit estimator lost ~33% of its signal and missed its degraded bar. Published as sIII-FAIL, not re-run until it sealed.",
            ],
          ].map(([t, b]) => (
            <SlideCard key={t}>
              <p className="slide-kicker text-primary">{t}</p>
              <p className="slide-caption mt-[24px] text-muted-foreground">{b}</p>
            </SlideCard>
          ))}
        </div>
      </SlideFrame>
    ),
  },
  {
    id: "arc",
    label: "Arc and Circle",
    notes:
      "Arc Testnet, USDC as the gas token, four Circle developer-controlled wallets, and a ReceiptAnchor contract that gets the hash before any transfer clears. Every settlement and anchor carries a real Arcscan hash.",
    render: (i, n) => (
      <SlideFrame index={i} total={n} kicker="The rail · Arc" title="Anchor first, then the money">
        <div className="grid grid-cols-3 gap-[32px]">
          {[
            ["5042002", "Arc Testnet — USDC is the gas token, six decimals, no paymaster"],
            ["4 wallets", "Circle developer-controlled: Trust, Baseline, Nexus, Registry — no EOA, no funded private key"],
            ["Anchor → pay", "ReceiptAnchor stores the receipt hash with signal, engine and shots before any transfer"],
          ].map(([h, b]) => (
            <SlideCard key={h}>
              <p className="num text-[54px] leading-none text-primary">{h}</p>
              <p className="slide-caption mt-[24px] text-muted-foreground">{b}</p>
            </SlideCard>
          ))}
        </div>
        <p className="slide-body mt-[44px] max-w-[1500px] text-foreground/90">
          A method that loses still gets paid, and the record says it lost. An unanchored receipt is
          not payable at all — every settlement and anchor is checkable on Arcscan.
        </p>
        <p className="slide-chrome mt-[28px] text-muted-foreground">
          ReceiptAnchor {CONTRACT.address}
        </p>
      </SlideFrame>
    ),
  },

  {
    id: "demo",
    label: "Live demo",
    notes:
      "Switch to the app. Run a pathway job and let the steps land one at a time: policy, floor, gate, quantum leg, grade, anchor, payments.",
    render: (i, n) => (
      <SlideCanvas>
        <div className="pointer-events-none absolute inset-0 aurora-field opacity-70" />
        <div className="relative flex h-full flex-col items-center justify-center px-[140px] text-center">
          <p className="slide-kicker text-primary">Switch to the app</p>
          <h2 className="slide-title-lg mt-[34px] text-gradient">Run a job</h2>
          <p className="slide-subtitle mt-[38px] max-w-[1400px] text-muted-foreground">
            Seven steps land in order, the receipt is graded in front of you, the hash is anchored,
            then the USDC moves.
          </p>
          <p className="slide-chrome absolute bottom-[70px] right-[140px] text-muted-foreground">
            {i + 1} / {n}
          </p>
        </div>
      </SlideCanvas>
    ),
  },
  {
    id: "honesty",
    label: "Real vs simulated",
    notes:
      "Honesty is the pitch, so the boundary gets its own slide rather than a footnote. Payments and the anchor are real Arc Testnet transactions with Arcscan links. The quantum legs are committed emulator runs and the cohorts are synthetic, and we say so.",
    render: (i, n) => (
      <SlideFrame index={i} total={n} kicker="The boundary" title="What is real, what is simulated">
        <div className="grid grid-cols-2 gap-[40px]">
          <SlideCard>
            <p className="slide-kicker text-pass">Running for real</p>
            <p className="slide-body mt-[26px] text-foreground/90">
              Pathway board · policy gate · classical floors · dequantization gate · receipt grading
              · SLH-DSA sealing · USDC settlement on Arc Testnet · ReceiptAnchor contract writes ·
              every hash checkable on Arcscan
            </p>
          </SlideCard>
          <SlideCard>
            <p className="slide-kicker text-gap">Simulated, and labelled as such</p>
            <p className="slide-body mt-[26px] text-foreground/90">
              The MSK pathway now runs live on the Quantinuum Nexus H2-Emulator — emulator tier,
              never a QPU. Other quantum legs remain committed earlier runs. World ID credentials
              are deterministic stand-ins while the sandbox entitlement is pending.
            </p>
          </SlideCard>

        </div>
        <p className="slide-body mt-[44px] text-muted-foreground">
          Cohorts are synthetic. No patient-level data, no diagnosis, no efficacy or outcome claim.
        </p>
      </SlideFrame>
    ),
  },
  {
    id: "quantum-gap",
    label: "The quantum gap",
    notes:
      "Circle Research's own tracker says the gap between demonstrated logical qubits and the count needed to break ECDSA is closing. Arc already supports SLH-DSA, so we seal every receipt digest with it and verify before anchoring. The Arc transaction underneath is still ECDSA — we say so rather than claiming quantum-safe.",
    render: (i, n) => (
      <SlideFrame
        index={i}
        total={n}
        kicker="Why the receipt is sealed"
        title="The quantum gap is closing"
      >
        <div className="grid grid-cols-3 gap-[32px]">
          <SlideCard>
            <p className="slide-kicker text-accent">Logical qubits demonstrated</p>
            <p className="num mt-[20px] text-[76px] leading-none">{QUANTUM_GAP.demonstrated}</p>
          </SlideCard>
          <SlideCard>
            <p className="slide-kicker text-fail">Needed to break ECDSA</p>
            <p className="num mt-[20px] text-[76px] leading-none">
              {QUANTUM_GAP.ecdsaThreshold}
            </p>
          </SlideCard>
          <SlideCard>
            <p className="slide-kicker text-muted-foreground">Gap remaining</p>
            <p className="num mt-[20px] text-[76px] leading-none">{GAP_REMAINING}</p>
          </SlideCard>
        </div>
        <SlideBullets
          items={[
            `Circle Research Quantum Tracker, read ${TRACKER_READ_ON}. Circle is the source; no endorsement implied.`,
            `Every receipt digest is signed with ${SEAL_SCHEME} (${SEAL_STANDARD}) and verified before it is anchored or paid.`,
            "Arc supports SLH-DSA today; the Arc transaction carrying the anchor is still ECDSA-signed.",
            "Post-quantum at the evidence layer, classical underneath — stated, not claimed away.",
          ]}
        />
      </SlideFrame>
    ),
  },
  {
    id: "sizing",
    label: "What a job costs",
    notes:
      "The first version of this experiment was sized by hand: 69 programs, 9 qubits, 1024 shots — about 3,751 credits of work. The credit formula now lives in the code, gate counts are read off the compiled circuit, and a batch outside the envelope is refused with the number named. Same question, same cohort, same verdict discipline, at a quarter of the cost. The envelope came from reviewer feedback on the hardware side.",
    render: (i, n) => (
      <SlideFrame
        index={i}
        total={n}
        kicker="Sizing before submitting"
        title="What a job costs, before it runs"
      >
        <div className="grid grid-cols-2 gap-[32px]">
          <SlideCard>
            <p className="slide-kicker text-accent">The credit formula</p>
            <p className="num mt-[24px] text-[34px] leading-tight">{COST.formula.expression}</p>
            <p className="slide-caption mt-[24px] text-muted-foreground">
              {COST.formula.note}
            </p>
          </SlideCard>
          <SlideCard>
            <p className="slide-kicker text-muted-foreground">Sized by hand</p>
            <p className="num text-fail mt-[12px] text-[64px] leading-none">
              {Math.round(COST.prior.batchHqc).toLocaleString()}
            </p>
            <p className="slide-kicker mt-[26px] text-muted-foreground">Sized by the model</p>
            <p className="num text-accent mt-[12px] text-[64px] leading-none">
              {Math.round(CHOSEN_BATCH_HQC).toLocaleString()}
            </p>
            <p className="slide-caption mt-[22px] text-muted-foreground">
              Credits. Same question, same cohort, same verdict discipline.
            </p>
          </SlideCard>
        </div>
        <SlideBullets
          items={[
            "Gate counts are read off the compiled circuit — no hand-typed estimate.",
            "A batch outside the envelope is refused with the number named, before anything uploads.",
            `Envelope and limits: ${COST.attribution}.`,
          ]}
        />
      </SlideFrame>
    ),
  },
  {
    id: "operating-model",
    label: "Operating model",
    notes:
      "This was built by a scheduled agent with a searchable memory, driven from a phone. Four roles kept separate, a daily cadence rather than sprints, and the chat channel deliberately kept outside the evidence path — it can start a job and read a receipt back, and nothing it says becomes evidence.",
    render: (i, n) => (
      <SlideFrame
        index={i}
        total={n}
        kicker="How this was actually run"
        title="The chat channel is not the evidence layer"
      >
        <SlideBullets items={OPERATING_LESSONS.map((l) => `${l.title} — ${l.body}`)} />
      </SlideFrame>
    ),
  },
  {
    id: "ens",
    label: "ENS — which agent is paid",
    notes:
      "ENS answers which agent is being paid and whether it was permitted. Each agent holds an ENSv2 Sepolia subname under clinicalquantum.eth with ENSIP-25 records pointing at its Arc actor address and naming the intent it may be paid for. Before any budget is released the payee is resolved through the Universal Resolver and compared to the address on the receipt. The shared PermissionedResolver rejected our writes, so we deployed AgentResolver and wired it through the ENSv2 registry.",
    render: (i, n) => (
      <SlideFrame
        index={i}
        total={n}
        kicker="Identity · ENS"
        title="A payment rail cannot say who it paid"
      >
        <div className="grid grid-cols-3 gap-[32px]">
          {[
            ["Name", "Four ENSv2 Sepolia subnames under clinicalquantum.eth — one per agent."],
            [
              "Record",
              "ENSIP-25 records carry the Arc actor address and the intent that agent may be paid for.",
            ],
            [
              "Check",
              "The payee is resolved through the Universal Resolver and compared to the receipt. A mismatch blocks settlement.",
            ],
          ].map(([h, b]) => (
            <SlideCard key={h}>
              <p className="slide-kicker text-primary">{h}</p>
              <p className="slide-caption mt-[24px] text-muted-foreground">{b}</p>
            </SlideCard>
          ))}
        </div>
        <p className="slide-body mt-[44px] max-w-[1500px] text-foreground/90">
          The shared PermissionedResolver refused our writes, so we deployed our own AgentResolver
          and wired it through the ENSv2 registry.
        </p>
        <p className="slide-chrome mt-[26px] text-muted-foreground">
          AgentResolver {ENS.contracts.agentResolver} · Sepolia {ENS.chainId}
        </p>
      </SlideFrame>
    ),
  },
  {
    id: "world",
    label: "World — whose authority",
    notes:
      "An agent may not release a budget on nobody's authority. World ID sits between agent identity and spend: one unique human authorises the release for that specific pathway, and only the nullifier hash is kept. That hash folds into the receipt digest and seals with SLH-DSA before anchoring. Authority is bound to one pathway and never rebound; unauthorised runs settle 0.00 USDC. Sandbox entitlement is still pending, so Selfie Check credentials are deterministic stand-ins.",
    render: (i, n) => (
      <SlideFrame
        index={i}
        total={n}
        kicker="Authority · World ID"
        title="No agent releases a budget on nobody's authority"
      >
        <SlideBullets
          items={[
            "One unique human authorises the release, bound to that one pathway — never rebound to another.",
            "Only the nullifier hash is kept. No image, no name, no biometric and no wallet reaches the app.",
            "The nullifier folds into the receipt digest, so the SLH-DSA seal and the Arc anchor cover the authorisation, not just the result.",
            "No human, no settlement: the run still executes and publishes at full size, and pays 0.00 USDC.",
          ]}
        />
        <p className="slide-chrome mt-[34px] text-muted-foreground">
          Selfie Check is an abuse-prevention and authorisation signal only — never identity,
          competence or clinical authority. Sandbox entitlement pending, so demo credentials are
          labelled simulated.
        </p>
      </SlideFrame>
    ),
  },

  {
    id: "device",
    label: "The device tap",
    notes:
      "Ledger adds the missing half of authority: a hardware tap on the exact release parameters. The enrolled Ledger personal-signs pathway, budget, chain and quantum leg after they are shown on its screen; the signature is recovered server-side against the enrolled address and hashed into the receipt digest. The Key Ring seals the entity secret and Nexus token under the seed, so the agent requests a scoped capability instead of holding a key. No tap, no settlement.",
    render: (i, n) => (
      <SlideFrame
        index={i}
        total={n}
        kicker="Ledger Agent Stack"
        title="A tap between autonomy and the budget"
      >
        <SlideBullets
          items={[
            "The agents decide autonomously; the last irreversible step needs a human hand on hardware.",
            "The enrolled Ledger signs the exact release parameters — pathway, budget, chain, quantum leg — shown on its own screen. No tap, no settlement; the run publishes and pays nobody.",
            "The signature is recovered server-side against the enrolled signer address, so a re-pointed or replayed approval is refused by construction.",
            "The device approval is hashed into the receipt digest: the SLH-DSA seal and the Arc anchor commit to the tap as well.",
            "The Key Ring (LKRP) seals the Circle entity secret and Nexus token under keys derived from the seed — the agent requests a scoped, short-lived capability and never holds the key.",
          ]}
        />
      </SlideFrame>
    ),
  },
  {
    id: "close",
    label: "Close",
    notes:
      "Money already moves on Arc Testnet. What is left is a live Nexus submission and the World sandbox entitlement. The boundary stays: attestation and capacity planning, not prediction.",
    render: (i, n) => (
      <SlideFrame index={i} total={n} kicker="What is next" title="Money already moves">
        <SlideBullets
          items={[
            "Live today: Circle developer-controlled wallets settle USDC and write ReceiptAnchor on Arc Testnet, every hash verifiable on Arcscan.",
            "The MSK pathway ran live on the Quantinuum Nexus H2-Emulator with its own job id; the receipt rules did not change.",
            "Deployment boundary: attestation and capacity planning. Not a clinical system, not a triage tool.",
            "Receipts are SLH-DSA sealed; the Arc anchor transaction is still ECDSA-signed, and that leg stays an open hazard.",
          ]}
        />
      </SlideFrame>
    ),
  },
];
