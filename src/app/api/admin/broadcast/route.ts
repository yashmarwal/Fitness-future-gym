import { NextResponse } from "next/server";
import { getAdminSession } from "@/backend/auth/session";
import { sendBroadcast } from "@/backend/services/admin/broadcast";
import { markHolidayRange } from "@/backend/services/gymCalendar";
import { recordAuditLog } from "@/backend/services/admin/auditLog";
import type { BroadcastSegment } from "@/types/admin";

// A broadcast to "all" can be a few hundred members — concurrency-limited
// (see backend/services/admin/broadcast.ts) but still needs real headroom,
// not this route's default timeout.
export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.message) {
    return NextResponse.json({ status: "error", message: "Message is required." }, { status: 400 });
  }

  // The composer's Holiday toggle has no effect of its own — this is the
  // ONLY place a holiday actually gets written (see gymCalendar.ts), and it
  // only happens as part of actually sending this broadcast. Marked before
  // the send so a bad date range (past date, span too long) fails loudly
  // with nothing sent, instead of members getting told about a closure that
  // never actually got recorded.
  const holiday = body.holiday as { from?: string; till?: string } | undefined;

  try {
    let holidayDates: string[] | undefined;
    if (holiday) {
      if (!holiday.from || !holiday.till) {
        return NextResponse.json({ status: "error", message: "Pick both a from and till date for the holiday." }, { status: 400 });
      }
      holidayDates = (await markHolidayRange(holiday.from, holiday.till, body.subject ?? "")).dates;
    }

    const result = await sendBroadcast((body.segment as BroadcastSegment) ?? "all", body.message, body.subject);
    await recordAuditLog(session.adminId, "broadcast", { segment: body.segment, sent: result.sent, ...(holidayDates ? { holidayDates } : {}) });
    return NextResponse.json({ status: "ok", ...result, ...(holidayDates ? { holidayDates } : {}) });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { status: "error", message: err instanceof Error ? err.message : "Could not send broadcast." },
      { status: 500 }
    );
  }
}
