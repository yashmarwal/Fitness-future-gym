import { NextResponse } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { countUnreadNotifications } from "@/backend/services/memberNotifications";

// Polled by DashboardHeader.tsx (client-side, on mount and whenever the
// Settings panel closes) to light up the red dot on the Settings button —
// a dedicated lightweight endpoint rather than reusing GET
// /api/dashboard/notifications, which returns full notification rows.
export async function GET() {
  const session = await getMemberSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  try {
    const count = await countUnreadNotifications(session.memberId);
    return NextResponse.json({ status: "ok", count });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}
