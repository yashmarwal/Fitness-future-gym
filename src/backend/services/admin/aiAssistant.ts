import "server-only";
import { listOverdueFeeMembers, listUpcomingDueMembers, listRecentlyMissedMembers, listInactiveMembers, listTrialOverMembers, listUpcomingBirthdays } from "@/backend/services/admin/alerts";
import { listRecentAttendance, getMemberAttendanceTimestamps, countTodaysCheckIns } from "@/backend/services/admin/attendanceAdmin";
import { listUnpaidActiveMembers, listBlockedMembers } from "@/backend/services/admin/feeAbuse";
import { listFeePayments, sumPaidThisMonth, countOverdueMembers } from "@/backend/services/admin/feesAdmin";
import { listMembers, getMember } from "@/backend/services/admin/members";
import { listTrialRegistrations } from "@/backend/services/admin/trials";

// Curated, READ-ONLY tool surface for the admin AI assistant — every tool
// here wraps a real, already-in-production admin function, never raw SQL
// and never anything that writes. The model can only ever see what these
// functions already return to a human admin on the existing admin pages;
// this doesn't expose anything new. Deliberately excludes every mutating
// function in these same files (blockMember, recordManualPayment,
// sendBroadcast, addManualAttendance, createMember, etc.) — those simply
// aren't in this registry, so the model has no way to call them.
type ToolDef = {
  description: string;
  parameters: { type: "OBJECT"; properties: Record<string, { type: string; description: string }>; required?: string[] };
  handler: (args: Record<string, unknown>) => Promise<unknown>;
};

const TOOLS: Record<string, ToolDef> = {
  list_members: {
    description:
      "Lists every member (active and inactive) with their id, membership number, name, phone, email, plan, fee amount, fee due date, joined date, active/blocked status. Use this first to find a member's id from their name before calling tools that need an id.",
    parameters: { type: "OBJECT", properties: {} },
    handler: async () => listMembers(),
  },
  get_member: {
    description: "Gets full detail for one member by their id (get the id from list_members first).",
    parameters: { type: "OBJECT", properties: { id: { type: "string", description: "The member's id" } }, required: ["id"] },
    handler: async (args) => getMember(String(args.id)),
  },
  list_overdue_fee_members: {
    description: "Members whose fee is currently overdue (past its due date).",
    parameters: { type: "OBJECT", properties: {} },
    handler: async () => listOverdueFeeMembers(),
  },
  list_upcoming_due_members: {
    description: "Members whose fee is coming due soon (not yet overdue).",
    parameters: { type: "OBJECT", properties: {} },
    handler: async () => listUpcomingDueMembers(),
  },
  list_recently_missed_members: {
    description: "Members who recently missed check-ins after a regular attendance pattern.",
    parameters: { type: "OBJECT", properties: {} },
    handler: async () => listRecentlyMissedMembers(),
  },
  list_inactive_members: {
    description: "Members who haven't checked in for an extended period.",
    parameters: { type: "OBJECT", properties: {} },
    handler: async () => listInactiveMembers(),
  },
  list_trial_over_members: {
    description: "Trial members whose free trial period has ended.",
    parameters: { type: "OBJECT", properties: {} },
    handler: async () => listTrialOverMembers(),
  },
  list_upcoming_birthdays: {
    description: "Members with an upcoming birthday.",
    parameters: { type: "OBJECT", properties: {} },
    handler: async () => listUpcomingBirthdays(),
  },
  list_unpaid_active_members: {
    description: "Members actively using the gym (checked in recently) but with no plan, no fee amount set, or an overdue fee — i.e. using it without paying.",
    parameters: { type: "OBJECT", properties: {} },
    handler: async () => listUnpaidActiveMembers(),
  },
  list_blocked_members: {
    description: "Members whose check-in/dashboard access is currently blocked, and why.",
    parameters: { type: "OBJECT", properties: {} },
    handler: async () => listBlockedMembers(),
  },
  list_fee_payments: {
    description: "Recent fee payment records (amount, method, status, date, which member).",
    parameters: { type: "OBJECT", properties: { limit: { type: "number", description: "Max rows, default 100" } } },
    handler: async (args) => listFeePayments(args.limit ? Number(args.limit) : undefined),
  },
  sum_paid_this_month: {
    description: "Total revenue (sum of all paid fee payments) so far this calendar month.",
    parameters: { type: "OBJECT", properties: {} },
    handler: async () => sumPaidThisMonth(),
  },
  count_overdue_members: {
    description: "How many active members currently have an overdue fee.",
    parameters: { type: "OBJECT", properties: {} },
    handler: async () => countOverdueMembers(),
  },
  list_recent_attendance: {
    description: "Recent check-in records across all members (who checked in, when).",
    parameters: { type: "OBJECT", properties: { limit: { type: "number", description: "Max rows, default 100" } } },
    handler: async (args) => listRecentAttendance(args.limit ? Number(args.limit) : undefined),
  },
  get_member_attendance_timestamps: {
    description: "All recorded check-in timestamps for one specific member by id (get the id from list_members first).",
    parameters: { type: "OBJECT", properties: { memberId: { type: "string", description: "The member's id" } }, required: ["memberId"] },
    handler: async (args) => getMemberAttendanceTimestamps(String(args.memberId)),
  },
  count_todays_checkins: {
    description: "How many check-ins have happened today so far, across all members.",
    parameters: { type: "OBJECT", properties: {} },
    handler: async () => countTodaysCheckIns(),
  },
  list_trial_registrations: {
    description: "All free-trial registrations (name, phone, email, shift, status, trial dates) — includes people who never became members.",
    parameters: { type: "OBJECT", properties: {} },
    handler: async () => listTrialRegistrations(),
  },
};

