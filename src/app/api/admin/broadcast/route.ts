import { NextResponse } from "next/server";
import { getAdminSession } from "@/backend/auth/session";
import { sendBroadcast } from "@/backend/services/admin/broadcast";
import { recordAuditLog } from "@/backend/services/admin/auditLog";
import type { BroadcastSegment } from "@/types/admin";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.message) {
    return NextResponse.json({ status: "error", message: "Message is required." }, { status: 400 });
  }

  try {
    const result = await sendBroadcast((body.segment as BroadcastSegment) ?? "all", body.message, body.subject);
    await recordAuditLog(session.adminId, "broadcast", { segment: body.segment, sent: result.sent });
    return NextResponse.json({ status: "ok", ...result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Could not send broadcast." }, { status: 500 });
  }
}
