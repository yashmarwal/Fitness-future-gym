import { NextResponse } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { deletePushSubscription } from "@/backend/services/pushNotifications";

export async function POST(request: Request) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ status: "error", message: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const endpoint = body?.endpoint;
  if (!endpoint) {
    return NextResponse.json({ status: "error", message: "Endpoint is required." }, { status: 400 });
  }

  try {
    await deletePushSubscription(endpoint);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Could not remove subscription." }, { status: 500 });
  }
}
