import { createFileRoute } from "@tanstack/react-router";
import { signRequest } from "@worldcoin/idkit-core/signing";

// Public prefix: World App and the IDKit bridge must reach this without the
// published-site auth gate. It returns a short-lived signed request context and
// never exposes the signing key itself.
export const Route = createFileRoute("/api/public/idkit/rp-signature")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rpId = process.env["WORLDID_RP_ID"];
        const signingKey = process.env["WORLDID_RP_SIGNING_KEY"];
        if (!rpId || !signingKey) {
          return Response.json(
            {
              code: "no_rp_config",
              detail:
                "WORLDID_RP_ID and WORLDID_RP_SIGNING_KEY are not set; the human gate runs in simulated mode.",
            },
            { status: 500 },
          );
        }

        let body: { action?: string };
        try {
          body = (await request.json()) as { action?: string };
        } catch {
          return Response.json({ code: "bad_body", detail: "Invalid JSON" }, { status: 400 });
        }

        const action = typeof body.action === "string" ? body.action : "";
        if (!action) {
          return Response.json({ code: "no_action", detail: "action is required" }, { status: 400 });
        }

        try {
          const sig = signRequest({ signingKeyHex: signingKey, action, ttl: 300 });
          return Response.json({
            rp_id: rpId,
            nonce: sig.nonce,
            created_at: sig.createdAt,
            expires_at: sig.expiresAt,
            signature: sig.sig,
          });
        } catch (e) {
          return Response.json(
            { code: "sign_failed", detail: e instanceof Error ? e.message : String(e) },
            { status: 500 },
          );
        }
      },
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }),
    },
  },
});
