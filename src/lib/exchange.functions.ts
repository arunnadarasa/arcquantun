// Server functions for the exchange. Every one boots with zero secrets and
// returns a realistic envelope flagged simulated: true when Circle is absent.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { agents, type AgentId } from "@/data/agents";
import { getPathway, poweredFloor } from "@/data/pathways";
import { getRun } from "@/data/runs";
import {
  gradeReceipt,
  isPayable,
  receiptDigest,
  receiptPayload,
  type PayeeIdentity,
  type HumanAuthorityRecord,
} from "@/lib/receipts";
import { INTENT_FOR_AGENT } from "@/lib/ens-namespace";
import type { ReceiptSeal } from "@/data/seal-info";
import { checkPolicy } from "@/lib/policy";
import contractCfg from "@/data/contract.json";

export type StepKind =
  | "policy"
  | "identity"
  | "human"
  | "classical"
  | "fitness"
  | "dequantization"
  | "quantum"
  | "receipt"
  | "seal"
  | "anchor"
  | "settlement";

export interface RunStep {
  kind: StepKind;
  title: string;
  detail: string;
  ok: boolean;
  meta?: Record<string, string | number | null>;
  txHash?: string | null;
  transferId?: string;
  agentId?: AgentId;
  amountMinor?: number;
  /** The ENS name this leg is paid to, where one is bound. */
  ensName?: string;
}

export interface RunResult {
  pathwayId: string;
  simulated: boolean;
  mode: "demo" | "live";
  steps: RunStep[];
  receiptHash: string;
  seal: ReceiptSeal | null;
  grade: string;
  payable: boolean;
  totalPaidMinor: number;
  startedAt: string;
}

function pseudoTx(seed: string): string {
  let h = 0x811c9dc5;
  const out: string[] = [];
  for (let lane = 0; lane < 8; lane++) {
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i) + lane;
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    out.push((h >>> 0).toString(16).padStart(8, "0"));
  }
  return `0x${out.join("")}`;
}

