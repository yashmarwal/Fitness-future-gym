import "server-only";
import { after } from "next/server";
import { getDb } from "@/backend/db/client";
import { getIstDateString } from "@/frontend/lib/date";
import type { FeePaymentRow } from "@/types/admin";
import { deliverMembershipCard } from "@/backend/services/membershipCardDelivery";
import { deliverPaymentInvoice } from "@/backend/services/invoiceDelivery";
import { sendWhatsAppTemplate } from "@/backend/services/whatsapp";
import { unblockMember } from "@/backend/services/admin/feeAbuse";

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

// The only durations the Record Payment form offers — keep the type and
// the UI's <select> options in lock-step (FeesManager.tsx).
export const PAYMENT_DURATION_MONTHS_OPTIONS = [1, 3, 6, 12] as const;
export type PaymentDurationMonths = (typeof PAYMENT_DURATION_MONTHS_OPTIONS)[number];

// Real bug this fixes: a member who signs up themselves never has `plan`/
// `fee_amount` set (nothing in the signup flow touches those columns —
// they're admin-only fields), and recordManualPayment previously only ever
// touched `fee_due_date`. That left plan/fee_amount permanently null for
// anyone whose payment was recorded before anyone happened to also visit
// Admin -> Members and type them in by hand — which in turn meant (a) they
// stayed stuck in the "Needs Review — No Paid-Up Fees" list forever
// despite genuinely being paid up, since that list's flag logic keyed off
// plan/fee_amount instead of the real signal, fee_due_date; and (b) their
// membership card silently never sent, since deliverMembershipCard
// requires both to be set. Backfilling them here — only when missing,
// never overwriting a real custom plan name — fixes both for good.
const DURATION_PLAN_LABELS: Record<PaymentDurationMonths, string> = {
  1: "Monthly",
  3: "Quarterly",
  6: "Half-Yearly",
  12: "Annual",
};

