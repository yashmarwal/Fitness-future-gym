import "server-only";
import { listOverdueFeeMembers, listUpcomingDueMembers, listRecentlyMissedMembers, listInactiveMembers, listTrialOverMembers, listUpcomingBirthdays } from "@/backend/services/admin/alerts";
import { listRecentAttendance, getMemberAttendanceTimestamps, countTodaysCheckIns } from "@/backend/services/admin/attendanceAdmin";
import { listUnpaidActiveMembers, listBlockedMembers } from "@/backend/services/admin/feeAbuse";
import { listFeePayments, sumPaidThisMonth, countOverdueMembers } from "@/backend/services/admin/feesAdmin";
import { listMembers, getMember } from "@/backend/services/admin/members";
import { listTrialRegistrations } from "@/backend/services/admin/trials";
import { friendlyAiError, getAiConfig, modelExtras, redactSecrets } from "@/backend/services/admin/aiClient";

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
  parameters: { type: "object"; properties: Record<string, { type: string; description: string }>; required?: string[] };
  handler: (args: Record<string, unknown>) => Promise<unknown>;
};

const TOOLS: Record<string, ToolDef> = {
  list_members: {
    description:
      "Finds members. ALWAYS pass `search` (part of a name, membership number, or phone) when the admin mentions a particular person or number — matches come back with full detail: id, membership number, name, phone, email, plan, fee amount, fee due date, joined date, active/blocked status. Without `search` it returns only a slim list (id, membership number, name, active/blocked), which can be cut off in a big gym. Use it to find a member's id before calling tools that need an id.",
    parameters: {
      type: "object",
      properties: { search: { type: "string", description: "Part of a member's name, membership number, or phone number" } },
    },
    handler: async (args) => {
      const all = await listMembers();
      const term = typeof args.search === "string" ? args.search.trim().toLowerCase() : "";
      if (term) {
        return all.filter(
          (m) =>
            m.fullName.toLowerCase().includes(term) ||
            m.membershipNumber.toLowerCase().includes(term) ||
            (m.phone ?? "").replace(/\s+/g, "").includes(term.replace(/\s+/g, ""))
        );
      }
      return all.map((m) => ({
        id: m.id,
        membershipNumber: m.membershipNumber,
        fullName: m.fullName,
        isActive: m.isActive,
        isBlocked: m.isBlocked,
      }));
    },
  },
  get_member: {
    description: "Gets full detail for one member by their id (get the id from list_members first).",
    parameters: { type: "object", properties: { id: { type: "string", description: "The member's id" } }, required: ["id"] },
    handler: async (args) => getMember(String(args.id)),
  },
  list_overdue_fee_members: {
    description: "Members whose fee is currently overdue (past its due date).",
    parameters: { type: "object", properties: {} },
    handler: async () => listOverdueFeeMembers(),
  },
  list_upcoming_due_members: {
    description: "Members whose fee is coming due soon (not yet overdue).",
    parameters: { type: "object", properties: {} },
    handler: async () => listUpcomingDueMembers(),
  },
  list_recently_missed_members: {
    description: "Members who recently missed check-ins after a regular attendance pattern.",
    parameters: { type: "object", properties: {} },
    handler: async () => listRecentlyMissedMembers(),
  },
  list_inactive_members: {
    description: "Members who haven't checked in for an extended period.",
    parameters: { type: "object", properties: {} },
    handler: async () => listInactiveMembers(),
  },
  list_trial_over_members: {
    description: "Trial members whose free trial period has ended.",
    parameters: { type: "object", properties: {} },
    handler: async () => listTrialOverMembers(),
  },
  list_upcoming_birthdays: {
    description: "Members with an upcoming birthday.",
    parameters: { type: "object", properties: {} },
    handler: async () => listUpcomingBirthdays(),
  },
  list_unpaid_active_members: {
    description: "Members actively using the gym (checked in recently) but with no plan, no fee amount set, or an overdue fee — i.e. using it without paying.",
    parameters: { type: "object", properties: {} },
    handler: async () => listUnpaidActiveMembers(),
  },
  list_blocked_members: {
    description: "Members whose check-in/dashboard access is currently blocked, and why.",
    parameters: { type: "object", properties: {} },
    handler: async () => listBlockedMembers(),
  },
  list_fee_payments: {
    description: "Recent fee payment records (amount, method, status, date, which member).",
    parameters: { type: "object", properties: { limit: { type: "number", description: "Max rows, default 100" } } },
    handler: async (args) => listFeePayments(args.limit ? Number(args.limit) : undefined),
  },
  sum_paid_this_month: {
    description: "Total revenue (sum of all paid fee payments) so far this calendar month.",
    parameters: { type: "object", properties: {} },
    handler: async () => sumPaidThisMonth(),
  },
  count_overdue_members: {
    description: "How many active members currently have an overdue fee.",
    parameters: { type: "object", properties: {} },
    handler: async () => countOverdueMembers(),
  },
  list_recent_attendance: {
    description: "Recent check-in records across all members (who checked in, when).",
    parameters: { type: "object", properties: { limit: { type: "number", description: "Max rows, default 100" } } },
    handler: async (args) => listRecentAttendance(args.limit ? Number(args.limit) : undefined),
  },
  get_member_attendance_timestamps: {
    description: "All recorded check-in timestamps for one specific member by id (get the id from list_members first).",
    parameters: { type: "object", properties: { memberId: { type: "string", description: "The member's id" } }, required: ["memberId"] },
    handler: async (args) => getMemberAttendanceTimestamps(String(args.memberId)),
  },
  count_todays_checkins: {
    description: "How many check-ins have happened today so far, across all members.",
    parameters: { type: "object", properties: {} },
    handler: async () => countTodaysCheckIns(),
  },
  list_trial_registrations: {
    description: "All free-trial registrations (name, phone, email, shift, status, trial dates) — includes people who never became members.",
    parameters: { type: "object", properties: {} },
    handler: async () => listTrialRegistrations(),
  },
};

