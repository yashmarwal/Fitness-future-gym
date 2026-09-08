import { NextResponse } from "next/server";
import { getAdminSession } from "@/server/auth/session";
import { createMember } from "@/server/services/admin/members";
import { recordAuditLog } from "@/server/services/admin/auditLog";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.membershipNumber || !body?.fullName) {
    return NextResponse.json({ status: "error", message: "Membership number and name are required." }, { status: 400 });
  }

  try {
    const member = await createMember(body);
    await recordAuditLog(session.adminId, "create_member", { memberId: member.id });
    return NextResponse.json({ status: "ok", member });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Could not create member." }, { status: 500 });
  }
}
