import "server-only";
import { getDb } from "@/backend/db/client";
import { sendWhatsAppTemplate } from "@/backend/services/whatsapp";
import { sendEmailTemplate } from "@/backend/services/email";
import { createNotification } from "@/backend/services/memberNotifications";
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

    const { data: members, error } = await db
      .from("members")
      .select("id, phone, email, full_name")
      .eq("is_active", true)
      .or(HAS_CONTACT_INFO);
    if (error) throw new Error(error.message);

    const inactive = [];
    for (const member of members ?? []) {
      const { data: lastVisit } = await db
        .from("attendance")
        .select("checked_in_at")
        .eq("member_id", member.id)
        .order("checked_in_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!lastVisit || new Date(lastVisit.checked_in_at) < cutoff) {
        inactive.push(member);
      }
    }
    return inactive;
  }

  const { data, error } = await db
    .from("members")
    .select("id, phone, email, full_name")
    .eq("is_active", true)
    .or(HAS_CONTACT_INFO);
  if (error) throw new Error(error.message);
  return data ?? [];
}

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
    if (recipient.email) {
      await sendEmailTemplate({
        to: recipient.email,
        template: "announcement",
        bodyParams: [message, subject ?? ""],
        memberId: recipient.id,
      }).catch(() => {});
    }
    await createNotification({
      memberId: recipient.id,
      type: "broadcast",
      title: subject || "Gym Update",
      body: message,
    }).catch(() => {});
  }

  return { sent: recipients.length };
}
