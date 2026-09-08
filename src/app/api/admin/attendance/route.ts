import { NextResponse } from "next/server";
import { getAdminSession } from "@/server/auth/session";
import { addManualAttendance } from "@/server/services/admin/attendanceAdmin";
import { recordAuditLog } from "@/server/services/admin/auditLog";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.memberId) {
    return NextResponse.json({ status: "error", message: "Member is required." }, { status: 400 });
  }

  try {
    await addManualAttendance(body.memberId, body.checkedInAt);
    await recordAuditLog(session.adminId, "manual_attendance", { memberId: body.memberId });
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Could not add attendance." }, { status: 500 });
  }
}
