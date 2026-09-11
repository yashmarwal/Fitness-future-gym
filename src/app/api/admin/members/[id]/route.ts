import { NextResponse } from "next/server";
import { getAdminSession } from "@/backend/auth/session";
import { updateMember, deleteMember } from "@/backend/services/admin/members";
import { recordAuditLog } from "@/backend/services/admin/auditLog";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);

  try {
    await updateMember(id, body ?? {});
    await recordAuditLog(session.adminId, "update_member", { memberId: id });
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Could not update member." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const { id } = await params;

  try {
    await deleteMember(id);
    await recordAuditLog(session.adminId, "delete_member", { memberId: id });
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Could not delete member." }, { status: 500 });
  }
}
