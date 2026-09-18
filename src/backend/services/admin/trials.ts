import "server-only";
import { getDb } from "@/backend/db/client";
import type { TrialRegistration } from "@/types/admin";
import { insertMemberWithFreshNumber } from "@/backend/services/membershipNumber";
import { deliverMembershipCard } from "@/backend/services/membershipCardDelivery";
import { deliverPaymentInvoice } from "@/backend/services/invoiceDelivery";

export async function listTrialRegistrations(): Promise<TrialRegistration[]> {
  const db = getDb();
  const { data, error } = await db
    .from("trial_registrations")
    .select("id, full_name, phone, email, shift, trial_code, status, starts_at, ends_at, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load trial registrations: ${error.message}`);

  return (data ?? []).map((t) => ({
    id: t.id,
    fullName: t.full_name,
    phone: t.phone,
    email: t.email,
    shift: t.shift,
    trialCode: t.trial_code,
    status: t.status,
    startsAt: t.starts_at,
    endsAt: t.ends_at,
    createdAt: t.created_at,
  }));
}

export type ConvertTrialInput = {
  plan?: string;
  feeAmount?: number;
  paymentMethod?: "upi" | "cash" | "manual";
};

export type ConvertTrialResult =
  | { status: "ok"; memberId: string }
  | { status: "not_found" }
  | { status: "already_member" };

// Converting a trial claim creates the actual `members` row (the trial
// itself is just a lead, not an account) — program + payment are asked for
// but both optional (the admin UI's "skip" button just omits them). The
// card only actually goes out if both were provided now (deliverMembershipCard
// withholds it otherwise); skipping just means it'll send later once admin
// assigns a plan and fee amount from Admin → Members.
export async function convertTrialToMember(trialId: string, input: ConvertTrialInput): Promise<ConvertTrialResult> {
  const db = getDb();

  const { data: trial, error: trialError } = await db
    .from("trial_registrations")
    .select("id, full_name, phone, email, status")
    .eq("id", trialId)
    .maybeSingle();
  if (trialError) throw new Error(`Failed to load trial: ${trialError.message}`);
  if (!trial || trial.status !== "active") return { status: "not_found" };

  const { data: existingMember, error: existingError } = await db
    .from("members")
    .select("id")
    .eq("phone", trial.phone)
    .maybeSingle();
  if (existingError) throw new Error(`Failed to check existing member: ${existingError.message}`);
  if (existingMember) return { status: "already_member" };

  const hasPayment = Boolean(input.feeAmount && input.paymentMethod);
  const feeDueDate = hasPayment || input.plan ? oneMonthFromToday() : null;

  type MemberRow = {
    id: string;
    full_name: string;
    membership_number: string;
    phone: string | null;
    email: string | null;
    plan: string | null;
    fee_amount: number | null;
    joined_at: string;
  };
  const member = await insertMemberWithFreshNumber<MemberRow>(
    (membershipNumber) => ({
      membership_number: membershipNumber,
      full_name: trial.full_name,
      phone: trial.phone,
      email: trial.email,
      plan: input.plan || null,
      fee_amount: input.feeAmount ?? null,
      fee_due_date: feeDueDate,
      is_active: true,
    }),
    "id, full_name, membership_number, phone, email, plan, fee_amount, joined_at"
  );

  if (hasPayment) {
    const { data: payment, error: paymentError } = await db
      .from("fee_payments")
      .insert({
        member_id: member.id,
        amount: input.feeAmount,
        method: input.paymentMethod,
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .select("id, paid_at")
      .single();

    if (!paymentError && payment) {
      // feeDueDate above is always exactly one month out for a conversion
      // payment (oneMonthFromToday()) — this app has no per-duration
      // selector at conversion time the way the main Record Payment form
      // does, so the receipt's "duration" reflects that same fixed month.
      await deliverPaymentInvoice({
        memberId: member.id,
        memberName: member.full_name,
        membershipNumber: member.membership_number,
        email: member.email,
        paymentId: payment.id,
        paidAtIso: payment.paid_at,
        plan: member.plan ?? "Monthly",
        durationMonths: 1,
        amount: input.feeAmount as number,
        method: input.paymentMethod as "upi" | "cash" | "manual",
        nextDueDate: feeDueDate as string,
      }).catch(() => {});
    }
  }

  await db.from("trial_registrations").update({ status: "converted" }).eq("id", trialId);

  await deliverMembershipCard({
    id: member.id,
    fullName: member.full_name,
    membershipNumber: member.membership_number,
    phone: member.phone,
    email: member.email,
    plan: member.plan,
    feeAmount: member.fee_amount,
    joinedAt: member.joined_at,
  }).catch(() => {});

  return { status: "ok", memberId: member.id };
}

function oneMonthFromToday(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}
