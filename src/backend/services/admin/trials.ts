import "server-only";
import { getDb } from "@/backend/db/client";
import type { TrialRegistration } from "@/types/admin";
import { generateMembershipNumber } from "@/backend/services/membershipNumber";
import { deliverMembershipCard } from "@/backend/services/membershipCardDelivery";

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
// but both optional (the admin UI's "skip" button just omits them), and a
// membership card always goes out either way since a real account now exists.
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

  const membershipNumber = await generateMembershipNumber();
  const hasPayment = Boolean(input.feeAmount && input.paymentMethod);
  const feeDueDate = hasPayment || input.plan ? oneMonthFromToday() : null;

  const { data: member, error: insertError } = await db
    .from("members")
    .insert({
      membership_number: membershipNumber,
      full_name: trial.full_name,
      phone: trial.phone,
      email: trial.email,
      plan: input.plan || null,
      fee_amount: input.feeAmount ?? null,
      fee_due_date: feeDueDate,
      is_active: true,
    })
    .select("id, full_name, membership_number, phone, email, plan, joined_at")
    .single();
  if (insertError) throw new Error(`Failed to create member: ${insertError.message}`);

  if (hasPayment) {
    await db.from("fee_payments").insert({
      member_id: member.id,
      amount: input.feeAmount,
      method: input.paymentMethod,
      status: "paid",
      paid_at: new Date().toISOString(),
    });
  }

  await db.from("trial_registrations").update({ status: "converted" }).eq("id", trialId);

  await deliverMembershipCard({
    id: member.id,
    fullName: member.full_name,
    membershipNumber: member.membership_number,
    phone: member.phone,
    email: member.email,
    plan: member.plan,
    joinedAt: member.joined_at,
  }).catch(() => {});

  return { status: "ok", memberId: member.id };
}

function oneMonthFromToday(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}
