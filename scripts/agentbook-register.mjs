#!/usr/bin/env node
/**
 * Register the exchange agents in World AgentBook.
 *
 * Blocked until the World Sandbox entitlement for this app is approved. Run it
 * then; it writes the returned entries back into src/data/agentbook.json so the
 * app shows real registrations instead of pending ones. It never invents an
 * entry: if the API does not return one, the agent stays pending.
 *
 *   WORLD_AGENTKIT_API_KEY=... node scripts/agentbook-register.mjs
 */
import { readFile, writeFile } from "node:fs/promises";

const DATA = new URL("../src/data/agentbook.json", import.meta.url);
const API = process.env.WORLD_AGENTKIT_URL ?? "https://developer.world.org/api/v1/agentbook/agents";
const key = process.env.WORLD_AGENTKIT_API_KEY;

if (!key) {
  console.error("WORLD_AGENTKIT_API_KEY is not set. Sandbox access is required first.");
  process.exit(1);
}

const book = JSON.parse(await readFile(DATA, "utf8"));
let changed = 0;

for (const agent of book.agents) {
  if (agent.entry) {
    console.log(`skip ${agent.handle} — already registered`);
    continue;
  }
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      handle: agent.handle,
      display_name: agent.displayName ?? agent.handle,
      description: agent.description,
      human_backed: agent.humanBacked,
      metadata: { ens: agent.ensName, intents: agent.intents },
    }),
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    console.error(`${agent.handle}: non-JSON ${res.status} response`, text.slice(0, 200));
    continue;
  }
  if (!res.ok) {
    console.error(`${agent.handle}: ${res.status}`, body);
    continue;
  }
  agent.entry = body.id ?? body.agent_id ?? body.handle ?? null;
  if (agent.entry) {
    changed += 1;
    console.log(`registered ${agent.handle} -> ${agent.entry}`);
  }
}

if (changed > 0) {
  book.registered = book.agents.every((a) => a.entry !== null);
  if (book.registered) book.pendingReason = null;
  book.registeredAt = new Date().toISOString();
  await writeFile(DATA, `${JSON.stringify(book, null, 2)}\n`);
  console.log(`wrote ${changed} entr${changed === 1 ? "y" : "ies"} to src/data/agentbook.json`);
} else {
  console.log("no changes written");
}
