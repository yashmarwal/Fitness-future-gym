import { NextResponse } from "next/server";
import { sendDailySummaryEmail } from "@/backend/services/admin/dailySummary";
import { verifyCronRequest } from "@/backend/lib/cronAuth";

// The digest now makes an AI call on top of its queries — more headroom than
// the default limit.
export const maxDuration = 60;

export async function GET(request: Request) {
  const unauthorized = verifyCronRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await sendDailySummaryEmail();
    return NextResponse.json({ status: "ok", ...result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
