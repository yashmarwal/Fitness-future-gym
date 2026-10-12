import { NextResponse } from "next/server";
import { runTrialConversionReminder } from "@/backend/services/trial";
import { verifyCronRequest } from "@/backend/lib/cronAuth";

// Matches the headroom already given to daily-summary/weekly-summary.
export const maxDuration = 60;

export async function GET(request: Request) {
  const unauthorized = verifyCronRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await runTrialConversionReminder();
    return NextResponse.json({ status: "ok", ...result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