export const runPathwayJob = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ pathwayId: z.string() }).parse(d))
  .handler(async ({ data }): Promise<RunResult> => {
    const pathway = getPathway(data.pathwayId);
    const run = getRun(data.pathwayId);
    if (!pathway || !run) throw new Error(`Unknown pathway ${data.pathwayId}`);

    const { circleConfigured } = await import("@/lib/circle.server");
    const live = circleConfigured() && contractCfg.deployed === true;
    const steps: RunStep[] = [];
    const startedAt = new Date().toISOString();

    // 1. Policy gate, before any money moves.
    for (const a of agents) {
      if (a.feeShare === 0) continue;
      const amount = Math.round(pathway.budgetMinor * a.feeShare);
      const check = checkPolicy(a.id, amount, 0);
      steps.push({
        kind: "policy",
        title: `Policy check — ${a.name}`,
        detail: check.reason,
        ok: check.allowed,
        agentId: a.id,
        amountMinor: amount,
        meta: {
          "per-job ceiling": check.maxTicketMinor,
          "24h cap": check.dailyCapMinor,
        },
      });
    }

    // 2. Identity gate. A verifiable money rail paying an unnamed hex string is
    // only half a receipt. Each payee is resolved through ENS: the name must
    // point at the exact Arc address about to be paid, and must permit this
    // leg's intent. A mismatch blocks payment outright.
    const { checkAgentIdentity } = await import("@/lib/ens.server");
    const identity: PayeeIdentity[] = [];
    let identityOk = true;
    for (const a of agents) {
      if (a.feeShare === 0) continue;
      const chk = await checkAgentIdentity(a.id, INTENT_FOR_AGENT[a.id]);
      if (!chk.ok) identityOk = false;
      identity.push({
        agentId: chk.agentId,
        ensName: chk.ensName,
        payeeArcAddress: chk.payeeArcAddress,
        intent: chk.intent,
        state: chk.state,
        source: chk.source,
        checkedAt: chk.checkedAt,
      });
      steps.push({
        kind: "identity",
        title: `Identity gate — ${chk.ensName}`,
        detail: chk.reason,
        ok: chk.ok,
        agentId: a.id,
        ensName: chk.ensName,
        meta: {
          intent: chk.intent,
          state: chk.state,
          source: chk.source,
          "arc actor": chk.payeeArcAddress,
          attestation: chk.attestation.present ? "ENSIP-25 present" : "none found",
        },
      });
    }

    // 3. Classical floor, recorded first — and drawn from the POWERED family,
    // never from a single unpowered baseline.
    const powered = poweredFloor(pathway);
    steps.push({
      kind: "classical",
      title: "Classical floor recorded",
      detail: `${run.classical.method} — ${run.classical.metric} ${run.classical.value}`,
      ok: true,
      agentId: "baseline",
      meta: {
        runtime_ms: run.classical.runtimeMs,
        family_members: pathway.classicalFloor.family.length,
        powered_best: powered ? `${powered.method} ${powered.value}` : null,
      },
    });

    // 3. Cohort fitness, before any quantum budget is released. If the best a
    // classical oracle can do at large sample size sits under the bar, the
    // signal is weak rather than the data scarce, and nothing is spent.
    if (pathway.ceiling) {
      steps.push({
        kind: "fitness",
        title: "Cohort fitness gate — unfit, no quantum budget released",
        detail: pathway.ceiling.note,
        ok: false,
        agentId: "baseline",
        meta: {
          bar: pathway.ceiling.bar,
          classical_ceiling: pathway.ceiling.oracle,
          oracle_records: pathway.ceiling.oracleN,
        },
      });
    } else {
      steps.push({
        kind: "fitness",
        title: "Cohort fitness gate — passed",
        detail:
          "A classical ceiling sweep over growing sample sizes clears the bar, so the cohort carries enough signal to be worth a quantum receipt.",
        ok: true,
        agentId: "baseline",
      });
    }

    // 4. Dequantization gate.
    steps.push({
      kind: "dequantization",
      title: run.dequantization.reproduced
        ? "Dequantization gate — classical surrogate reproduces the result"
        : "Dequantization gate — surrogate does not reproduce the result",
      detail: run.dequantization.note,
      ok: true,
      agentId: "baseline",
      meta: { surrogate: run.dequantization.surrogate },
    });

    // 4. Quantum leg.
    const r = run.receipt;
    steps.push({
      kind: "quantum",
      title:
        r.mechanism === "BLOCKED"
          ? "Quantum leg assessed-blocked"
          : `Quantum leg complete — ${r.device}`,
      detail:
        r.mechanism === "BLOCKED"
          ? (r.blockedReason ?? "No execution lane available.")
          : `${r.engine} (${r.backendQualifier}), ${r.shots} shots, seed ${r.seed}.`,
      ok: r.mechanism !== "FAIL",
      agentId: "nexus",
      meta: {
        engine: r.engine,
        qualifier: r.backendQualifier,
        shots: r.shots,
        seed: r.seed,
        job_id: r.jobId,
        billed_hqc: r.billedHqc,
      },
    });

    // 5. Receipt grading.
    const graded = gradeReceipt(r);
    const hash = await receiptDigest(receiptPayload(pathway.id, r, identity));
    steps.push({
      kind: "receipt",
      title: `Receipt graded ${graded.grade}`,
      detail: graded.reasons.join(" "),
      ok: graded.grade === "PASS",
      meta: {
        mechanism: r.mechanism,
        performance: r.performance,
        envelope: r.envelope,
        measured: r.measured,
        bell_anticorrelated: r.bellAnticorrelated,
      },
    });

    // 6. Post-quantum seal. A receipt that does not verify is not anchored and
    // not paid — the same discipline as a failed grade.
    let seal: ReceiptSeal | null = null;
    if (isPayable(graded.grade)) {
      const { sealDigest } = await import("@/lib/pq-seal.server");
      seal = await sealDigest(hash);
      steps.push({
        kind: "seal",
        title: seal.verified
          ? `Receipt sealed with ${seal.scheme}`
          : "Post-quantum seal failed verification",
        detail: seal.verified
          ? "The receipt digest is signed with a NIST-standardised post-quantum signature and verified before anything is anchored or paid. The Arc transaction below is still ECDSA-signed."
          : "The signature did not verify against the published key, so this receipt is not anchored and not payable.",
        ok: seal.verified,
        meta: {
          scheme: seal.scheme,
          standard: seal.standard,
          "public key": seal.publicKeyFingerprint,
          signature: seal.signatureFingerprint,
          "signature bytes": seal.signatureBytes,
          "key source": seal.keySource,
        },
      });
    }

    const payable = isPayable(graded.grade) && seal !== null && seal.verified && identityOk;

    // 7. Anchor the sealed digest before payment clears.
    let anchorTx: string | null = null;
    if (payable) {
      if (live) {
        try {
          const { anchorReceipt } = await import("@/lib/circle.server");
          const res = await anchorReceipt({
            walletId: process.env["CIRCLE_REGISTRY_WALLET_ID"] ?? "",
            contractAddress: String(contractCfg.address),
            receiptHash: hash,
            signalId: pathway.id,
            engine: r.engine,
            shots: r.shots ?? 0,
          });
          anchorTx = res.txHash;
          steps.push({
            kind: "anchor",
            title: res.txHash ? "Receipt hash anchored on Arc" : "Receipt hash anchored (pending)",
            detail: `Contract ${contractCfg.address} · state ${res.state}`,
            ok: true,
            txHash: res.txHash,
            transferId: res.transferId,
            agentId: "registry",
          });
        } catch (e) {
          steps.push({
            kind: "anchor",
            title: "Anchoring failed",
            detail: e instanceof Error ? e.message : "Unknown anchoring error",
            ok: false,
            agentId: "registry",
          });
        }
      } else {
        anchorTx = pseudoTx(`anchor:${hash}`);
        steps.push({
          kind: "anchor",
          title: "Receipt hash anchored (demo mode)",
          detail:
            "Simulated envelope. Add the Circle keys and deploy the anchoring contract to write this to Arc Testnet for real.",
          ok: true,
          txHash: anchorTx,
          agentId: "registry",
        });
      }
    } else {
      steps.push({
        kind: "anchor",
        title: "Not anchored",
        detail:
          "An unanchored receipt is not payable. The grade must be PASS and the post-quantum seal must verify first.",
        ok: false,
        agentId: "registry",
      });
    }

    // 7. Settlement. Losing is still paid work; a GAP receipt is not.
    let totalPaidMinor = 0;
    for (const a of agents) {
      if (a.feeShare === 0) continue;
      const amount = Math.round(pathway.budgetMinor * a.feeShare);
      const payeeName = identity.find((i) => i.agentId === a.id)?.ensName;
      if (!payable) {
        steps.push({
          kind: "settlement",
          title: `No payment — ${a.name}`,
          detail: identityOk
            ? `Receipt graded ${graded.grade}. The Trust Agent releases funds only against a PASS receipt.`
            : "The identity gate refused this payee. A name that does not resolve to the address on the receipt is not paid.",
          ok: false,
          agentId: a.id,
          amountMinor: 0,
        });
        continue;
      }
      if (live) {
        
        try {
          const { transferUsdc } = await import("@/lib/circle.server");
          const res = await transferUsdc({
            walletId: process.env["CIRCLE_TRUST_WALLET_ID"] ?? "",
            toAddress: process.env[`CIRCLE_${a.id.toUpperCase()}_ADDRESS`] ?? "",
            amountUsdc: (amount / 1e6).toFixed(6),
          });
          console.log("[runPathwayJob] transfer result", a.id, res.state, res.txHash);
          totalPaidMinor += amount;
          steps.push({
            kind: "settlement",
            title: res.txHash ? `Paid ${a.name}` : `Paid ${a.name} (pending)`,
            detail: `USDC settled on Arc Testnet · state ${res.state}`,
            ok: true,
            txHash: res.txHash,
            transferId: res.transferId,
            agentId: a.id,
            amountMinor: amount,
            ...(payeeName ? { ensName: payeeName } : {}),
          });
        } catch (e) {
          steps.push({
            kind: "settlement",
            title: `Payment failed — ${a.name}`,
            detail: e instanceof Error ? e.message : "Unknown transfer error",
            ok: false,
            agentId: a.id,
            amountMinor: 0,
          });
        }
      } else {
        totalPaidMinor += amount;
        steps.push({
          kind: "settlement",
          title: `Paid ${a.name} (demo mode)`,
          detail:
            a.id === "nexus" && r.performance === "LOSS"
              ? "Paid for the run even though the quantum method lost. The record says it lost."
              : "Simulated USDC settlement on Arc Testnet.",
          ok: true,
          txHash: pseudoTx(`pay:${hash}:${a.id}`),
          agentId: a.id,
          amountMinor: amount,
          ...(payeeName ? { ensName: payeeName } : {}),
        });
      }
    }

    return {
      pathwayId: pathway.id,
      seal,
      simulated: !live,
      mode: live ? "live" : "demo",
      steps,
      receiptHash: hash,
      grade: graded.grade,
      payable,
      totalPaidMinor,
      startedAt,
    };
  });

/** Digest one committed receipt and seal it with SLH-DSA, on demand. */
export const sealPathwayReceipt = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ pathwayId: z.string() }).parse(d))
  .handler(async ({ data }): Promise<{ digest: string; seal: ReceiptSeal }> => {
    const run = getRun(data.pathwayId);
    if (!run) throw new Error(`Unknown pathway ${data.pathwayId}`);
    const digest = await receiptDigest(receiptPayload(data.pathwayId, run.receipt));
    const { sealDigest } = await import("@/lib/pq-seal.server");
    return { digest, seal: await sealDigest(digest) };
  });



export const getExchangeStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { preflight } = await import("@/lib/circle.server");
  const pf = preflight();
  return {
    circleReady: pf.ok,
    hints: pf.hints,
    contractDeployed: contractCfg.deployed === true,
    contractAddress: contractCfg.address as string | null,
    chainId: contractCfg.chainId,
  };
});
