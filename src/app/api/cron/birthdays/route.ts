import { NextResponse } from "next/server";
import { runBirthdayCheck } from "@/backend/services/notifications";

// Sends run concurrency-limited (see backend/lib/concurrency.ts) but a
// gym-wide sweep can still take a while — matches the headroom already
// given to daily-summary/weekly-summary.
export const maxDuration = 60;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ status: "error", message: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await runBirthdayCheck();
    return NextResponse.json({ status: "ok", ...result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
