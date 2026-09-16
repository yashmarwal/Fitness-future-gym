import { NextResponse } from "next/server";
import { getAdminSession } from "@/backend/auth/session";
import { runAiAssistant } from "@/backend/services/admin/aiAssistant";

// Conversation history is kept client-side (the browser sends the full
// running transcript each time) rather than persisted server-side — this
// is a single trusted admin's own scratch tool, not a shared/audited
// channel like the member-facing WhatsApp/email messages, so there's
// nothing gained by storing it and it resets cleanly on page refresh.
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ status: "error", message: "No messages provided." }, { status: 400 });
  }
  const valid = messages.every(
    (m) => m && (m.role === "user" || m.role === "model") && typeof m.content === "string"
  );
  if (!valid) {
    return NextResponse.json({ status: "error", message: "Malformed conversation." }, { status: 400 });
  }

  try {
    const result = await runAiAssistant(messages);
    if ("error" in result) {
      return NextResponse.json({ status: "error", message: result.error }, { status: 502 });
    }
    return NextResponse.json({ status: "ok", reply: result.reply });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}
