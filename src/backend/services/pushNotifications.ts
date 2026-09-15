import "server-only";
import webpush from "web-push";
import { getDb } from "@/backend/db/client";

function isConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

let vapidConfigured = false;
function ensureVapidConfigured() {
  if (vapidConfigured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:contact.fitnessfuture@gmail.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string
  );
  vapidConfigured = true;
}

export async function savePushSubscription(
  memberId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
): Promise<void> {
  const db = getDb();
  const { error } = await db.from("push_subscriptions").upsert(
    {
      member_id: memberId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) throw new Error(`Failed to save push subscription: ${error.message}`);
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const db = getDb();
  await db.from("push_subscriptions").delete().eq("endpoint", endpoint);
}

// Fires for exactly the same four things already going out over
// WhatsApp/email/in-app bell — fee reminders, birthdays, admin broadcasts,
// and the auto-block warning — never a new category of its own. Callers
// wrap this in .catch(() => {}), same as the other channels, so a push
// failure never blocks the primary flow.
export async function sendPushToMember(
  memberId: string,
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  if (!isConfigured()) {
    console.log(`[push:dev-mode] to=${memberId} title=${payload.title} body=${payload.body}`);
    return;
  }
  ensureVapidConfigured();

  const db = getDb();
  const { data: subs, error } = await db
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("member_id", memberId);
  if (error) throw new Error(`Failed to load push subscriptions: ${error.message}`);
  if (!subs || subs.length === 0) return;

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/dashboard",
  });

  for (const sub of subs) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, body);
    } catch (err) {
      const statusCode = (err as { statusCode?: number })?.statusCode;
      // 404/410 = the subscription is dead (uninstalled, permission
      // revoked, browser data cleared) — prune it rather than retrying
      // forever on every future send.
      if (statusCode === 404 || statusCode === 410) {
        await db.from("push_subscriptions").delete().eq("id", sub.id);
      } else {
        console.error("[push] send failed:", err instanceof Error ? err.message : err);
      }
    }
  }
}
