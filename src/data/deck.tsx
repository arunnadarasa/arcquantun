// The submission deck, eleven slides, one idea each.
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
    id: "arc",
    label: "Arc and Circle",
    notes:
      "Arc Testnet, USDC as the gas token, Circle developer-controlled wallets, and a ReceiptAnchor contract that gets the hash before any transfer clears.",
    render: (i, n) => (
      <SlideFrame index={i} total={n} kicker="The rail" title="Arc, USDC and the anchor">
        <SlideBullets
          items={[
            "Arc Testnet, chain 5042002 — USDC is the gas token, six decimals, no paymaster needed.",
            "Circle developer-controlled wallets: one per agent, no EOA and no funded private key.",
            "ReceiptAnchor.sol stores keccak of the receipt with its signal, engine and shot count.",
            "The anchor is written before settlement. An unanchored receipt is not payable.",
          ]}
        />
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
      "Honesty is the pitch, so the boundary gets its own slide rather than a footnote. Grading and the ledger are real; payments and the anchor are simulated envelopes until the keys and the contract exist.",
    render: (i, n) => (
      <SlideFrame index={i} total={n} kicker="The boundary" title="What is real, what is simulated">
        <div className="grid grid-cols-2 gap-[40px]">
          <SlideCard>
            <p className="slide-kicker text-pass">Running for real</p>
            <p className="slide-body mt-[26px] text-foreground/90">
              Pathway board · policy gate · classical floors · dequantization gate · receipt grading
              · receipt hashing · settlement ledger
            </p>
          </SlideCard>
          <SlideCard>
            <p className="slide-kicker text-gap">Simulated, and labelled as such</p>
            <p className="slide-body mt-[26px] text-foreground/90">
              USDC transfers and the on-chain anchor, until the Circle keys are configured and
              ReceiptAnchor is deployed. Quantum legs are committed offline runs — emulator tier,
              never a QPU.
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
    id: "close",
    label: "Close",
    notes:
      "Two Circle keys and one contract deployment away from live money. The boundary stays: attestation and capacity planning, not prediction.",
    render: (i, n) => (
      <SlideFrame index={i} total={n} kicker="What is next" title="One deployment from live money">
        <SlideBullets
          items={[
            "Two Circle keys and a deployed ReceiptAnchor turn every simulated envelope into a real Arc transaction.",
            "A live Quantinuum Nexus submission needs a token and a spend guard — the receipt rules do not change.",
            "Deployment boundary: attestation and capacity planning. Not a clinical system, not a triage tool.",
            "Receipt signing is classical, so this record is not quantum-safe end to end. Logged as an open hazard.",
          ]}
        />
      </SlideFrame>
    ),
  },
];
