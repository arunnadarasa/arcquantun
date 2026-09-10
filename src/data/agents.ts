// The four agents in the exchange. Each holds a Circle developer-controlled
// wallet on Arc Testnet. Policy caps are enforced before any transfer.

export type AgentId = "trust" | "baseline" | "nexus" | "registry";

export interface Agent {
  id: AgentId;
  name: string;
  role: string;
  decisionLogic: string;
  /** Per-job ceiling, USDC minor units. */
  maxTicketMinor: number;
  /** Rolling 24h ceiling, USDC minor units. */
  dailyCapMinor: number;
  /** Share of a pathway budget this agent earns per completed job, 0-1. */
  feeShare: number;
}

export const agents: Agent[] = [
  {
    id: "trust",
    name: "Trust Agent",
    role: "Holds the pathway budget, posts jobs, releases payment",
    decisionLogic:
      "Releases funds only when a receipt carries engine, backend qualifier, shots, seed and verdict. A receipt missing any field is graded GAP and pays nothing.",
    maxTicketMinor: 500_000,
    dailyCapMinor: 5_000_000,
    feeShare: 0,
  },
  {
    id: "baseline",
    name: "Baseline Agent",
    role: "Runs the classical floor and the dequantization gate — always first",
    decisionLogic:
      "Computes the classical result before any quantum work exists, then tests whether a classical surrogate reproduces the quantum distribution. If it does, the advantage claim dissolves and the agent says so.",
    maxTicketMinor: 120_000,
    dailyCapMinor: 1_200_000,
    feeShare: 0.3,
  },
  {
    id: "nexus",
    name: "Nexus Agent",
    role: "Submits circuits to Quantinuum Nexus and returns a graded receipt",
    decisionLogic:
      "Refuses a job whose register is wider than the account's emulator ceiling and returns assessed-blocked instead of a number. Books its spend estimate at submission, not at result.",
    maxTicketMinor: 150_000,
    dailyCapMinor: 1_500_000,
    feeShare: 0.55,
  },
  {
    id: "registry",
    name: "Registry Agent",
    role: "Anchors the receipt hash on Arc and serves the settlement ledger",
    decisionLogic:
      "Writes keccak256 of the receipt to the anchoring contract before payment clears. An unanchored receipt is not payable.",
    maxTicketMinor: 40_000,
    dailyCapMinor: 400_000,
    feeShare: 0.15,
  },
];

export function getAgent(id: AgentId): Agent {
  const a = agents.find((x) => x.id === id);
  if (!a) throw new Error(`Unknown agent ${id}`);
  return a;
}
