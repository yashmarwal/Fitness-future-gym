import "server-only";
import { getDb } from "@/backend/db/client";
import { sendWhatsAppTemplate } from "@/backend/services/whatsapp";
import { createNotification } from "@/backend/services/memberNotifications";
import { sendPushToMember } from "@/backend/services/pushNotifications";
import type { BroadcastSegment } from "@/types/admin";

const HAS_CONTACT_INFO = "phone.not.is.null,email.not.is.null";

async function resolveRecipients(segment: BroadcastSegment) {
  const db = getDb();

  if (segment === "overdue") {
    const { data, error } = await db
      .from("members")
      .select("id, phone, email, full_name")
      .eq("is_active", true)
      .or(HAS_CONTACT_INFO)
      .lt("fee_due_date", new Date().toISOString().slice(0, 10));
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  if (segment === "inactive_14d") {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);

    // members.last_checked_in_at is maintained on every check-in (both the
    // self-service and admin-manual paths — see attendance.ts) specifically
    // so inactivity can be read straight off the members row instead of
    // querying the attendance log per member (which used to run one extra
    // query per active member here) — alerts.ts already does it this way.
    const { data, error } = await db
      .from("members")
      .select("id, phone, email, full_name")
      .eq("is_active", true)
      .or(HAS_CONTACT_INFO)
      .or(`last_checked_in_at.is.null,last_checked_in_at.lt.${cutoff.toISOString()}`);
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  const { data, error } = await db
    .from("members")
    .select("id, phone, email, full_name")
    .eq("is_active", true)
    .or(HAS_CONTACT_INFO);
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Broadcasts go over WhatsApp only now (explicit ask: admin updates/offers
// should never land in a member's inbox) — the in-app bell and push still
// fire regardless of phone, so an email-only member isn't left with nothing,
// just not emailed. Every other WhatsApp-triggered message (OTP, fee
// reminders, the welcome card, etc.) is untouched; this only removes the
// email leg of admin broadcasts specifically. `subject`, when set, is still
// used as the in-app/push notification's title — it just no longer doubles
// as an email subject line since there's no email to have one.
export async function sendBroadcast(
  segment: BroadcastSegment,
  message: string,
  subject?: string
): Promise<{ sent: number }> {
  const recipients = await resolveRecipients(segment);

  for (const recipient of recipients) {
    if (recipient.phone) {
      await sendWhatsAppTemplate({
        phone: recipient.phone,
        template: "announcement",
        bodyParams: [message],
        memberId: recipient.id,
      }).catch(() => {});
    }
    await createNotification({
      memberId: recipient.id,
      type: "broadcast",
      title: subject || "Gym Update",
      body: message,
    }).catch(() => {});
    await sendPushToMember(recipient.id, {
      title: subject || "Gym Update",
      body: message,
    }).catch(() => {});
  }

  return { sent: recipients.length };
}
