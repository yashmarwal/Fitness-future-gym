import { NextResponse } from "next/server";
import { runWaterReminderCheck } from "@/backend/services/reminders";

// Registered 3x in vercel.json with different schedules (11am/3pm/6pm
// IST) — same route, no query param or state needed since it's just a
// flat, unconditional nudge to whoever's opted in.
// Matches the headroom already given to the other member-sweep crons.
export const maxDuration = 60;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ status: "error", message: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await runWaterReminderCheck();
    return NextResponse.json({ status: "ok", ...result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
