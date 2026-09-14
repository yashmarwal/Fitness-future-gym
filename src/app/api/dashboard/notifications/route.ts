import { NextResponse } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { listNotifications, markNotificationsRead } from "@/backend/services/memberNotifications";

export async function GET() {
  const session = await getMemberSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  try {
    const notifications = await listNotifications(session.memberId);
    return NextResponse.json({ status: "ok", notifications });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}

export async function POST() {
  const session = await getMemberSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  try {
    await markNotificationsRead(session.memberId);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}
