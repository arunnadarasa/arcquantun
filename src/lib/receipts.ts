// Receipt envelope model, versioned qas/envelope/0.1.
//
// Two verdicts, never one:
//   mechanism  — did the circuit do what it was supposed to, inside 4*sqrt(0.5/shots)?
//   performance — did it beat the classical floor?
// The second NEVER inherits the first's PASS.
//
// Four grades, not two: PASS / GAP / STRUCTURAL / FAIL.
// GAP means information is missing, which is not the same as a false claim.

export const ENVELOPE_SCHEMA = "qas/envelope/0.1";

export type MechanismVerdict = "PASS" | "FAIL" | "BLOCKED";
export type PerformanceVerdict = "WIN" | "LOSS" | "TIE" | "NOT-RUN";
export type ReceiptGrade = "PASS" | "GAP" | "STRUCTURAL" | "FAIL";

export interface ReceiptEnvelope {
  schema: string;
  /** Sentences that could be false, not topics. */
  claims: string[];
  engine: string;
  /** Kept separate so a device name can never be read as hardware. */
  backendQualifier: "emulator" | "hardware" | "simulator" | "not-run";
  shots: number | null;
  seed: number | null;
  commit: string | null;
  /** 4*sqrt(0.5/shots), stored so a later reader can re-decide the verdict. */
  envelope: number | null;
  measured: number | null;
  mechanism: MechanismVerdict;
  performance: PerformanceVerdict;
  /** Bell control: anti-correlated fraction on a |Phi+> pair in the same job. */
  bellAnticorrelated: number | null;
  jobId: string | null;
  device: string | null;
  estimatedHqc: number | null;
  billedHqc: number | null;
  blockedReason?: string;
}

/** The tolerance every mechanism verdict is judged against. */
export function envelopeFor(shots: number): number {
  return 4 * Math.sqrt(0.5 / shots);
}

/** Grade a receipt. Missing information is a GAP, never a downgraded claim. */
export function gradeReceipt(r: ReceiptEnvelope): {
  grade: ReceiptGrade;
  reasons: string[];
} {
  const reasons: string[] = [];
  if (r.schema !== ENVELOPE_SCHEMA) {
    return { grade: "STRUCTURAL", reasons: ["No recognised receipt envelope attached."] };
  }
  if (r.mechanism === "BLOCKED") {
    return {
      grade: "GAP",
      reasons: [r.blockedReason ?? "Leg assessed-blocked; no measurement exists."],
    };
  }
  if (r.shots === null) reasons.push("Shot count missing.");
  if (r.seed === null) reasons.push("Seed missing — the run is not replayable.");
  if (!r.engine) reasons.push("Engine missing.");
  if (r.commit === null) reasons.push("Source commit missing.");
  if (r.claims.length === 0) reasons.push("No falsifiable claim recorded.");

  // A FAIL is an envelope that is present and contradicted.
  if (r.shots !== null && r.measured !== null && r.envelope !== null) {
    const consistent = r.measured <= r.envelope;
    if (consistent && r.mechanism === "FAIL") {
      reasons.push("Stated mechanism verdict contradicts the measured value.");
      return { grade: "FAIL", reasons };
    }
    if (!consistent && r.mechanism === "PASS") {
      reasons.push("Measured value falls outside the envelope but the verdict says PASS.");
      return { grade: "FAIL", reasons };
    }
  }
  if (r.bellAnticorrelated !== null && r.shots !== null) {
    if (r.bellAnticorrelated > envelopeFor(r.shots)) {
      reasons.push("Bell control failed — the whole batch is rejected.");
      return { grade: "FAIL", reasons };
    }
  }
  if (reasons.length > 0) return { grade: "GAP", reasons };
  return { grade: "PASS", reasons: ["Envelope complete and internally consistent."] };
}

/** Only a PASS receipt releases the compute agents' payment. */
export function isPayable(grade: ReceiptGrade): boolean {
  return grade === "PASS";
}

export function gradeTone(grade: ReceiptGrade): string {
  switch (grade) {
    case "PASS":
      return "text-pass border-pass/40 bg-pass/10";
    case "GAP":
      return "text-gap border-gap/40 bg-gap/10";
    case "FAIL":
      return "text-fail border-fail/40 bg-fail/10";
    default:
      return "text-muted-foreground border-border bg-muted/40";
  }
}

/** Deterministic, dependency-free hash used for the on-chain anchor preview. */
export function receiptHash(payload: unknown): string {
  const s = JSON.stringify(payload);
  // FNV-1a x 4 lanes, widened to 64 hex chars. Deterministic and replayable.
  const lanes = [0x811c9dc5, 0x01000193, 0x9e3779b9, 0x85ebca6b];
  const out: string[] = [];
  for (let lane = 0; lane < 4; lane++) {
    let h = lanes[lane] >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i) + lane;
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    let g = h;
    for (let k = 0; k < 2; k++) {
      g = Math.imul(g ^ (g >>> 15), 0x2545f491) >>> 0;
      out.push(g.toString(16).padStart(8, "0"));
    }
  }
  return `0x${out.join("")}`;
}
