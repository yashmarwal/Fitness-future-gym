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
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error", message: "Log into /admin first." }, { status: 401 });

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return NextResponse.json({ status: "error", message: "WhatsApp isn't configured (missing env vars)." }, { status: 400 });
  }

  const graph = (path: string, init?: RequestInit) =>
    fetch(`https://graph.facebook.com/v21.0/${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
    }).then(async (res) => ({ ok: res.ok, status: res.status, body: await res.json().catch(() => null) }));

  try {
    const phone = await graph(`${phoneNumberId}?fields=whatsapp_business_account,display_phone_number`);
    const wabaId = phone.body?.whatsapp_business_account?.id;
    if (!phone.ok || !wabaId) {
      return NextResponse.json({ status: "error", step: "look up WABA from phone number", detail: phone.body }, { status: 400 });
    }

    const before = await graph(`${wabaId}/subscribed_apps`);
    const subscribe = await graph(`${wabaId}/subscribed_apps`, { method: "POST" });
    const after = await graph(`${wabaId}/subscribed_apps`);

    return NextResponse.json({
      status: "ok",
      displayPhoneNumber: phone.body?.display_phone_number,
      wabaId,
      subscribedAppsBefore: before.body,
      subscribeCallResult: subscribe.body,
      subscribedAppsAfter: after.body,
    });
  } catch (err) {
    return NextResponse.json({ status: "error", message: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
