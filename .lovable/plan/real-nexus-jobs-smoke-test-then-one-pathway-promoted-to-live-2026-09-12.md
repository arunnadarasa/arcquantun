# Real Nexus jobs: smoke test, then one pathway promoted to live

Today every quantum leg in the app is a committed offline run — honest, but the
Nexus lane is described rather than exercised. This connects it for real:
a tiny control job first, then one pathway's quantum leg re-run as an actual
Quantinuum Nexus job on the H2 emulator, with its real job id, shot count and
billed cost carried into the receipt the agents get paid against.

Nothing here claims hardware. H2-Emulator is an emulator, labelled as one
everywhere, and the app will keep saying so.

## Step 1 — Sign in and keep the session

You chose a saved refresh token, which survives sandbox resets. The easiest way
to mint one is for me to start the device login here: I print a six-character
code and a link, you approve it in your browser, and I then save the resulting
refresh token as a project secret (`QNEXUS_TOKEN`) so later runs re-authenticate
without you clicking anything.

If you would rather not have the token pass through this session, you can run
the login on your own machine and paste the token into a secure form instead —
say so and I will request it that way.

Sign-in is verified by name, not by absence of errors: the run prints which
Nexus account it is logged in as before anything is submitted.

## Step 2 — Smoke test on H2-Emulator

A two-qubit Bell pair, 128 shots. Small, cheap, and it exercises every step of
the real path: upload the circuit, compile it for the backend, execute the
compiled reference, download the result, decode the bitstrings.

Before submitting, four pre-flight checks, each of which fails loudly rather
than being debugged after the bill:

- the Nexus session resolves to a named account
- H2-Emulator is in the account's device list, with its width read from the
  device record rather than assumed
- the config family is right for the H-series lane
- a hard cost ceiling is attached to the job

The test passes when the Bell pair's anti-correlated fraction sits inside
`4*sqrt(0.5/shots)`. If it fails, that is the answer and it gets published as a
failure — not retried until it agrees.

## Step 3 — Promote one pathway to a live job

`msk-physio` (did-not-attend risk) — 9 qubits, the narrowest lane on the board,
well inside the emulator ceiling and the cheapest honest promotion. Its
classical floor (0.688 AUROC, balanced-weight logistic regression) and its
pre-registered bar were both committed before any of this, so the ordering the
claim discipline requires is already intact and stays intact.

The live run:

- the same circuit, 2048 shots, the committed seed, with a Bell control in the
  same batch so the control shares the job's noise
- job properties stamped at submission — pathway, shots, seed, qubit width —
  so the job is re-findable and re-decodable months later
- the metric re-derived host-side from raw bitstrings, then compared against the
  committed classical floor
- two separate verdicts recorded: did the mechanism work, and did it beat the
  floor. The second never inherits the first's pass.

The receipt then carries a real `jobId`, the real device, the real shot count
and the billed cost from Nexus rather than an estimate. If the job errors, runs
out of allowance, or the width check refuses it, the pathway publishes as
`assessed-blocked` with the reason named. It will never quietly fall back to the
committed number and present it as live.

## Step 4 — Show which runs are live and which are committed

Every pathway receipt gains an execution provenance marker: `live-nexus` with
its job id and run date, or `committed-offline` as today. The Evidence page, the
run panel and the deck's "what is real" slide read from that marker, so one
pathway showing a real job never implies the other six did.

The Nexus Agent's payment for that pathway is then a payment for work that
actually ran on Quantinuum's emulator, settled in USDC on Arc against a receipt
whose job id anyone can look up in Nexus.

## Cost control

- Emulator only. No hardware device is reachable from this path, by design.
- A per-job cost ceiling on every submission, plus a total budget for the
  session; the run refuses the next job rather than exceeding it.
- Job references are written to disk the moment Nexus accepts them, so a
  sandbox reset re-attaches to paid work instead of buying it twice.
- Expected spend: a few HQC for the smoke test, a modest amount for the 2048-shot
  pathway run. I will report the estimate before the pathway job and the billed
  figure after it.

## Technical notes

- Python deps vendored to `.pydeps` (git-ignored): `qnexus` pinned, plus
  `guppylang` (qnexus imports `selene_core`) and `pytket`.
- `scripts/quantum/nexus_smoke.py` and `scripts/quantum/nexus_run_pathway.py`;
  both read `QNEXUS_TOKEN` from the environment and never log it.
- Flow per job: `circuits.upload` → `start_compile_job(optimisation_level=2)` →
  execute the **compiled** ref with `n_shots` and `max_cost` →
  `wait_for(..., HybridStrategy)` → `download_result().get_empirical_distribution()`.
  Distribution keys are int tuples indexed by qubit, so an X-probe calibration
  runs before any bitstring is interpreted.
- Results land in `src/data/nexus-live.json`, consumed by `src/data/runs.ts`;
  the app stays a static read, since the serverless runtime cannot submit jobs.
- `src/lib/receipts.ts` gains `execution: "live-nexus" | "committed-offline"`
  with the job id and executed-at timestamp.

## What I will report back

The Nexus account name, the smoke-test job id and its Bell control figure, the
pathway job id, its two verdicts, and the billed HQC — plus a direct statement
of anything that blocked.
