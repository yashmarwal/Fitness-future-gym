import "server-only";
import { getDb } from "@/server/db/client";
import { sendWhatsAppTemplate } from "@/server/services/whatsapp";
import type { BroadcastSegment } from "@/types/admin";

async function resolveRecipients(segment: BroadcastSegment) {
  const db = getDb();

  if (segment === "overdue") {
    const { data, error } = await db
      .from("members")
      .select("id, phone, full_name")
      .eq("is_active", true)
      .not("phone", "is", null)
      .lt("fee_due_date", new Date().toISOString().slice(0, 10));
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  if (segment === "inactive_14d") {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);

    const { data: members, error } = await db
      .from("members")
      .select("id, phone, full_name")
      .eq("is_active", true)
      .not("phone", "is", null);
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

  const { data, error } = await db.from("members").select("id, phone, full_name").eq("is_active", true).not("phone", "is", null);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function sendBroadcast(segment: BroadcastSegment, message: string): Promise<{ sent: number }> {
  const recipients = await resolveRecipients(segment);

  for (const recipient of recipients) {
    await sendWhatsAppTemplate({
      phone: recipient.phone as string,
      template: "announcement",
      bodyParams: [message],
      memberId: recipient.id,
    });
  }

  return { sent: recipients.length };
}
