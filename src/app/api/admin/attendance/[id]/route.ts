import { NextResponse } from "next/server";
import { getAdminSession } from "@/backend/auth/session";
import { deleteAttendance } from "@/backend/services/admin/attendanceAdmin";
import { recordAuditLog } from "@/backend/services/admin/auditLog";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const { id } = await params;

  try {
    await deleteAttendance(id);
    await recordAuditLog(session.adminId, "delete_attendance", { attendanceId: id });
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Could not delete record." }, { status: 500 });
  }
}
