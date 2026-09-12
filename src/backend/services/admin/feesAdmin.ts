import "server-only";
import { getDb } from "@/backend/db/client";
import type { FeePaymentRow } from "@/types/admin";
import { sendWhatsAppTemplate } from "@/backend/services/whatsapp";

export async function listFeePayments(limit = 100): Promise<FeePaymentRow[]> {
  const db = getDb();
  const { data, error } = await db
    .from("fee_payments")
    .select("id, amount, method, status, paid_at, created_at, members(full_name, membership_number)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load fee payments: ${error.message}`);

  return (data ?? []).map((row) => {
    const member = row.members as unknown as { full_name: string; membership_number: string } | null;
    return {
      id: row.id,
      memberName: member?.full_name ?? "Unknown",
      membershipNumber: member?.membership_number ?? "—",
      amount: row.amount,
      method: row.method,
      status: row.status,
      paidAt: row.paid_at,
      createdAt: row.created_at,
    };
  });
}

export async function recordManualPayment(memberId: string, amount: number, method: "upi" | "cash" | "manual"): Promise<void> {
  const db = getDb();

  const { data: member, error: memberError } = await db
    .from("members")
    .select("full_name, phone, fee_due_date, joined_at")
    .eq("id", memberId)
    .maybeSingle();
  if (memberError) throw new Error(`Failed to load member: ${memberError.message}`);
  if (!member) throw new Error("Member not found.");

  const { error } = await db.from("fee_payments").insert({
    member_id: memberId,
    amount,
    method,
    status: "paid",
    paid_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Failed to record payment: ${error.message}`);

  // Anchor the next due date to the CURRENT due date (the billing cycle),
  // not to today — paying late (e.g. 10 days after the due date) must not
  // push the whole cycle forward, and joined_at is never touched here.
  const anchor = member.fee_due_date ? new Date(member.fee_due_date) : new Date();
  const nextDueDate = new Date(anchor);
  nextDueDate.setMonth(nextDueDate.getMonth() + 1);
  const nextDueDateStr = nextDueDate.toISOString().slice(0, 10);

  await db.from("members").update({ fee_due_date: nextDueDateStr }).eq("id", memberId);

  if (member.phone) {
    await sendWhatsAppTemplate({
      phone: member.phone,
      template: "payment_confirmation",
      bodyParams: [member.full_name, String(amount), nextDueDateStr],
      memberId,
    }).catch(() => {});
  }
}

export async function sumPaidThisMonth(): Promise<number> {
  const db = getDb();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await db
    .from("fee_payments")
    .select("amount")
    .eq("status", "paid")
    .gte("paid_at", startOfMonth.toISOString());

  if (error) throw new Error(`Failed to sum payments: ${error.message}`);
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
}

export async function countOverdueMembers(): Promise<number> {
  const db = getDb();
  const { count, error } = await db
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .lt("fee_due_date", new Date().toISOString().slice(0, 10));

  if (error) throw new Error(`Failed to count overdue members: ${error.message}`);
  return count ?? 0;
}
