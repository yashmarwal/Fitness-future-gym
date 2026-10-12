import { NextResponse } from "next/server";
import { runFeeReminderCheck } from "@/backend/services/notifications";
import {
  autoBlockOverdueMembers,
  autoBlockInactiveMembers,
  autoBlockNeverBilledMembers,
} from "@/backend/services/admin/feeAbuse";
import { verifyCronRequest } from "@/backend/lib/cronAuth";

// Four concurrency-limited sweeps running in parallel (see the Promise.all
// below) — matches the headroom already given to daily-summary/weekly-summary.
export const maxDuration = 60;

export async function GET(request: Request) {
  const unauthorized = verifyCronRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const [reminders, overdue, inactive, neverBilled] = await Promise.all([
      runFeeReminderCheck(),
      autoBlockOverdueMembers(),
      autoBlockInactiveMembers(),
      autoBlockNeverBilledMembers(),
    ]);
    return NextResponse.json({
      status: "ok",
      ...reminders,
      blockedOverdue: overdue.blocked,
      blockedInactive: inactive.blocked,
      blockedNeverBilled: neverBilled.blocked,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
