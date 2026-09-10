// NHS waiting-list pathways posed as clinical questions, written before any
// method was chosen. Each carries the classical floor recorded FIRST and the
// USDC budget the Trust Agent holds for the assessment.
//
// Framing rule: these are capacity, cost and patient-experience questions.
// Nothing here claims diagnosis, efficacy or patient-outcome improvement.

export type PathwayId =
  | "endo-triage"
  | "gynae-backlog"
  | "derm-2ww"
  | "msk-physio"
  | "cardio-echo"
  | "endoscopy-slots"
  | "mh-capacity";

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
  };
  formulation: string;
  qubitsNeeded: number;
  budgetMinor: number; // USDC minor units the Trust Agent holds
  status: "queued" | "assessed" | "assessed-blocked";
  blockedReason?: string;
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
    },
    formulation: "Kernel classification on 13 features with parity-window readout",
    qubitsNeeded: 13,
    budgetMinor: 210_000,
    status: "assessed",
  },
];

export function getPathway(id: string): Pathway | undefined {
  return pathways.find((p) => p.id === id);
}
