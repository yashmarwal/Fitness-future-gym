import "server-only";
import { generateAiText } from "@/backend/services/admin/aiClient";

// AI-written commentary for the owners' emails. The division of labour is the
// whole safety story: the code computes every figure (including percentages
// and comparisons) and hands them over as a facts object; the model only turns
// them into sentences. Anything it writes that contains a number that isn't in
// the facts is discarded (validateNumbers), and if the AI is unavailable the
// email simply goes out without the section — see generateAiText.

export type OwnerNarrative = { summary: string; actions: string[] };

const NUMBER_RE = /\d+(?:\.\d+)?/g;

function numbersIn(text: string): string[] {
  // "12,450" must read as 12450 to match the raw figures in the facts.
  return (text.replace(/(?<=\d),(?=\d{3}(?!\d))/g, "").match(NUMBER_RE) ?? []).map((n) => String(Number(n)));
}

// True only when every number in `text` also appears in `facts`.
export function validateNumbers(text: string, facts: unknown): boolean {
  const allowed = new Set(numbersIn(JSON.stringify(facts)));
  return numbersIn(text).every((n) => allowed.has(n));
}

// The model is told to write a short paragraph, then "- " action lines. Pulled
// apart here, with lengths capped so a rambling answer can't blow up the email.
export function parseNarrative(raw: string): OwnerNarrative {
  const actions: string[] = [];
  const prose: string[] = [];
  for (const line of raw.split("\n").map((l) => l.trim())) {
    if (!line) continue;
    const bullet = line.match(/^[-•*]\s+(.*)$/);
    if (bullet) actions.push(bullet[1].slice(0, 240));
    else prose.push(line.replace(/^#+\s*/, "").replace(/\*\*/g, ""));
  }
  return { summary: prose.join(" ").slice(0, 900), actions: actions.slice(0, 5) };
}

const SHARED_RULES = `You are writing for the two owners of Fitness Future Gym, a strength gym in Nangloi, Delhi. You are given a JSON object of facts. Rules: use ONLY these facts. Never invent, estimate, round, or calculate any number — quote figures exactly as they appear in the facts (percentages and comparisons are already worked out for you). Only mention members by names that appear in the facts. Plain text only: no markdown, no bold, no headings, no emojis, no greeting or sign-off. Currency is Indian Rupees (₹). Be specific and direct; do not pad.`;

const DAILY_SYSTEM = `${SHARED_RULES}

Write ONE short paragraph of 2 to 3 sentences summarising today for the owners: what stood out compared with a usual day (check-ins, money), and anything that needs their attention, naming the specific members from the facts when relevant. If nothing was notable, say it was a steady day. Output only that paragraph.`;

const WEEKLY_SYSTEM = `${SHARED_RULES}

Write the weekly report commentary in exactly this format:
First, one paragraph of 3 to 4 sentences summarising the week — the main trends versus the previous week (attendance, revenue, members), and what stood out.
Then 3 to 5 lines, each beginning with "- ", each a concrete action for the coming week that follows from the facts (for example calling specific members whose attendance dropped, or chasing specific overdue fees). No other text.`;

async function write(system: string, facts: unknown, maxTokens: number): Promise<OwnerNarrative | null> {
  const raw = await generateAiText({ system, user: `Facts (JSON):\n${JSON.stringify(facts)}`, maxTokens });
  if (!raw) return null;

  const narrative = parseNarrative(raw);
  if (!narrative.summary) return null;
  if (!validateNumbers([narrative.summary, ...narrative.actions].join(" "), facts)) {
    console.error("AI summary discarded: it contained a figure that isn't in the facts.");
    return null;
  }
  return narrative;
}

export function writeDailyNarrative(facts: unknown): Promise<string | null> {
  return write(DAILY_SYSTEM, facts, 300).then((n) => (n ? n.summary : null));
}

export function writeWeeklyNarrative(facts: unknown): Promise<OwnerNarrative | null> {
  return write(WEEKLY_SYSTEM, facts, 600);
}
