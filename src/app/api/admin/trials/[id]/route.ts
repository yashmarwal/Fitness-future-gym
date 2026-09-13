import { NextResponse } from "next/server";
import { getAdminSession } from "@/backend/auth/session";
import { convertTrialToMember } from "@/backend/services/admin/trials";
import { recordAuditLog } from "@/backend/services/admin/auditLog";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const plan = typeof body?.plan === "string" && body.plan.trim() ? body.plan.trim() : undefined;
  const feeAmount = typeof body?.feeAmount === "number" && body.feeAmount > 0 ? body.feeAmount : undefined;
  const paymentMethod =
    body?.paymentMethod === "upi" || body?.paymentMethod === "cash" || body?.paymentMethod === "manual"
      ? body.paymentMethod
      : undefined;

  try {
    const result = await convertTrialToMember(id, { plan, feeAmount, paymentMethod });
    if (result.status === "ok") {
      await recordAuditLog(session.adminId, "convert_trial", { trialId: id, memberId: result.memberId, plan });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Could not convert trial." }, { status: 500 });
  }
}