const SYSTEM_INSTRUCTION = `You are a read-only data assistant for the admin panel of Fitness Future Gym, a real gym in Nangloi, Delhi. You answer the admin's questions about their own gym's data (members, fees, attendance, trials) using ONLY the provided tools — never guess or invent a number, name, or date. If a tool doesn't cover what's asked, say so plainly instead of making something up. You cannot make any changes — you have no tools that write, block, charge, or message anyone; if asked to take an action, say you can only look things up, not perform it, and that they should use the relevant admin page for that. Keep answers concise, factual, and specific (cite real counts/names/numbers from the tool results). Currency is Indian Rupees (₹).`;

// "flash-lite" is Google's fast/cost-efficient tier (vs. "pro") — the right
// fit for a tool-calling lookup assistant rather than deep reasoning. The
// "-latest" alias always points to the current recommended lite model, so
// this doesn't need a manual bump as Google ships newer point releases —
// confirmed available for this key via a live GET to /v1beta/models.
const GEMINI_MODEL = "gemini-flash-lite-latest";
const MAX_TOOL_ROUNDS = 5;

type ChatMessage = { role: "user" | "model"; content: string };

type GeminiPart = { text?: string; functionCall?: { name: string; args: Record<string, unknown> }; functionResponse?: { name: string; response: Record<string, unknown> } };
type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

function isConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function friendlyGeminiError(status: number): string {
  if (status === 400 || status === 401 || status === 403) {
    return "The AI service rejected the API key — it may be invalid, deleted, or its Google project suspended. Replace GEMINI_API_KEY in the environment settings with a key from an active project, then redeploy.";
  }
  if (status === 429) return "The AI service is rate-limited right now — try again in a minute.";
  if (status >= 500) return "Google's AI service is having trouble — try again shortly.";
  return `The AI service returned an error (${status}).`;
}

async function callGemini(contents: GeminiContent[]): Promise<GeminiContent> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents,
        tools: [
          {
            function_declarations: Object.entries(TOOLS).map(([name, tool]) => ({
              name,
              description: tool.description,
              parameters: tool.parameters,
            })),
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    // Never pass Google's response body on to the UI: for key/permission
    // errors it echoes the API key itself ("Consumer 'api_key:…' has been
    // suspended"), which then ends up on the admin screen and in
    // screenshots. The full detail goes to the server log instead, with
    // anything key-shaped redacted.
    const body = await res.text();
    console.error(`Gemini API error (${res.status}):`, body.replace(/AIza[\w-]+|AQ\.[\w-]+/g, "[redacted-key]"));
    throw new Error(friendlyGeminiError(res.status));
  }

  const data = await res.json();
  const content = data?.candidates?.[0]?.content;
  if (!content) throw new Error("Gemini API returned no content");
  return content as GeminiContent;
}

export type AiAssistantResult = { reply: string } | { error: string };

// The model can call tools repeatedly (e.g. list_members, then get_member
// with the id it found) before giving a final text answer — this loop
// executes each requested tool for real and feeds the result back, up to
// MAX_TOOL_ROUNDS so a confused model can't loop forever.
export async function runAiAssistant(history: ChatMessage[]): Promise<AiAssistantResult> {
  if (!isConfigured()) {
    return { error: "AI assistant isn't configured yet — GEMINI_API_KEY is missing." };
  }

  const contents: GeminiContent[] = history.map((m) => ({ role: m.role, parts: [{ text: m.content }] }));

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let modelContent: GeminiContent;
    try {
      modelContent = await callGemini(contents);
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }

    const functionCalls = modelContent.parts.filter((p) => p.functionCall);
    if (functionCalls.length === 0) {
      const text = modelContent.parts.map((p) => p.text ?? "").join("").trim();
      return { reply: text || "I couldn't find an answer to that." };
    }

    contents.push(modelContent);

    const responseParts: GeminiPart[] = [];
    for (const part of functionCalls) {
      const call = part.functionCall!;
      const tool = TOOLS[call.name];
      let response: Record<string, unknown>;
      if (!tool) {
        response = { error: `Unknown tool: ${call.name}` };
      } else {
        try {
          const result = await tool.handler(call.args ?? {});
          response = { result };
        } catch (err) {
          response = { error: err instanceof Error ? err.message : String(err) };
        }
      }
      responseParts.push({ functionResponse: { name: call.name, response } });
    }
    contents.push({ role: "user", parts: responseParts });
  }

  return { error: "The assistant took too many steps to answer that — try asking something more specific." };
}
