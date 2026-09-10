// Committed run records. Produced in the sandbox, served statically.
//
// Nexus jobs cannot be submitted from the app's serverless runtime and cost
// real HQCs, so execution happens offline and the result is committed here.
// Every record carries its engine, backend qualifier, shots, seed and commit.
// A leg stopped by a platform limit is assessed-blocked with the limit named —
// never a silent gap.
import type { PathwayId } from "./pathways";
import { ENVELOPE_SCHEMA, envelopeFor, type ReceiptEnvelope } from "@/lib/receipts";

export const RUN_COMMIT = "d8993ce";

export interface ExecutionSpec {
  builder: "pytket" | "hugr";
  device: string;
  configClass: string;
  shots: number;
  seed: number;
  nQubits: number;
  verification: string;
  /** A spec is a submission contract. It carries no credentials and no result. */
  note: string;
}

export interface RunRecord {
  pathwayId: PathwayId;
  classical: {
    method: string;
    metric: string;
    value: number;
    runtimeMs: number;
  };
  dequantization: {
    surrogate: string;
    reproduced: boolean;
    note: string;
  };
  receipt: ReceiptEnvelope;
  spec: ExecutionSpec;
}

function env(
  partial: Omit<ReceiptEnvelope, "schema" | "envelope"> & { shots: number | null },
): ReceiptEnvelope {
  return {
    schema: ENVELOPE_SCHEMA,
    envelope: partial.shots ? envelopeFor(partial.shots) : null,
    ...partial,
  };
}

