import { NextResponse } from "next/server";
import { runShareReminderCheck } from "@/backend/services/reminders";
import { verifyCronRequest } from "@/backend/lib/cronAuth";

// Matches the headroom already given to the other member-sweep crons.
export const maxDuration = 60;

export async function GET(request: Request) {
  const unauthorized = verifyCronRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await runShareReminderCheck();
    return NextResponse.json({ status: "ok", ...result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
