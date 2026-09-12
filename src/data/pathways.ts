// NHS waiting-list pathways posed as clinical questions, written before any
// method was chosen. Each carries the classical floor recorded FIRST and the
// USDC budget the Trust Agent holds for the assessment.
//
// Framing rule: these are capacity, cost and patient-experience questions.
// Nothing here claims diagnosis, efficacy or patient-outcome improvement.
//
// Floor rule (added after a kernel "win" was found to have been measured against
// an unpowered baseline): the floor is a FAMILY, not a number. Plain, balanced,
// resampled and tuned members are all run, and the best of them is the bar. A
// comparison against a single unpowered member can never read as a win.
//
// Fitness rule: before any budget is committed, the cohort gets a classical
// ceiling sweep — the best recall any method reaches as the sample size grows to
// a large oracle fit. If that ceiling sits under the bar, the signal is weak
// rather than the data scarce, and the pathway is unfit-cohort. Nothing is spent.

export type PathwayId =
  | "endo-triage"
  | "gynae-backlog"
  | "derm-2ww"
  | "msk-physio"
  | "cardio-echo"
  | "endoscopy-slots"
  | "mh-capacity"
  | "rare-subgroup";

/** One member of the classical family the floor is drawn from. */
export interface FloorMember {
  method: string;
  value: number;
  /** False means the off-the-shelf turn was never applied — a straw man, not a floor. */
  powered: boolean;
}

/** The classical ceiling sweep run before any quantum budget is released. */
export interface CohortCeiling {
  bar: string;
  /** Best result any method reached at the largest sample size tried. */
  oracle: number;
  oracleN: number;
  note: string;
}

export interface Pathway {
  id: PathwayId;
  service: string;
  question: string;
  whyItMatters: string;
  cohort: string;
  classicalFloor: {
    method: string;
    metric: string;
    value: number;
    unit: string;
    /** Every member tested. The bar is the best of these, never the weakest. */
    family: FloorMember[];
  };
  formulation: string;
  qubitsNeeded: number;
  budgetMinor: number; // USDC minor units the Trust Agent holds
  status: "queued" | "assessed" | "assessed-blocked" | "unfit-cohort";
  blockedReason?: string;
  ceiling?: CohortCeiling;
}

