import { NextResponse } from "next/server";
import { getAdminSession } from "@/backend/auth/session";

// One-time manual diagnostic/fix, meant to be visited directly in the
// browser while logged into /admin (a plain GET so no curl/button needed) —
// not part of the app's normal runtime. Delete once webhook delivery is
// confirmed working.
//
// Registering a Callback URL + subscribing to the "messages" field in the
// App Dashboard (WhatsApp → Configuration) only wires up the *app*. A
// WhatsApp Business Account still has to be separately linked to that app
// before Meta actually delivers its events to the URL — the
// `{waba-id}/subscribed_apps` call below — and nothing in the App Dashboard
// UI makes that step obvious, so it's a common reason a correctly-verified
// webhook still receives nothing.
export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error", message: "Log into /admin first." }, { status: 401 });

  // Deriving the WABA id from the phone number id isn't reliably possible
  // via the Graph API (no stable field for it across versions) — instead
  // pass it explicitly: WhatsApp Manager → API Setup shows "WhatsApp
  // Business Account ID" right next to "Phone number ID", the same screen
  // WHATSAPP_PHONE_NUMBER_ID came from originally.
  const wabaId = new URL(request.url).searchParams.get("wabaId");
  if (!wabaId) {
    return NextResponse.json(
      { status: "error", message: "Add ?wabaId=YOUR_WABA_ID — find it in WhatsApp Manager → API Setup." },
      { status: 400 }
    );
  }

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ status: "error", message: "WhatsApp isn't configured (missing env vars)." }, { status: 400 });
  }

  const graph = (path: string, init?: RequestInit) =>
    fetch(`https://graph.facebook.com/v21.0/${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
    }).then(async (res) => ({ ok: res.ok, status: res.status, body: await res.json().catch(() => null) }));

  try {
    const before = await graph(`${wabaId}/subscribed_apps`);
    const subscribe = await graph(`${wabaId}/subscribed_apps`, { method: "POST" });
    const after = await graph(`${wabaId}/subscribed_apps`);

    return NextResponse.json({
      status: "ok",
      wabaId,
      subscribedAppsBefore: before.body,
      subscribeCallResult: subscribe.body,
      subscribedAppsAfter: after.body,
    });
  } catch (err) {
    return NextResponse.json({ status: "error", message: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
