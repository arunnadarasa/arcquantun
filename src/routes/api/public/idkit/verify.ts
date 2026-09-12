import { createFileRoute } from "@tanstack/react-router";

// Server-side verify proxy. The upstream v4 endpoint expects the IDKit proof
// response at the top level, keyed by the RP that signed the request context —
// forwarding the client wrapper returns invalid_proof straight after World App
// reports success.
export const Route = createFileRoute("/api/public/idkit/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rpId = process.env["WORLDID_RP_ID"];
        let body: { app_id?: string; idkitResponse?: unknown };
        try {
          body = (await request.json()) as { app_id?: string; idkitResponse?: unknown };
        } catch {
          return Response.json(
            { verified: false, code: "bad_body", detail: "Invalid JSON" },
            { status: 400 },
          );
        }

        const appId = body.app_id;
        if (!rpId && !appId) {
          return Response.json(
            {
              verified: false,
              code: "no_app_id",
              detail: "WORLDID_RP_ID is not configured and app_id is missing from the body.",
            },
            { status: 400 },
          );
        }
        if (!body.idkitResponse || typeof body.idkitResponse !== "object") {
          return Response.json(
            { verified: false, code: "no_proof", detail: "idkitResponse proof missing from body" },
            { status: 400 },
          );
        }

        const headers = {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "clinical-quantum-exchange/1.0 (+https://arcquantum.lovable.app)",
        };

        async function post(id: string) {
          const res = await fetch(`https://developer.world.org/api/v4/verify/${id}`, {
            method: "POST",
            headers,
            body: JSON.stringify(body.idkitResponse),
          });
          const text = await res.text();
          let parsed: unknown = null;
          try {
            parsed = JSON.parse(text);
          } catch {
            /* upstream returned non-JSON */
          }
          return { res, text, parsed, contentType: res.headers.get("content-type") ?? "" };
        }

        let verifyIdSource = rpId ? "rp_id" : "app_id";
        let out = await post(rpId || appId!);
        let fallbackTried = false;
        // A non-JSON 403 from the World edge on the RP path is a transport
        // problem, not a rejected proof: retry once against the app id.
        if (
          rpId &&
          appId &&
          out.res.status === 403 &&
          !out.contentType.includes("application/json")
        ) {
          fallbackTried = true;
          verifyIdSource = "app_id";
          out = await post(appId);
        }

        const debug = {
          upstreamStatus: out.res.status,
          upstreamContentType: out.contentType,
          verifyIdSource,
          fallbackTried,
        };

        if (!out.res.ok) {
          const err = (out.parsed ?? {}) as { code?: string; detail?: string };
          return Response.json(
            {
              verified: false,
              code: err.code ?? `http_${out.res.status}`,
              detail: err.detail ?? out.text.slice(0, 300),
              debug,
            },
            { status: out.res.status },
          );
        }
        const parsed = out.parsed;
        if (
          parsed &&
          typeof parsed === "object" &&
          (("success" in parsed && parsed.success === false) ||
            ("verified" in parsed && parsed.verified === false))
        ) {
          const err = parsed as { code?: string; detail?: string; message?: string };
          return Response.json(
            {
              verified: false,
              code: err.code ?? "verification_failed",
              detail: err.detail ?? err.message ?? "World rejected the proof.",
              worldcoin: parsed,
              debug,
            },
            { status: 400 },
          );
        }
        return Response.json({ verified: true, worldcoin: parsed, debug });
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
