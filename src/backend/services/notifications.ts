import "server-only";
import { getDb } from "@/backend/db/client";
import { sendWhatsAppTemplate } from "@/backend/services/whatsapp";

const FEE_REMINDER_WINDOW_DAYS = 3;

export async function runBirthdayCheck(): Promise<{ sent: number }> {
  const db = getDb();
  const { data: members, error } = await db
    .from("members")
    .select("id, phone, full_name, date_of_birth")
    .eq("is_active", true)
    .not("date_of_birth", "is", null)
    .not("phone", "is", null);

  if (error) throw new Error(`Failed to load members: ${error.message}`);

  const today = new Date();
  const todaysBirthdays = (members ?? []).filter((m) => {
    const dob = new Date(m.date_of_birth as string);
    return dob.getUTCMonth() === today.getUTCMonth() && dob.getUTCDate() === today.getUTCDate();
  });

  for (const member of todaysBirthdays) {
    await sendWhatsAppTemplate({
      phone: member.phone as string,
      template: "birthday",
      bodyParams: [member.full_name],
      memberId: member.id,
    });
  }

  return { sent: todaysBirthdays.length };
}

export async function runFeeReminderCheck(): Promise<{ sent: number }> {
  const db = getDb();
  const windowEnd = new Date();
  windowEnd.setDate(windowEnd.getDate() + FEE_REMINDER_WINDOW_DAYS);

  const { data: members, error } = await db
    .from("members")
    .select("id, phone, full_name, fee_due_date")
    .eq("is_active", true)
    .not("fee_due_date", "is", null)
    .not("phone", "is", null)
    .lte("fee_due_date", windowEnd.toISOString().slice(0, 10))
    .gte("fee_due_date", new Date().toISOString().slice(0, 10));

  if (error) throw new Error(`Failed to load members: ${error.message}`);

  for (const member of members ?? []) {
    await sendWhatsAppTemplate({
      phone: member.phone as string,
      template: "fee_reminder",
      bodyParams: [member.full_name, member.fee_due_date as string],
      memberId: member.id,
    });
  }

  return { sent: (members ?? []).length };
}
