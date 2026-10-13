import { NextResponse } from "next/server";
import { sendFeePaymentsArchive } from "@/backend/services/admin/feePaymentsArchive";
import { verifyCronRequest } from "@/backend/lib/cronAuth";

export async function GET(request: Request) {
  const unauthorized = verifyCronRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await sendFeePaymentsArchive();
    return NextResponse.json({ status: "ok", ...result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
