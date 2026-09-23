import { NextResponse } from "next/server";
import { runFeeReminderCheck } from "@/backend/services/notifications";
import { autoBlockOverdueMembers } from "@/backend/services/admin/feeAbuse";

// Two concurrency-limited sweeps running in parallel (see the Promise.all
// below) — matches the headroom already given to daily-summary/weekly-summary.
export const maxDuration = 60;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ status: "error", message: "Unauthorized." }, { status: 401 });
  }

  try {
    const [reminders, autoBlock] = await Promise.all([runFeeReminderCheck(), autoBlockOverdueMembers()]);
    return NextResponse.json({ status: "ok", ...reminders, ...autoBlock });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