export const runs: RunRecord[] = [
  {
    pathwayId: "endo-triage",
    classical: {
      method: "Logistic regression, 5-fold cross-validation",
      metric: "AUROC",
      value: 0.742,
      runtimeMs: 41,
    },
    dequantization: {
      surrogate: "Classical random-feature approximation of the same kernel",
      reproduced: true,
      note: "The classical surrogate reproduces the kernel within error, so no advantage claim survives this gate. Reported either way, as the gate requires.",
    },
    receipt: env({
      claims: [
        "The 14-qubit kernel circuit produced the intended overlap distribution within 4*sqrt(0.5/shots) on the H2 emulator.",
        "The resulting ranking did NOT beat the logistic-regression floor of 0.742 AUROC.",
        "A classical surrogate reproduces the kernel, so the advantage claim dissolves.",
      ],
      engine: "Quantinuum Nexus H2-Emulator",
      backendQualifier: "emulator",
      shots: 2048,
      seed: 20260910,
      commit: RUN_COMMIT,
      measured: 0.0231,
      mechanism: "PASS",
      performance: "LOSS",
      bellAnticorrelated: 0.0039,
      jobId: "nx-emu-endo-2048-a17c",
      device: "H2-Emulator",
      estimatedHqc: 12.4,
      billedHqc: 11.9,
    }),
    spec: {
      builder: "pytket",
      device: "H2-Emulator",
      configClass: "QuantinuumConfig",
      shots: 2048,
      seed: 20260910,
      nQubits: 14,
      verification: "Bell |Phi+> control in the same batch; accept when anti-correlated/shots <= 4*sqrt(0.5/shots).",
      note: "Submission contract only. No credentials, no job id, no result implied by this block.",
    },
  },
  {
    pathwayId: "gynae-backlog",
    classical: {
      method: "Greedy longest-wait-first then 2-opt",
      metric: "Long-waiters cleared",
      value: 31,
      runtimeMs: 8,
    },
    dequantization: {
      surrogate: "Simulated annealing on the same QUBO",
      reproduced: true,
      note: "Annealing reaches the same objective value in 8 ms. The quantum leg adds no measured advantage on this instance.",
    },
    receipt: env({
      claims: [
        "The 24-qubit Ising circuit sampled the intended distribution within envelope on the H2 emulator.",
        "Best-of-N sampling cleared 29 long-waiters against a classical floor of 31 — a loss, and a shot-budget artefact rather than an optimiser.",
      ],
      engine: "Quantinuum Nexus H2-Emulator",
      backendQualifier: "emulator",
      shots: 2048,
      seed: 20260910,
      commit: RUN_COMMIT,
      measured: 0.0288,
      mechanism: "PASS",
      performance: "LOSS",
      bellAnticorrelated: 0.0049,
      jobId: "nx-emu-gynae-2048-6b02",
      device: "H2-Emulator",
      estimatedHqc: 21.0,
      billedHqc: 22.3,
    }),
    spec: {
      builder: "pytket",
      device: "H2-Emulator",
      configClass: "QuantinuumConfig",
      shots: 2048,
      seed: 20260910,
      nQubits: 24,
      verification: "Bell control in-batch; objective re-derived host-side from raw bitstrings.",
      note: "Submission contract only. No credentials, no job id, no result implied by this block.",
    },
  },
  {
    pathwayId: "derm-2ww",
    classical: {
      method: "Gradient-boosted trees, 5-fold cross-validation",
      metric: "AUROC",
      value: 0.781,
      runtimeMs: 210,
    },
    dequantization: {
      surrogate: "Nystrom approximation of the quantum kernel",
      reproduced: true,
      note: "Reproduced within error at 128, 512 and 2048 shots. Flat metric with paired confidence intervals crossing zero: classically equivalent.",
    },
    receipt: env({
      claims: [
        "The 11-qubit feature map produced the intended kernel matrix within envelope.",
        "The quantum kernel scored 0.769 AUROC against a classical floor of 0.781 — a loss.",
      ],
      engine: "Quantinuum Nexus H2-Emulator",
      backendQualifier: "emulator",
      shots: 2048,
      seed: 20260910,
      commit: RUN_COMMIT,
      measured: 0.0198,
      mechanism: "PASS",
      performance: "LOSS",
      bellAnticorrelated: 0.0029,
      jobId: "nx-emu-derm-2048-c3f1",
      device: "H2-Emulator",
      estimatedHqc: 9.6,
      billedHqc: 9.1,
    }),
    spec: {
      builder: "pytket",
      device: "H2-Emulator",
      configClass: "QuantinuumConfig",
      shots: 2048,
      seed: 20260910,
      nQubits: 11,
      verification: "Shot ladder 128/512/2048 with paired confidence intervals; Bell control in-batch.",
      note: "Submission contract only. No credentials, no job id, no result implied by this block.",
    },
  },
  {
    pathwayId: "msk-physio",
    classical: {
      method: "Logistic regression with class weights",
      metric: "AUROC",
      value: 0.688,
      runtimeMs: 33,
    },
    dequantization: {
      surrogate: "Random Fourier features",
      reproduced: true,
      note: "Surrogate matches within error. No advantage claim available on this pathway.",
    },
    receipt: env({
      claims: [
        "The 9-qubit angle-encoded map produced the intended distribution within envelope.",
        "Quantum kernel scored 0.691 AUROC against a floor of 0.688 — inside the paired interval, so a tie, not a win.",
      ],
      engine: "Quantinuum Nexus H2-Emulator",
      backendQualifier: "emulator",
      shots: 2048,
      seed: 20260910,
      commit: RUN_COMMIT,
      measured: 0.0172,
      mechanism: "PASS",
      performance: "TIE",
      bellAnticorrelated: 0.0024,
      jobId: "nx-emu-msk-2048-91de",
      device: "H2-Emulator",
      estimatedHqc: 7.8,
      billedHqc: 7.5,
    }),
    spec: {
      builder: "pytket",
      device: "H2-Emulator",
      configClass: "QuantinuumConfig",
      shots: 2048,
      seed: 20260910,
      nQubits: 9,
      verification: "Bell control in-batch; paired bootstrap against the classical floor.",
      note: "Submission contract only. No credentials, no job id, no result implied by this block.",
    },
  },
  {
    pathwayId: "cardio-echo",
    classical: {
      method: "Seasonal ARIMA",
      metric: "MAPE",
      value: 9.4,
      runtimeMs: 120,
    },
    dequantization: {
      surrogate: "Kernel ridge regression on the same lag windows",
      reproduced: true,
      note: "Surrogate reaches 9.5% MAPE. The quantum kernel is not doing anything the classical one cannot.",
    },
    receipt: env({
      claims: [
        "The 16-qubit lag-window kernel produced the intended distribution within envelope.",
        "Forecast MAPE was 10.1% against a classical floor of 9.4% — a loss.",
      ],
      engine: "Quantinuum Nexus H2-Emulator",
      backendQualifier: "emulator",
      shots: 2048,
      seed: 20260910,
      commit: RUN_COMMIT,
      measured: 0.0255,
      mechanism: "PASS",
      performance: "LOSS",
      bellAnticorrelated: 0.0044,
      jobId: "nx-emu-echo-2048-2a70",
      device: "H2-Emulator",
      estimatedHqc: 14.2,
      billedHqc: 13.8,
    }),
    spec: {
      builder: "pytket",
      device: "H2-Emulator",
      configClass: "QuantinuumConfig",
      shots: 2048,
      seed: 20260910,
      nQubits: 16,
      verification: "Bell control in-batch; model-free curve check alongside the fitted forecast.",
      note: "Submission contract only. No credentials, no job id, no result implied by this block.",
    },
  },
  {
    pathwayId: "endoscopy-slots",
    classical: {
      method: "Integer programme, exact solve",
      metric: "Max site imbalance",
      value: 4,
      runtimeMs: 640,
    },
    dequantization: {
      surrogate: "Not reached",
      reproduced: false,
      note: "The gate was never reached because no quantum lane exists at this width.",
    },
    receipt: env({
      claims: [
        "No quantum measurement exists for this pathway. The 32-qubit register exceeds the account's 26-qubit emulator ceiling.",
      ],
      engine: "Quantinuum Nexus",
      backendQualifier: "not-run",
      shots: null,
      seed: null,
      commit: RUN_COMMIT,
      measured: null,
      mechanism: "BLOCKED",
      performance: "NOT-RUN",
      bellAnticorrelated: null,
      jobId: null,
      device: null,
      estimatedHqc: null,
      billedHqc: null,
      blockedReason:
        "32 qubits required, 26-qubit emulator ceiling on this account. Only a compile-only structural audit lane is available: gate counts, depth and per-qubit idle windows.",
    }),
    spec: {
      builder: "hugr",
      device: "Helios-1E-lite",
      configClass: "HeliosConfig + HeliosEmulatorConfig",
      shots: 2048,
      seed: 20260910,
      nQubits: 32,
      verification: "Would need a device wider than the account ceiling. Not submitted.",
      note: "Submission contract only, and one that cannot currently be executed. Recorded so the blocked leg is legible rather than absent.",
    },
  },
  {
    pathwayId: "mh-capacity",
    classical: {
      method: "Random forest, 5-fold cross-validation",
      metric: "AUROC",
      value: 0.803,
      runtimeMs: 380,
    },
    dequantization: {
      surrogate: "Classical shadow reconstruction of the same observable",
      reproduced: true,
      note: "Reproduced within error. Recorded as a negative closure on this formulation.",
    },
    receipt: env({
      claims: [
        "The 13-qubit parity-window circuit produced the intended readout within envelope.",
        "Quantum kernel scored 0.784 AUROC against a floor of 0.803 — a loss.",
      ],
      engine: "Quantinuum Nexus H2-Emulator",
      backendQualifier: "emulator",
      shots: 2048,
      seed: 20260910,
      commit: RUN_COMMIT,
      measured: 0.0214,
      mechanism: "PASS",
      performance: "LOSS",
      bellAnticorrelated: 0.0034,
      jobId: "nx-emu-mh-2048-77b5",
      device: "H2-Emulator",
      estimatedHqc: 11.1,
      billedHqc: 10.7,
    }),
    spec: {
      builder: "pytket",
      device: "H2-Emulator",
      configClass: "QuantinuumConfig",
      shots: 2048,
      seed: 20260910,
      nQubits: 13,
      verification: "Bell control in-batch; parity-window cadence checked against the compiled circuit.",
      note: "Submission contract only. No credentials, no job id, no result implied by this block.",
    },
  },
];

export function getRun(pathwayId: string): RunRecord | undefined {
  return runs.find((r) => r.pathwayId === pathwayId);
}
