// Server functions for the ENS identity lane. Client-safe module path; the
// chain reads live in ens.server.ts and are imported inside handlers only.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { agents } from "@/data/agents";
import type { IdentityCheck } from "@/lib/ens-namespace";

export const getIdentityStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { ensConfigured, checkAgentIdentity } = await import("@/lib/ens.server");
  const checks: IdentityCheck[] = [];
  for (const a of agents) {
    checks.push(await checkAgentIdentity(a.id));
  }
  return { configured: ensConfigured(), checks };
});

export const resolveName = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ name: z.string().min(3).max(255) }).parse(d))
  .handler(async ({ data }) => {
    const { resolveAnyName } = await import("@/lib/ens.server");
    return resolveAnyName(data.name);
  });
