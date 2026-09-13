// Server-side verification of a Ledger device approval. The bridge is an
// untrusted client: the signature is recovered here, compared against the
// enrolled signer address, and the message is rebuilt from committed data so
// a replayed or re-pointed approval cannot pass.
import { createServerFn } from "@tanstack/react-start";
import { recoverMessageAddress } from "viem";
import { getPathway } from "@/data/pathways";
import { getRun } from "@/data/runs";
import { buildDeviceApprovalMessage, type DeviceApproval } from "@/lib/device";

const APPROVAL_TTL_MS = 15 * 60 * 1000;

export interface DeviceGateResult {
  /** True when an approving device is enrolled for this deployment. */
  required: boolean;
  ok: boolean;
  reason: string;
  approvedBy: string | null;
  /** "device" = physical Ledger; "emulator" = Speculos; null = no approval. */
  qualifier: "device" | "emulator" | null;
}

function enrolledSigner(qualifier: "device" | "emulator"): string | null {
  // The emulator has its own enrolment so the real device's signer is never
  // touched or rebound; it falls back to the main address when unset.
  const raw =
    qualifier === "emulator"
      ? (process.env["LEDGER_SIGNER_ADDRESS_EMULATOR"] ??
        process.env["LEDGER_SIGNER_ADDRESS"])
      : process.env["LEDGER_SIGNER_ADDRESS"];
  return raw && raw.startsWith("0x") ? raw : null;
}

export async function verifyDeviceApproval(
  pathwayId: string,
  approval: DeviceApproval | null | undefined,
): Promise<DeviceGateResult> {
  const qualifier = approval?.qualifier === "emulator" ? "emulator" : "device";
  const enrolled = enrolledSigner(qualifier);
  if (!enrolled) {
    return {
      required: false,
      ok: true,
      reason:
        "No approving device is enrolled on this deployment, so settlement runs without hardware confirmation. Enrolling a Ledger signer makes this gate mandatory.",
      approvedBy: null,
      qualifier: null,
    };
  }
  if (!approval || !approval.message || !approval.signature) {
    return {
      required: true,
      ok: false,
      reason:
        "No device approval presented. The enrolled Ledger must sign the release parameters before this budget moves.",
      approvedBy: null,
      qualifier,
    };
  }

  const pathway = getPathway(pathwayId);
  const run = getRun(pathwayId);
  if (!pathway || !run) {
    return { required: true, ok: false, reason: `Unknown pathway ${pathwayId}.`, approvedBy: null, qualifier };
  }

  const message = buildDeviceApprovalMessage({
    pathwayId,
    budgetMinor: pathway.budgetMinor,
    engine: run.receipt.engine,
    backendQualifier: run.receipt.backendQualifier,
    shots: run.receipt.shots,
    seed: run.receipt.seed,
    issuedAt: approval.issuedAt,
  });
  if (approval.message !== message) {
    return {
      required: true,
      ok: false,
      reason:
        "The signed payload does not match this pathway's committed release parameters, so the signature is refused.",
      approvedBy: null,
      qualifier,
    };
  }

  const issued = Date.parse(approval.issuedAt);
  if (!Number.isFinite(issued)) {
    return { required: true, ok: false, reason: "Approval timestamp unparseable.", approvedBy: null, qualifier };
  }
  const age = Date.now() - issued;
  if (age > APPROVAL_TTL_MS) {
    return { required: true, ok: false, reason: "Device approval has expired; approve again on the device.", approvedBy: null, qualifier };
  }
  if (age < -2 * 60 * 1000) {
    return { required: true, ok: false, reason: "Device approval is dated in the future.", approvedBy: null, qualifier };
  }

  try {
    const signer = await recoverMessageAddress({
      message: approval.message,
      signature: approval.signature.startsWith("0x")
        ? (approval.signature as `0x${string}`)
        : (`0x${approval.signature}` as `0x${string}`),
    });
    if (signer.toLowerCase() !== enrolled.toLowerCase()) {
      return {
        required: true,
        ok: false,
        reason: `The signature recovers to ${signer.slice(0, 10)}…, not the enrolled device. Only the enrolled signer can approve a release.`,
        approvedBy: null,
        qualifier,
      };
    }
    return {
      required: true,
      ok: true,
      reason:
        qualifier === "emulator"
          ? "Speculos — Ledger's emulated device — signed the exact release parameters after they were shown on the emulated screen. Same Ethereum app binary, same APDU flow, same code path as a physical Ledger; only the hardware is simulated."
          : "The enrolled Ledger signed the exact release parameters — pathway, budget, chain and quantum leg — after they were shown on the device screen.",
      approvedBy: signer,
      qualifier,
    };
  } catch {
    return { required: true, ok: false, reason: "Signature recovery failed; the approval is malformed.", approvedBy: null, qualifier };
  }
}

export interface DeviceStatus {
  enrolled: boolean;
  bridgeUrl: string;
  reason: string;
}

/** Read-only status for the /device page. Never returns the enrolled address. */
export const getDeviceStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<DeviceStatus> => {
    const enrolled = Boolean(enrolledSigner("device"));
    return {
      enrolled,
      bridgeUrl: "http://127.0.0.1:8943",
      reason: enrolled
        ? "An approving device is enrolled. Every budget release now requires its signature."
        : "No approving device is enrolled. Set LEDGER_SIGNER_ADDRESS to make the device gate mandatory.",
    };
  },
);