const SYSTEM_INSTRUCTION = `You are a read-only data assistant for the admin panel of Fitness Future Gym, a real gym in Nangloi, Delhi. You answer the admin's questions about their own gym's data (members, fees, attendance, trials) using ONLY the provided tools — never guess or invent a number, name, or date. If a tool doesn't cover what's asked, say so plainly instead of making something up. You cannot make any changes — you have no tools that write, block, charge, or message anyone; if asked to take an action, say you can only look things up, not perform it, and that they should use the relevant admin page for that. Keep answers concise, factual, and specific (cite real counts/names/numbers from the tool results). Currency is Indian Rupees (₹).`;

// Provider config, secret redaction and friendly errors live in aiClient.ts
// (shared with the owner-summary emails).
const MAX_TOOL_ROUNDS = 5;

// Free tiers cap tokens per minute, and a tool like list_fee_payments can
// return hundreds of rows. Results past this size are cut (with a note the
// model passes on) instead of blowing the request limit.
const MAX_TOOL_RESULT_CHARS = 16_000;

type ChatMessage = { role: "user" | "model"; content: string };

type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
type ApiMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

async function callAi(messages: ApiMessage[]): Promise<{ content: string | null; toolCalls: ToolCall[] }> {
  const { apiKey, baseUrl, model } = getAiConfig();
  const body = JSON.stringify({
    model,
    messages,
    tools: Object.entries(TOOLS).map(([name, tool]) => ({
      type: "function",
      function: { name, description: tool.description, parameters: tool.parameters },
    })),
    tool_choice: "auto",
    ...modelExtras(model),
  });

  // Some open models occasionally emit a malformed tool call, which the
  // provider reports as a 400 "tool_use_failed"; a plain retry almost always
  // succeeds, so give that one case a second attempt.
  let res: Response | null = null;
  let failureBody = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body,
    });
    if (res.ok) break;
    failureBody = await res.text();
    if (!(res.status === 400 && failureBody.includes("tool_use_failed"))) break;
  }

  if (!res || !res.ok) {
    const status = res?.status ?? 502;
    // The provider's response body never goes to the UI (error bodies can echo
    // credentials — Google's did); it goes to the server log, with anything
    // key-shaped redacted.
    console.error(
      `AI provider error (${status}):`,
      redactSecrets(failureBody)
    );
    throw new Error(friendlyAiError(status, failureBody));
  }

  const data = await res.json();
  const message = data?.choices?.[0]?.message;
  if (!message) throw new Error("The AI service returned an empty response — try again.");
  return { content: typeof message.content === "string" ? message.content : null, toolCalls: message.tool_calls ?? [] };
}

// Compact JSON (no nulls, no whitespace) that fits the size budget. Arrays are
// cut to the rows that fit, and the model is told so it can say the list was
// partial rather than presenting it as complete.
function serializeToolResult(result: unknown): string {
  const compact = (value: unknown) => JSON.stringify(value, (_key, v) => (v === null || v === undefined ? undefined : v));
  const full = compact({ result });
  if (full.length <= MAX_TOOL_RESULT_CHARS) return full;

  if (Array.isArray(result)) {
    let kept = result.length;
    while (kept > 0 && compact({ result: result.slice(0, kept) }).length > MAX_TOOL_RESULT_CHARS) {
      kept = Math.floor(kept * 0.8);
    }
    return compact({
      result: result.slice(0, kept),
      note: `Only the first ${kept} of ${result.length} rows are shown — the rest were cut for size. Tell the admin the list is partial and suggest a narrower question.`,
    });
  }
  return compact({ result: full.slice(0, MAX_TOOL_RESULT_CHARS), note: "The result was cut for size." });
}

export type AiAssistantResult = { reply: string } | { error: string };

// The model can call tools repeatedly (e.g. list_members, then get_member
// with the id it found) before giving a final text answer — this loop
// executes each requested tool for real and feeds the result back, up to
// MAX_TOOL_ROUNDS so a confused model can't loop forever.
export async function runAiAssistant(history: ChatMessage[]): Promise<AiAssistantResult> {
  if (!getAiConfig().apiKey) {
    return { error: "AI assistant isn't configured yet — AI_API_KEY is missing." };
  }

  const messages: ApiMessage[] = [
    { role: "system", content: SYSTEM_INSTRUCTION },
    ...history.map((m): ApiMessage => ({ role: m.role === "model" ? "assistant" : "user", content: m.content })),
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let turn: { content: string | null; toolCalls: ToolCall[] };
    try {
      turn = await callAi(messages);
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }

    if (turn.toolCalls.length === 0) {
      return { reply: turn.content?.trim() || "I couldn't find an answer to that." };
    }

    messages.push({ role: "assistant", content: turn.content, tool_calls: turn.toolCalls });

    for (const call of turn.toolCalls) {
      const tool = TOOLS[call.function.name];
      let payload: string;
      if (!tool) {
        payload = JSON.stringify({ error: `Unknown tool: ${call.function.name}` });
      } else {
        try {
          const args = call.function.arguments?.trim() ? JSON.parse(call.function.arguments) : {};
          payload = serializeToolResult(await tool.handler(args ?? {}));
        } catch (err) {
          payload = JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
        }
      }
      messages.push({ role: "tool", tool_call_id: call.id, content: payload });
    }
  }

  return { error: "The assistant took too many steps to answer that — try asking something more specific." };
}
