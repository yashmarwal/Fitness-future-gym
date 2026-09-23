import "server-only";
import { getDb } from "@/backend/db/client";
import { sendWhatsAppTemplate } from "@/backend/services/whatsapp";
import { sendEmailTemplate } from "@/backend/services/email";
import { createNotification } from "@/backend/services/memberNotifications";
import { sendPushToMember } from "@/backend/services/pushNotifications";
import { mapWithConcurrency } from "@/backend/lib/concurrency";

const FEE_REMINDER_WINDOW_DAYS = 3;

// See backend/lib/concurrency.ts — both loops below used to send to members
// one at a time, which for a gym-wide sweep (birthdays across ~400 members,
// or everyone due in the next few days) risked this cron's function timeout
// killing the request partway through, silently skipping whoever hadn't
// been reached yet.
const NOTIFY_CONCURRENCY = 8;

export async function runBirthdayCheck(): Promise<{ sent: number }> {
  const db = getDb();
  const { data: members, error } = await db
    .from("members")
    .select("id, phone, email, full_name, date_of_birth")
    .eq("is_active", true)
    .not("date_of_birth", "is", null);

  if (error) throw new Error(`Failed to load members: ${error.message}`);

  const today = new Date();
  const todaysBirthdays = (members ?? []).filter((m) => {
    const dob = new Date(m.date_of_birth as string);
    return dob.getUTCMonth() === today.getUTCMonth() && dob.getUTCDate() === today.getUTCDate();
  });

  await mapWithConcurrency(todaysBirthdays, NOTIFY_CONCURRENCY, async (member) => {
    if (member.phone) {
      await sendWhatsAppTemplate({
        phone: member.phone,
        template: "birthday",
        bodyParams: [member.full_name],
        memberId: member.id,
      }).catch(() => {});
    }
    if (member.email) {
      await sendEmailTemplate({
        to: member.email,
        template: "birthday",
        bodyParams: [member.full_name],
        memberId: member.id,
      }).catch(() => {});
    }
    await sendPushToMember(member.id, {
      title: "🎂 Happy Birthday!",
      body: `Happy Birthday, ${member.full_name}! Here's to another year of raw strength.`,
    }).catch(() => {});
  });

  return { sent: todaysBirthdays.length };
}

export async function runFeeReminderCheck(): Promise<{ sent: number }> {
  const db = getDb();
  const windowEnd = new Date();
  windowEnd.setDate(windowEnd.getDate() + FEE_REMINDER_WINDOW_DAYS);

  const { data: members, error } = await db
    .from("members")
    .select("id, phone, email, full_name, fee_due_date")
    .eq("is_active", true)
    .not("fee_due_date", "is", null)
    .lte("fee_due_date", windowEnd.toISOString().slice(0, 10))
    .gte("fee_due_date", new Date().toISOString().slice(0, 10));

  if (error) throw new Error(`Failed to load members: ${error.message}`);

  await mapWithConcurrency(members ?? [], NOTIFY_CONCURRENCY, async (member) => {
    if (member.phone) {
      await sendWhatsAppTemplate({
        phone: member.phone,
        template: "fee_reminder",
        bodyParams: [member.full_name, member.fee_due_date as string],
        memberId: member.id,
      }).catch(() => {});
    }
    if (member.email) {
      await sendEmailTemplate({
        to: member.email,
        template: "fee_reminder",
        bodyParams: [member.full_name, member.fee_due_date as string],
        memberId: member.id,
      }).catch(() => {});
    }
    await createNotification({
      memberId: member.id,
      type: "fee_reminder",
      title: "Fee Due Reminder",
      body: `Your membership fee is due on ${member.fee_due_date}.`,
    }).catch(() => {});
    await sendPushToMember(member.id, {
      title: "Fee Due Reminder",
      body: `Your membership fee is due on ${member.fee_due_date}.`,
      url: "/dashboard/fees",
    }).catch(() => {});
  });

  return { sent: (members ?? []).length };
}
