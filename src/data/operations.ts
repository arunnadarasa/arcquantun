// How the agents were actually operated during the build. These learnings come
// from running a Hermes agent with persistent memory and scheduled jobs, driven
// from a Telegram channel on mobile. Written once here, read by the
// architecture page, the evidence page and the deck, so the wording cannot drift.

export interface OperatingLesson {
  title: string;
  body: string;
}

export const OPERATING_LESSONS: OperatingLesson[] = [
  {
    title: "Four roles, four separate agents",
    body: "Orchestrate, research, analyse, synthesise — mapped one to one onto Trust, Nexus, Baseline and Registry. Each role carries its own identity and its own memory. They are not one agent wearing four hats, and a role never grades its own work.",
  },
  {
    title: "Memory is the protocol, not the chat log",
    body: "Every scheduled run compares today's findings against what is already remembered and reports only what changed. Replaying a conversation is not recall; a searchable record of what was already established is.",
  },
  {
    title: "Cadence beats heroics",
    body: "One small job, one digest, one difference against yesterday. A daily micro-win on a schedule produced more usable evidence than any weekend sprint, because each run left a receipt behind it.",
  },
  {
    title: "Credential hygiene is not optional",
    body: "Tokens never travel in a group chat and rotate the moment they are exposed. Clinical text stays on the local machine rather than being handed to a hosted model.",
  },
];

export const CHAT_IS_NOT_EVIDENCE: string[] = [
  "A message in a chat window is a convenience layer. A number only counts once it resolves to a committed receipt carrying its engine, shot count and seed.",
  "A job triggered from a phone still runs the full order: classical floor, dequantization gate, quantum leg, graded receipt, post-quantum seal, anchor, settlement. The channel changes; the gate does not.",
  "Bulk sweeps and gating stay on the desktop runners. The mobile channel triggers small jobs and reads receipts back — nothing more.",
];

/** One line for the footer's list of limits. */
export const CHAT_FOOTER_CLAUSE =
  "A result relayed through a chat channel is not evidence until its receipt digest is sealed and anchored.";
