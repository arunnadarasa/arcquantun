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
/**
 * UNPOWERED-FLOOR: the comparison was made against a single unpowered baseline.
 * Beating a straw man is not a win, so this verdict can never read WIN.
 */
export type PerformanceVerdict = "WIN" | "LOSS" | "TIE" | "NOT-RUN" | "UNPOWERED-FLOOR";
export type ReceiptGrade = "PASS" | "GAP" | "STRUCTURAL" | "FAIL";

/**
 * Noisy-tier bands, committed before the run. A result that lands outside sI is
 * published with its diagnosis and pays nothing. It is never re-run to chase a seal.
 */
export type NoiseBand = "sI-PASS" | "sII-DEGRADED" | "sIII-FAIL";

export const NOISE_BANDS: { band: NoiseBand; meaning: string }[] = [
  { band: "sI-PASS", meaning: "Inside the pre-committed tolerance at every probe." },
  {
    band: "sII-DEGRADED",
    meaning: "The signal's direction survives the noise; its magnitude does not.",
  },
  { band: "sIII-FAIL", meaning: "Outside the degraded bar at one or more probes." },
];

/** A pre-registration and the amendments committed before the compute they govern. */
export interface PreRegistration {
  /** Document or commit the bars were fixed in, before any compute. */
  ref: string;
  /** The bars themselves, in the words they were committed in. */
  bars: string;
  /** Each amendment, committed before the run it governs. Tools get fixed; targets do not move. */
  amendments: string[];
}

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
  /** NOISELESS-SIM or NOISY-EMUL. Never a QPU tier unless a QPU actually ran. */
  noiseTier?: "NOISELESS-SIM" | "NOISY-EMUL" | "not-run";
  /** The committed band this run landed in, where a noisy tier applies. */
  band?: NoiseBand | null;
  /** The bars and the amendment chain, so a reader can see they were set first. */
  preRegistration?: PreRegistration | null;
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
  if (r.preRegistration === null || r.preRegistration === undefined) {
    reasons.push("No pre-registration attached — the bars cannot be shown to predate the run.");
  }

  // A band outside sI is a kept negative. It is published, and it is not payable.
  if (r.band === "sIII-FAIL") {
    reasons.push(
      "Noisy-tier band sIII-FAIL: the measurement fell outside its own pre-committed bar. Kept as a negative, paid nothing, not re-run.",
    );
    return { grade: "FAIL", reasons };
  }
  if (r.band === "sII-DEGRADED") {
    reasons.push(
      "Noisy-tier band sII-DEGRADED: direction survives, magnitude does not. Not a claim, so not payable.",
    );
  }

  // A win against a single unpowered baseline is not a win.
  if (r.performance === "UNPOWERED-FLOOR") {
    reasons.push(
      "Comparison was made against one unpowered baseline. The powered classical family was never measured, so no performance claim stands.",
    );
  }


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

/**
 * Who a leg is paid to, as a name rather than a hex string. Carried into the
 * hashed payload so the anchored digest commits to the identity claim too.
 */
export interface PayeeIdentity {
  agentId: string;
  ensName: string;
  payeeArcAddress: string | null;
  intent: string;
  state: string;
  source: string;
  checkedAt: string;
}

/**
 * The human who authorised the spend, reduced to a nullifier hash. Carried into
 * the hashed payload so the anchored digest commits to the authorisation too.
 * Nothing here identifies a person.
 */
export interface HumanAuthorityRecord {
  nullifierHash: string;
  credential: string;
  verificationLevel: string;
  action: string;
  signal: string;
  verifiedAt: string;
  simulated: boolean;
}

/** The exact bytes that get hashed, sealed and anchored. */
export function receiptPayload(
  pathwayId: string,
  r: ReceiptEnvelope,
  identity?: PayeeIdentity[],
  authority?: HumanAuthorityRecord | null,
): unknown {
  return {
    pathwayId,
    receipt: r,
    commit: r.commit,
    identity: identity ?? null,
    humanAuthority: authority ?? null,
  };
}

/** SHA-256 digest of the receipt payload. This is what SLH-DSA signs. */
export async function receiptDigest(payload: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const d = await crypto.subtle.digest("SHA-256", bytes as unknown as ArrayBuffer);
  return `0x${Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("")}`;
}
