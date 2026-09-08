import { NextResponse } from "next/server";
import { getAdminSession } from "@/server/auth/session";
import { recordManualPayment } from "@/server/services/admin/feesAdmin";
import { recordAuditLog } from "@/server/services/admin/auditLog";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const amount = Number(body?.amount);
  if (!body?.memberId || !amount) {
    return NextResponse.json({ status: "error", message: "Member and amount are required." }, { status: 400 });
  }

  try {
    await recordManualPayment(body.memberId, amount, body.method === "cash" ? "cash" : "manual");
    await recordAuditLog(session.adminId, "manual_payment", { memberId: body.memberId, amount });
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Could not record payment." }, { status: 500 });
  }
}
