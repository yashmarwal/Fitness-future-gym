import { NextResponse } from "next/server";
import { runBirthdayCheck } from "@/backend/services/notifications";
import { verifyCronRequest } from "@/backend/lib/cronAuth";

// Sends run concurrency-limited (see backend/lib/concurrency.ts) but a
// gym-wide sweep can still take a while — matches the headroom already
// given to daily-summary/weekly-summary.
export const maxDuration = 60;

export async function GET(request: Request) {
  const unauthorized = verifyCronRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await runBirthdayCheck();
    return NextResponse.json({ status: "ok", ...result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
