import { NextResponse } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { savePushSubscription } from "@/backend/services/pushNotifications";

export async function POST(request: Request) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ status: "error", message: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const endpoint = body?.endpoint;
  const keys = body?.keys;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ status: "error", message: "Invalid subscription." }, { status: 400 });
  }

  try {
    await savePushSubscription(session.memberId, { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } });
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Could not save subscription." }, { status: 500 });
  }
}
