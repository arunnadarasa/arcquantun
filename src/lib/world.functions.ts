// Server functions for the human-authority layer. Both boot with zero secrets.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { WORLDID_CONFIG } from "@/config/worldid";
import { demoNullifier, type HumanAuthority } from "@/lib/world";

export interface WorldStatus {
  /** True once the RP id and signing key are present: the real credential flow. */
  live: boolean;
  appId: string;
  action: string;
  reason: string;
}

export const getWorldStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<WorldStatus> => {
    const live = Boolean(process.env["WORLDID_RP_ID"] && process.env["WORLDID_RP_SIGNING_KEY"]);
    return {
      live,
      appId: WORLDID_CONFIG.appId,
      action: WORLDID_CONFIG.action,
      reason: live
        ? "Relying Party configured. Authorisations are real Selfie Check credentials."
        : "Sandbox entitlement pending, so no Relying Party key is configured. Authorisations are simulated and labelled as such; nothing here claims a real human was verified.",
    };
  },
);

/**
 * The stand-in authorisation used while the sandbox entitlement is pending.
 * Deterministic, flagged simulated, and carried into the receipt exactly like a
 * real one so the digest and the gate behave identically when it goes live.
 */
export const authoriseDemo = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ pathwayId: z.string() }).parse(d))
  .handler(async ({ data }): Promise<HumanAuthority> => {
    return {
      nullifierHash: demoNullifier(`cqx:${WORLDID_CONFIG.action}:operator`),
      credential: WORLDID_CONFIG.credential,
      verificationLevel: "simulated",
      action: WORLDID_CONFIG.action,
      signal: data.pathwayId,
      verifiedAt: new Date().toISOString(),
      simulated: true,
    };
  });
