import "server-only";
import { getDb } from "@/backend/db/client";
import { sendWhatsAppReplyText } from "@/backend/services/whatsapp";
import { normalizePhone } from "@/backend/lib/phone";
import { BUSINESS_NAME, BUSINESS_PHONE_PRIMARY, BUSINESS_PHONE_SECONDARY } from "@/frontend/lib/siteConfig";

// This number only ever sends (OTPs, reminders, broadcasts — see
// whatsapp.ts) and this app has no inbox to read replies with, so a member
// texting it back would otherwise get silence. This is the other half of
// that: the webhook (app/api/whatsapp/webhook/route.ts) calls
// handleInboundWhatsAppMessage() for every inbound text, which sends one
// plain-text reply pointing them at a coach's real number instead.

// How long a sender goes without another nudge after getting one — long
// enough that firing off several messages in a row (normal chat behaviour
// when nobody's replying) only ever earns one reply, short enough that
// coming back a different day still gets reminded rather than permanent
// silence.
const REPLY_COOLDOWN_HOURS = 12;

// Matches the synthetic template name sendWhatsAppReplyText logs under —
// kept as the shared marker between "did we already reply to this number
// recently" (the query below) and "what did we log this send as".
const AUTO_REPLY_LOG_TEMPLATE = "auto_reply_contact_info";

function buildAutoReplyText(): string {
  return (
    `Hi! This number only sends you updates from ${BUSINESS_NAME} and can't take messages here.\n\n` +
    `For anything you need, please contact us directly:\n` +
    `Coach Vaibhav: ${BUSINESS_PHONE_PRIMARY}\n` +
    `Coach Hritik: ${BUSINESS_PHONE_SECONDARY}`
  );
}

export async function handleInboundWhatsAppMessage(rawFrom: string): Promise<void> {
  const phone = normalizePhone(rawFrom);
  const db = getDb();

  const cutoff = new Date(Date.now() - REPLY_COOLDOWN_HOURS * 60 * 60 * 1000).toISOString();
  const { data: recent, error } = await db
    .from("whatsapp_messages")
    .select("id")
    .eq("phone", phone)
    .eq("template", AUTO_REPLY_LOG_TEMPLATE)
    .gte("created_at", cutoff)
    .limit(1);

  if (error) {
    // Dedupe is a courtesy, not a correctness requirement — if the check
    // itself fails, still send rather than going silent because of it.
    console.error("[whatsapp:inbound] dedupe check failed, sending anyway:", error.message);
  } else if (recent && recent.length > 0) {
    return;
  }

  await sendWhatsAppReplyText({ phone, body: buildAutoReplyText() }).catch((err) => {
    console.error("[whatsapp:inbound] auto-reply failed:", err instanceof Error ? err.message : err);
  });
}
