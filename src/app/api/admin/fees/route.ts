import { NextResponse } from "next/server";
import { getAdminSession } from "@/backend/auth/session";
import {
  recordManualPayment,
  PAYMENT_DURATION_MONTHS_OPTIONS,
  type PaymentDurationMonths,
} from "@/backend/services/admin/feesAdmin";
import { recordAuditLog } from "@/backend/services/admin/auditLog";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const amount = Number(body?.amount);
  if (!body?.memberId || !amount) {
    return NextResponse.json({ status: "error", message: "Member and amount are required." }, { status: 400 });
  }

  const method = body.method === "cash" || body.method === "upi" ? body.method : "manual";

  const requestedDuration = Number(body?.durationMonths);
  const durationMonths = (
    PAYMENT_DURATION_MONTHS_OPTIONS.includes(requestedDuration as PaymentDurationMonths) ? requestedDuration : 1
  ) as PaymentDurationMonths;

  try {
    await recordManualPayment(body.memberId, amount, method, durationMonths);
    await recordAuditLog(session.adminId, "manual_payment", { memberId: body.memberId, amount, durationMonths });
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Could not record payment." }, { status: 500 });
  }
}
