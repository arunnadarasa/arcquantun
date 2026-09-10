# Nexus execution

## Why the results are committed, not live

Quantinuum Nexus jobs cost real HQCs and cannot be submitted from the app's
serverless runtime. Execution happens offline; the result is committed to
`src/data/runs.ts` under a named source commit and served statically. Every
committed record carries its engine, backend qualifier, device, config class,
shots, seed and qubit count, so a reader can re-derive the verdict without
trusting the app.

## The execution specification

A spec is a submission contract, not a result. It carries no credentials and no
measured value:

```ts
interface ExecutionSpec {
  builder: "pytket" | "hugr";
  device: string;
  configClass: string;
  shots: number;
  seed: number;
  nQubits: number;
  verification: string;
  note: string;
}
```

The spec is committed **before** the run. That is what makes the later receipt
checkable: the shot count and seed were fixed in advance, so the tolerance
`4*sqrt(0.5/shots)` was fixed in advance too.

## The qubit ceiling

The account's emulator ceiling is 26 qubits. A pathway whose register is wider
is refused by the Nexus Agent at submission time and returns `assessed-blocked`
with the ceiling named — never a number produced by quietly shrinking the
problem. Endoscopy at 32 qubits is the standing example.

## What a live `qnexus` submission would add

Not implemented today. It would need:

- A Nexus authentication token held as a server secret, never in the browser
- A server route that submits, polls and returns the job id and billed HQCs
- A spend guard that books the estimated HQC cost at submission, not at result
- The same receipt envelope on the way back, graded by the same rules

Until that exists, the honest description is: committed specifications, executed
offline, graded on their published envelopes. Nothing in the UI implies a live
submission is happening.