export async function recordManualPayment(
  memberId: string,
  amount: number,
  method: "upi" | "cash" | "manual",
  durationMonths: PaymentDurationMonths
): Promise<void> {
  const db = getDb();

  const { data: member, error: memberError } = await db
    .from("members")
    .select("full_name, membership_number, phone, email, plan, fee_amount, joined_at, fee_due_date")
    .eq("id", memberId)
    .maybeSingle();
  if (memberError) throw new Error(`Failed to load member: ${memberError.message}`);
  if (!member) throw new Error("Member not found.");

  const { data: payment, error } = await db
    .from("fee_payments")
    .insert({
      member_id: memberId,
      amount,
      method,
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .select("id, paid_at")
    .single();
  if (error) throw new Error(`Failed to record payment: ${error.message}`);

  // Anchor the next due date to the CURRENT due date (the billing cycle),
  // not to today — paying late (e.g. 10 days after the due date) must not
  // push the whole cycle forward, and joined_at is never touched here.
  // Extend by whatever the admin actually collected (1/3/6/12 months) —
  // previously this was hardcoded to +1 month regardless of plan, so a
  // quarterly/annual payment would silently mark the member "due again" and
  // eventually auto-block them after just one month.
  //
  // For a member's very first payment there's no fee_due_date yet (it's
  // null until the first payment is ever recorded — see schema.sql), so the
  // anchor used to fall back to *today*, the day the admin happens to get
  // around to entering it — not the day the member actually joined. A
  // member who joined 6 days ago but only gets their first payment logged
  // today would silently get 6 extra free days, and every renewal after
  // that stays offset from their real join date. joined_at (always set,
  // defaults to signup date) is the correct anchor for that first payment;
  // `new Date()` is only a last-resort fallback for the case joined_at is
  // somehow missing too.
  const anchor = member.fee_due_date
    ? new Date(member.fee_due_date)
    : member.joined_at
      ? new Date(member.joined_at)
      : new Date();
  const nextDueDate = new Date(anchor);
  nextDueDate.setMonth(nextDueDate.getMonth() + durationMonths);
  const nextDueDateStr = nextDueDate.toISOString().slice(0, 10);

  // Member profile's plan/fee_amount always reflect this payment — not
  // just backfilled when empty. Admin -> Members shows these fields, and
  // the flagging logic reads the member row, so a payment recorded here
  // that DOESN'T update them there is exactly the class of bug this
  // already broke once (see the "Needs Review" fix). Amount is
  // unambiguous — whatever was actually just collected. Plan is derived
  // from the selected duration (matching the Record Payment form's own
  // options), overwriting whatever was there before — if a custom plan
  // name (e.g. "Quarterly + PT") needs to survive routine renewal
  // payments, that needs its own field, not this one.
  const effectivePlan = DURATION_PLAN_LABELS[durationMonths];
  const effectiveFeeAmount = amount;
  const patch: Record<string, unknown> = {
    fee_due_date: nextDueDateStr,
    plan: effectivePlan,
    fee_amount: effectiveFeeAmount,
  };

  await db.from("members").update(patch).eq("id", memberId);

  // Recording a payment is the "fees updated" signal that lifts a
  // fee-abuse block (admin/feeAbuse.ts) — unconditional, not just for
  // members the auto-block cron caught, since admin might also have
  // blocked someone manually for the same underlying reason. A harmless
  // no-op for a member who was never blocked in the first place.
  await unblockMember(memberId).catch(() => {});

  // Recording a payment is one of the two explicit triggers for re-sending
  // the membership card (the other is a plan change, in admin/members.ts) —
  // but only when it's actually a DIFFERENT plan/amount than what the
  // member already has, same guard as updateMember's cardRelevantChange.
  // Comparing against `member.plan`/`member.fee_amount` (the pre-update
  // row, fetched above) rather than effectivePlan/effectiveFeeAmount
  // themselves — a member on an identical monthly renewal would otherwise
  // get a fresh WhatsApp template send + card email every single month for
  // no reason, since effectivePlan/effectiveFeeAmount are recomputed from
  // this payment regardless of whether anything changed. A member whose
  // plan/fee_amount was never set yet (first-ever payment) always counts as
  // a change, so the card still goes out the first time.
  const cardRelevantChange =
    (member.plan || null) !== effectivePlan || (member.fee_amount ?? null) !== effectiveFeeAmount;

  // Both deliveries below are real network calls (WhatsApp Cloud API, Resend
  // x2) on top of PDF generation — awaiting them here used to make every
  // "Record Payment" click wait on 3 external round-trips after the DB write
  // had already succeeded. They're best-effort and don't affect what the
  // admin sees, so `after()` defers them until the response has already gone
  // back, instead of making the save itself pay for that latency. Safe here
  // because recordManualPayment is only ever called from a Route Handler
  // (never a cron/background job), which is exactly what `after()` needs.
  after(async () => {
    await Promise.all([
      cardRelevantChange
        ? deliverMembershipCard({
            id: memberId,
            fullName: member.full_name,
            membershipNumber: member.membership_number,
            phone: member.phone,
            email: member.email,
            plan: effectivePlan,
            feeAmount: effectiveFeeAmount,
            joinedAt: member.joined_at,
          }).catch(() => {})
        : // Not card-worthy (same plan/amount as before) — a routine renewal
          // still deserves its own WhatsApp confirmation, just the lighter
          // "payment received" template instead of resending the full card.
          member.phone
          ? sendWhatsAppTemplate({
              phone: member.phone,
              template: "fee_received",
              bodyParams: [member.full_name, `Rs. ${effectiveFeeAmount.toLocaleString("en-IN")}`, nextDueDateStr],
              memberId,
            }).catch(() => {})
          : Promise.resolve(),
      // Every recorded payment gets its own PDF receipt, separate from the
      // membership card above (which only re-sends when plan/fee actually
      // change, not on every routine renewal payment).
      deliverPaymentInvoice({
        memberId,
        memberName: member.full_name,
        membershipNumber: member.membership_number,
        email: member.email,
        paymentId: payment.id,
        paidAtIso: payment.paid_at,
        plan: effectivePlan,
        durationMonths,
        amount,
        method,
        nextDueDate: nextDueDateStr,
      }).catch(() => {}),
    ]);
  });
}

// Powers the member profile page's payment history — same shape as
// listFeePayments, just scoped to one member instead of the global feed.
export async function listFeePaymentsForMember(memberId: string): Promise<FeePaymentRow[]> {
  const db = getDb();
  const { data, error } = await db
    .from("fee_payments")
    .select("id, amount, method, status, paid_at, created_at, members(full_name, membership_number)")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load member's payments: ${error.message}`);

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

// A correction tool, not a re-derivation of the billing cycle — editing a
// payment's amount/method fixes a typo on the record itself, but
// deliberately does NOT touch the member's fee_due_date, plan, or
// fee_amount, and doesn't re-send the membership card or invoice.
// Recomputing those correctly would mean knowing what the due date would
// have been WITHOUT this payment's original contribution, which isn't
// something this table can reconstruct once later payments may have
// happened since. If a correction also needs the due date adjusted,
// that's a separate, deliberate edit from Admin → Members.
export async function updateFeePayment(
  id: string,
  input: { amount?: number; method?: "upi" | "cash" | "manual" }
): Promise<void> {
  const db = getDb();
  const patch: Record<string, unknown> = {};
  if (input.amount !== undefined) patch.amount = input.amount;
  if (input.method !== undefined) patch.method = input.method;
  if (Object.keys(patch).length === 0) return;

  const { error } = await db.from("fee_payments").update(patch).eq("id", id);
  if (error) throw new Error(`Failed to update payment: ${error.message}`);
}

// Same scope note as updateFeePayment above — removes only the payment
// record itself. It does not revert fee_due_date/plan/fee_amount, since
// those may already reflect other payments made since; if this payment
// was recorded in error, adjust the member's due date by hand from
// Admin → Members after deleting it here.
export async function deleteFeePayment(id: string): Promise<void> {
  const db = getDb();
  const { error } = await db.from("fee_payments").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete payment: ${error.message}`);
}

export async function sumPaidThisMonth(): Promise<number> {
  const db = getDb();
  // IST-explicit "1st of this month" start, not server-local (Vercel runs
  // UTC) — a payment recorded in the first ~5.5 hours of an IST calendar
  // day could otherwise fall on the wrong side of the month boundary.
  const startOfMonthIso = `${getIstDateString().slice(0, 7)}-01T00:00:00+05:30`;

  const { data, error } = await db
    .from("fee_payments")
    .select("amount")
    .eq("status", "paid")
    .gte("paid_at", new Date(startOfMonthIso).toISOString());

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