export const pathways: Pathway[] = [
  {
    id: "endo-triage",
    service: "Gynaecology — suspected endometriosis",
    question:
      "Of the referrals waiting for a first gynaecology appointment, which ones should a clinician read first?",
    whyItMatters:
      "The average wait from first symptom to diagnosis is measured in years. Ordering the list better does not shorten the list, but it changes who waits longest.",
    cohort: "Synthetic referral cohort, 512 records, 14 features",
    classicalFloor: {
      method: "Logistic regression, 5-fold cross-validation",
      metric: "AUROC",
      value: 0.742,
      unit: "",
      family: [
        { method: "Logistic regression, plain", value: 0.701, powered: true },
        { method: "Logistic regression, balanced class weights", value: 0.742, powered: true },
        { method: "Tuned RBF kernel, 5-fold grid", value: 0.738, powered: true },
      ],
    },
    formulation: "Binary ranking over a fixed feature vector; kernel similarity between referrals",
    qubitsNeeded: 14,
    budgetMinor: 250_000,
    status: "assessed",
  },
  {
    id: "gynae-backlog",
    service: "Gynaecology — theatre list sequencing",
    question:
      "Given the theatre slots available next month, which ordering of the waiting list clears the most long-waiters?",
    whyItMatters:
      "Sequencing is a scheduling problem the service already solves by hand. A better ordering is capacity, not treatment.",
    cohort: "Synthetic list, 40 patients, 12 slots, 3 constraints",
    classicalFloor: {
      method: "Greedy longest-wait-first, then 2-opt local search",
      metric: "Long-waiters cleared",
      value: 31,
      unit: "of 40",
      family: [
        { method: "Greedy longest-wait-first", value: 27, powered: true },
        { method: "Greedy then 2-opt local search", value: 31, powered: true },
        { method: "Simulated annealing, 8 ms budget", value: 31, powered: true },
      ],
    },
    formulation: "QUBO over slot assignment with capacity and urgency penalties",
    qubitsNeeded: 24,
    budgetMinor: 300_000,
    status: "assessed",
  },
  {
    id: "derm-2ww",
    service: "Dermatology — two-week-wait referrals",
    question:
      "Which two-week-wait skin referrals carry features that most often turn out to need urgent review?",
    whyItMatters:
      "Two-week-wait pathways are volume-driven. Ranking supports the clinician's review; it never replaces it.",
    cohort: "Synthetic referral cohort, 320 records, 11 features",
    classicalFloor: {
      method: "Gradient-boosted trees, 5-fold cross-validation",
      metric: "AUROC",
      value: 0.781,
      unit: "",
      family: [
        { method: "Logistic regression, balanced", value: 0.744, powered: true },
        { method: "Gradient-boosted trees, tuned", value: 0.781, powered: true },
        { method: "Resampled (SMOTE) + RBF kernel", value: 0.769, powered: true },
      ],
    },
    formulation: "Kernel classification with a quantum feature map on 11 features",
    qubitsNeeded: 11,
    budgetMinor: 200_000,
    status: "assessed",
  },
  {
    id: "msk-physio",
    service: "MSK physiotherapy — did-not-attend risk",
    question:
      "Which booked physiotherapy appointments are most likely to go unused, so the slot can be offered again?",
    whyItMatters:
      "An unused slot is capacity lost. Reoffering it is an administrative action, not a clinical one.",
    cohort: "Synthetic booking cohort, 900 records, 9 features",
    classicalFloor: {
      method: "Logistic regression with class weights",
      metric: "AUROC",
      value: 0.688,
      unit: "",
      family: [
        { method: "Logistic regression, plain", value: 0.612, powered: false },
        { method: "Logistic regression with class weights", value: 0.688, powered: true },
        { method: "Resampled (SMOTE) + RBF kernel", value: 0.674, powered: true },
      ],
    },
    formulation: "Kernel classification with an angle-encoded feature map",
    qubitsNeeded: 9,
    budgetMinor: 180_000,
    status: "assessed",
  },
  {
    id: "cardio-echo",
    service: "Cardiology — echocardiogram demand",
    question:
      "How many echocardiogram slots will the service need each week over the next quarter?",
    whyItMatters: "Forecast error is staffing cost and patient wait, nothing more.",
    cohort: "Synthetic weekly demand series, 156 weeks",
    classicalFloor: {
      method: "Seasonal ARIMA",
      metric: "MAPE",
      value: 9.4,
      unit: "%",
      family: [
        { method: "Seasonal naive", value: 14.8, powered: true },
        { method: "Seasonal ARIMA", value: 9.4, powered: true },
        { method: "Kernel ridge on lag windows", value: 9.5, powered: true },
      ],
    },
    formulation: "Time-series kernel over lagged windows, 16-qubit register",
    qubitsNeeded: 16,
    budgetMinor: 220_000,
    status: "assessed",
  },
  {
    id: "endoscopy-slots",
    service: "Endoscopy — multi-site slot allocation",
    question:
      "Across four sites, how should endoscopy slots be allocated so no site holds a disproportionate backlog?",
    whyItMatters:
      "Balancing a backlog across sites is an operational fairness question with a measurable answer.",
    cohort: "Synthetic multi-site demand, 4 sites, 60 slots",
    classicalFloor: {
      method: "Integer programme, exact solve",
      metric: "Max site imbalance",
      value: 4,
      unit: "patients",
      family: [
        { method: "Proportional allocation", value: 11, powered: true },
        { method: "Integer programme, exact solve", value: 4, powered: true },
      ],
    },
    formulation: "Ising model over site-slot assignment, 32-qubit register",
    qubitsNeeded: 32,
    budgetMinor: 260_000,
    status: "assessed-blocked",
    blockedReason:
      "Needs a 32-qubit register. The account's emulator ceiling is 26 qubits, so no execution lane exists. Published as assessed-blocked with the limit named; a compile-only structural audit is the only lane available.",
  },
  {
    id: "mh-capacity",
    service: "Mental health — talking-therapy access",
    question:
      "Which referrals to talking therapies are waiting past the access standard, and what is driving it?",
    whyItMatters:
      "Access standards are a service commitment. Measuring who misses them is reporting, not diagnosis.",
    cohort: "Synthetic referral cohort, 640 records, 13 features",
    classicalFloor: {
      method: "Random forest, 5-fold cross-validation",
      metric: "AUROC",
      value: 0.803,
      unit: "",
      family: [
        { method: "Logistic regression, balanced", value: 0.751, powered: true },
        { method: "Random forest, tuned", value: 0.803, powered: true },
        { method: "Tuned RBF kernel", value: 0.788, powered: true },
      ],
    },
    formulation: "Kernel classification on 13 features with parity-window readout",
    qubitsNeeded: 13,
    budgetMinor: 210_000,
    status: "assessed",
  },
  {
    id: "rare-subgroup",
    service: "Multimodal triage — rare presenting subgroup",
    question:
      "In a mixed symptom, genomic and imaging record set, can the small subgroup that needs a different waiting-list route be picked out at all?",
    whyItMatters:
      "If the subgroup cannot be separated by any method, no amount of compute makes the list fairer. Knowing that early is what stops the money.",
    cohort: "Synthetic multimodal cohort, 8 / 12 / 10 dimensions, 8% minority",
    classicalFloor: {
      method: "Best of the powered classical family",
      metric: "Minority recall",
      value: 0.76,
      unit: "",
      family: [
        { method: "Linear SVM, plain", value: 0.0, powered: false },
        { method: "Linear SVM, balanced class weights", value: 0.76, powered: true },
        { method: "Resampled (SMOTE) + RBF kernel", value: 0.3, powered: true },
        { method: "Tuned RBF kernel", value: 0.26, powered: true },
      ],
    },
    formulation: "Quantum kernel over the fused multimodal vector, 11-qubit register",
    qubitsNeeded: 11,
    budgetMinor: 240_000,
    status: "unfit-cohort",
    ceiling: {
      bar: "0.80 minority recall on held-out records",
      oracle: 0.4,
      oracleN: 20_000,
      note: "Sample sizes from 320 to 10,240 were swept, then a 20,000-record oracle fit as an upper bound on what any classifier could recover. The ceiling reached 0.40 recall — below the bar, and below the balanced floor at 320 records. The signal is weak, not the data scarce. 'More data' is falsified; the cohort is not fit for a quantum receipt at any size, so no quantum budget was released.",
    },
  },
];

export function getPathway(id: string): Pathway | undefined {
  return pathways.find((p) => p.id === id);
}

/** The bar a performance verdict has to clear: the best POWERED member, never the weakest. */
export function poweredFloor(p: Pathway): FloorMember | undefined {
  const powered = p.classicalFloor.family.filter((m) => m.powered);
  if (powered.length === 0) return undefined;
  // Lower is better for error-style metrics; the unit tells us which way is up.
  const lowerIsBetter = p.classicalFloor.unit === "%" || p.classicalFloor.metric.startsWith("Max");
  return powered.reduce((best, m) =>
    lowerIsBetter ? (m.value < best.value ? m : best) : m.value > best.value ? m : best,
  );
}
