#!/usr/bin/env node
// Local Ledger signer bridge for the Clinical Quantum Exchange.
//
// The app runs in an edge worker that cannot talk to USB, so the device is
// driven by this small process on your own machine and the browser talks to
// it over loopback. It exposes exactly three things:
//
//   GET  /device         connected Ethereum address + app status
//   POST /approve        personal_sign a release payload on the device
//   POST /ring/encrypt   Key Ring (LKRP) encrypt  — wallet-cli ring
//   POST /ring/decrypt   Key Ring (LKRP) decrypt  — wallet-cli ring
//
// It binds to 127.0.0.1, checks the Origin header against an allow-list, and
// holds no long-lived state. Run it next to the app:
//
//   cd scripts/ledger && npm install && npm start
//
// Transport:
//   LEDGER_TRANSPORT=hid       (default) physical Ledger over USB
//   LEDGER_TRANSPORT=speculos  Ledger's Speculos emulator over TCP — the same
//                              Ethereum app binary and the same APDU flow,
//                              reported as an emulated device. Start it with
//                              ./speculos.sh (APDU port 9999). The Key Ring
//                              endpoints always use the real device/CLI.
//
// Setup (once): `npm i -g @ledgerhq/wallet-cli && wallet-cli ring init`
// with WALLET_PASS injected from your OS keychain — never typed inline.

import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
// The ESM wrapper over the CJS build nests the class one level deep
// (exports.default = Eth). Resolve all shapes so both node and bun work.
const AppEthMod = await import("@ledgerhq/hw-app-eth");
const AppEth =
  AppEthMod.default?.default ??
  (typeof AppEthMod.default === "function" ? AppEthMod.default : null) ??
  AppEthMod.AppEth;

const execFileAsync = promisify(execFile);

const PORT = Number(process.env["LEDGER_BRIDGE_PORT"] ?? 8943);
const DERIVATION_PATH = process.env["LEDGER_SIGNER_PATH"] ?? "44'/60'/0'/0/0";

const TRANSPORT =
  process.env["LEDGER_TRANSPORT"] === "speculos" ? "speculos" : "hid";
const SPECULOS_HOST = process.env["LEDGER_SPECULOS_HOST"] ?? "127.0.0.1";
const SPECULOS_APDU_PORT = Number(process.env["LEDGER_SPECULOS_PORT"] ?? 9999);
const QUALIFIER = TRANSPORT === "speculos" ? "emulator" : "device";

const ALLOWED_ORIGINS = new Set(
  [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "https://id-preview--9306ea96-b091-4e2f-a363-fa86dc81cbf5.lovable.app",
    "https://arcquantum.lovable.app",
    ...(process.env["LEDGER_BRIDGE_ALLOWED_ORIGINS"] ?? "").split(",").filter(Boolean),
  ],
  // A curl or server-side caller sends no Origin at all; that is fine for GET.
);

function cors(res, origin) {
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

// Transports load lazily: an emulator-only machine never needs the native HID
// module, and a device-only machine never opens a TCP socket.
async function openTransport() {
  if (TRANSPORT === "speculos") {
    const { default: SpeculosTransport } = await import(
      "@ledgerhq/hw-transport-node-speculos"
    );
    return SpeculosTransport.open({
      apduPort: SPECULOS_APDU_PORT,
      host: SPECULOS_HOST,
    });
  }
  const { default: TransportNodeHid } = await import(
    "@ledgerhq/hw-transport-node-hid"
  );
  return TransportNodeHid.open("");
}

async function withDevice(fn) {
  const transport = await openTransport();
  try {
    return await fn(new AppEth(transport));
  } finally {
    await transport.close();
  }
}

async function deviceInfo() {
  return withDevice(async (eth) => {
    const { address } = await eth.getAddress(DERIVATION_PATH, false);
    return {
      connected: true,
      address,
      path: DERIVATION_PATH,
      app: "Ethereum",
      transport: TRANSPORT,
      qualifier: QUALIFIER,
      emulated: TRANSPORT === "speculos",
    };
  });
}

async function signPersonal(message) {
  return withDevice(async (eth) => {
    const { address } = await eth.getAddress(DERIVATION_PATH, true); // shown on screen
    const hex = Buffer.from(message, "utf8").toString("hex");
    const sig = await eth.signPersonalMessage(DERIVATION_PATH, hex);
    const r = sig.r.padStart(64, "0");
    const s = sig.s.padStart(64, "0");
    const v = (sig.v & 0xff).toString(16).padStart(2, "0");
    return {
      address,
      signature: `0x${r}${s}${v}`,
      transport: TRANSPORT,
      qualifier: QUALIFIER,
emulated: TRANSPORT === "speculos",
    };
  });
}

async function ring(mode, { file, key, stdin }) {
  if (!file || !key) throw new Error("ring needs both file and key");
  const args = ["ring", mode, "--key", key];
  if (stdin) args.push(mode === "encrypt" ? "-i" : "-o", "-");
  const env = { ...process.env };
  // The ring password must arrive via the environment, never a command line.
  if (process.env["WALLET_PASS"]) env.WALLET_PASS = process.env["WALLET_PASS"];
  const { stdout } = await execFileAsync("wallet-cli", args, {
    env,
    maxBuffer: 16 * 1024 * 1024,
    input: stdin,
  });
  return { output: stdout };
}

const server = createServer(async (req, res) => {
  const origin = req.headers["origin"];
  cors(res, origin);

  if (req.method === "OPTIONS") {
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return json(res, 403, { error: `Origin not allowed: ${origin}` });
    }
    res.end();
    return;
  }

  if (!origin && req.method === "POST") {
    return json(res, 403, { error: "Browser callers must present an Origin." });
  }

  try {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (req.method === "GET" && url.pathname === "/device") {
      return json(res, 200, await deviceInfo());
    }
    if (req.method === "POST" && url.pathname === "/approve") {
      const body = await readBody(req);
      if (!body?.message || typeof body.message !== "string") {
        return json(res, 400, { error: "message required" });
      }
      return json(res, 200, await signPersonal(body.message));
    }
    if (req.method === "POST" && url.pathname.startsWith("/ring/")) {
      const mode = url.pathname.endsWith("/encrypt") ? "encrypt" : "decrypt";
      const body = await readBody(req);
      return json(res, 200, await ring(mode, body ?? {}));
    }
    return json(res, 404, { error: "not found" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Device refused / locked shows up here; surface it verbatim, no retry.
    return json(res, 502, { error: msg });
  }
});

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 1_000_000) reject(new Error("body too large"));
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : null);
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

server.listen(PORT, "127.0.0.1", () => {
  const mode =
    TRANSPORT === "speculos"
      ? `Speculos emulator at ${SPECULOS_HOST}:${SPECULOS_APDU_PORT} (emulated device)`
      : "physical Ledger over USB";
  console.log(
    `Ledger signer bridge on http://127.0.0.1:${PORT} (path ${DERIVATION_PATH}, ${mode})`,
  );
});
