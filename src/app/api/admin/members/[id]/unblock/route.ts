import { NextResponse } from "next/server";
import { getAdminSession } from "@/backend/auth/session";
import { unblockMember } from "@/backend/services/admin/feeAbuse";
import { recordAuditLog } from "@/backend/services/admin/auditLog";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const { id } = await params;

  try {
    await unblockMember(id);
    await recordAuditLog(session.adminId, "unblock_member", { memberId: id });
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Could not unblock member." }, { status: 500 });
  }
}
