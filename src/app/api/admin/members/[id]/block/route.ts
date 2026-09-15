import { NextResponse } from "next/server";
import { getAdminSession } from "@/backend/auth/session";
import { blockMember } from "@/backend/services/admin/feeAbuse";
import { recordAuditLog } from "@/backend/services/admin/auditLog";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = typeof body?.reason === "string" && body.reason.trim() ? body.reason.trim() : "Blocked by admin";

  try {
    await blockMember(id, reason);
    await recordAuditLog(session.adminId, "block_member", { memberId: id, reason });
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Could not block member." }, { status: 500 });
  }
}
