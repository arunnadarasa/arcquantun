import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/circle-debug")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const path = url.searchParams.get("path") ?? "/transactions?pageSize=5";
        const res = await fetch(`https://api.circle.com/v1/w3s${path}`, {
          headers: {
            authorization: `Bearer ${process.env["CIRCLE_API_KEY"] ?? ""}`,
            accept: "application/json",
          },
        });
        const body = await res.text();
        return new Response(`${res.status}\n${body}`, {
          headers: { "content-type": "text/plain" },
        });
      },
    },
  },
});
