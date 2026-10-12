import { NextResponse } from "next/server";
import { sendWeeklySummaryEmail } from "@/backend/services/admin/weeklySummary";
import { verifyCronRequest } from "@/backend/lib/cronAuth";

// Many queries plus one AI call — more headroom than the default limit.
export const maxDuration = 60;

export async function GET(request: Request) {
  const unauthorized = verifyCronRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await sendWeeklySummaryEmail();
    return NextResponse.json({ status: "ok", ...result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
