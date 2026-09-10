// Agent settlement policy gate. Mirrors the on-chain policy shape:
// per-agent max_ticket_minor and daily_cap_minor, checked BEFORE any transfer.
import { getAgent, type AgentId } from "@/data/agents";

export interface PolicyCheck {
  agentId: AgentId;
  amountMinor: number;
  allowed: boolean;
  reason: string;
  maxTicketMinor: number;
  dailyCapMinor: number;
  spentTodayMinor: number;
}

export function checkPolicy(
  agentId: AgentId,
  amountMinor: number,
  spentTodayMinor: number,
): PolicyCheck {
  const a = getAgent(agentId);
  const base = {
    agentId,
    amountMinor,
    maxTicketMinor: a.maxTicketMinor,
    dailyCapMinor: a.dailyCapMinor,
    spentTodayMinor,
  };
  if (amountMinor <= 0) {
    return { ...base, allowed: false, reason: "Zero-value ticket refused." };
  }
  if (amountMinor > a.maxTicketMinor) {
    return {
      ...base,
      allowed: false,
      reason: `Ticket exceeds this agent's per-job ceiling.`,
    };
  }
  if (spentTodayMinor + amountMinor > a.dailyCapMinor) {
    return { ...base, allowed: false, reason: `Would breach the 24-hour cap.` };
  }
  return { ...base, allowed: true, reason: "Within per-job and 24-hour caps." };
}
