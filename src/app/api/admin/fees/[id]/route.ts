import { NextResponse } from "next/server";
import { getAdminSession } from "@/backend/auth/session";
import { updateFeePayment, deleteFeePayment } from "@/backend/services/admin/feesAdmin";
import { recordAuditLog } from "@/backend/services/admin/auditLog";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);

  const patch: { amount?: number; method?: "upi" | "cash" | "manual" } = {};
  if (body?.amount !== undefined) {
    const amount = Number(body.amount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ status: "error", message: "Amount must be a positive number." }, { status: 400 });
    }
    patch.amount = amount;
  }
  if (body?.method === "upi" || body?.method === "cash" || body?.method === "manual") {
    patch.method = body.method;
  }

  try {
    await updateFeePayment(id, patch);
    await recordAuditLog(session.adminId, "update_fee_payment", { paymentId: id, ...patch });
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Could not update payment." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const { id } = await params;

  try {
    await deleteFeePayment(id);
    await recordAuditLog(session.adminId, "delete_fee_payment", { paymentId: id });
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Could not delete payment." }, { status: 500 });
  }
}
