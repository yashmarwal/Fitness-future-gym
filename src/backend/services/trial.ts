import "server-only";
import { randomInt } from "node:crypto";
import { after } from "next/server";
import { getDb } from "@/backend/db/client";
import { sendWhatsAppTemplate } from "@/backend/services/whatsapp";
import { sendEmailTemplate } from "@/backend/services/email";
import { normalizePhone } from "@/backend/lib/phone";
import { normalizeEmail } from "@/backend/lib/email";
import { mapWithConcurrency } from "@/backend/lib/concurrency";

const TRIAL_DURATION_DAYS = 2;
const NOTIFY_CONCURRENCY = 8;
const TRIAL_REGISTRATION_RETENTION_DAYS = 30;

function shiftLabel(shift: "morning" | "evening"): string {
  return shift === "morning" ? "Morning (06:00 - 11:00)" : "Evening (16:30 - 22:30)";
}

function generateTrialCode(): string {
  return `FF2-TRIAL-${randomInt(1000, 9999)}`;
}

export type ClaimTrialResult =
  | { status: "claimed"; trialCode: string; endsAt: string }
  | { status: "already_claimed" };

// trial_phone_claims is the real, permanent, server-side enforcement of
// "one free trial per mobile number, ever" — trial_registrations' own
// phone-unique constraint only blocks a repeat claim while that detail row
// is still live, and it's purged 30 days after creation (see
// deleteOldTrialRegistrations below). Anything the client checks first
// (localStorage) is just a fast-path UX hint.
export async function claimTrial(input: {
  fullName: string;
  phone: string;
  email: string;
  shift: "morning" | "evening";
}): Promise<ClaimTrialResult> {
  const db = getDb();
  const phone = normalizePhone(input.phone);
  const email = normalizeEmail(input.email);

  // Without normalizing first, "+91 98765 43210" and "9876543210" are
  // different strings to this .eq() check even though they're the same
  // number — the actual "one free trial per mobile, ever" enforcement
  // (trial_phone_claims' primary key) has the same gap.
  const { data: existing, error: existingError } = await db
    .from("trial_phone_claims")
    .select("phone")
    .eq("phone", phone)
    .maybeSingle();
  if (existingError) throw new Error(`Failed to check existing trial: ${existingError.message}`);
  if (existing) return { status: "already_claimed" };

  const trialCode = generateTrialCode();
  const startsAt = new Date();
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + TRIAL_DURATION_DAYS);
  const endsAtStr = endsAt.toISOString().slice(0, 10);

  const { error: insertError } = await db.from("trial_registrations").insert({
    full_name: input.fullName,
    phone,
    email,
    shift: input.shift,
    trial_code: trialCode,
    starts_at: startsAt.toISOString().slice(0, 10),
    ends_at: endsAtStr,
  });
  if (insertError) throw new Error(`Failed to save trial claim: ${insertError.message}`);

  // Best-effort — trial_registrations' own phone-unique constraint still
  // catches a near-simultaneous double-claim even if this insert somehow
  // fails, so a missing claims row isn't a correctness gap today, only a
  // gap in the post-30-day guard.
  const { error: claimError } = await db.from("trial_phone_claims").insert({ phone });
  if (claimError) console.error("[trial] failed to record permanent phone claim:", claimError.message);

  const label = shiftLabel(input.shift);
  // Best-effort, and the trial is already claimed (the row's inserted) by
  // the time this fires — deferred so the public signup form doesn't wait
  // on a WhatsApp + email round-trip before showing "claimed". Safe here
  // since claimTrial is only ever called from a Route Handler (see
  // api/trial/register/route.ts), same reasoning as feesAdmin.ts.
  after(async () => {
    await Promise.all([
      sendWhatsAppTemplate({
        phone,
        template: "trial_pass",
        bodyParams: [input.fullName, trialCode, label, endsAtStr],
      }).catch(() => {}),
      sendEmailTemplate({
        to: email,
        template: "trial_pass",
        bodyParams: [input.fullName, trialCode, label, endsAtStr],
      }).catch(() => {}),
    ]);
  });

  return { status: "claimed", trialCode, endsAt: endsAtStr };
}

// Daily cron: nudge anyone whose trial window has ended to convert, once.
export async function runTrialConversionReminder(): Promise<{ sent: number }> {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  const { data: trials, error } = await db
    .from("trial_registrations")
    .select("id, full_name, phone, email, trial_code")
    .eq("status", "active")
    .is("reminder_sent_at", null)
    .lte("ends_at", today);

  if (error) throw new Error(`Failed to load trials for reminder: ${error.message}`);

  await mapWithConcurrency(trials ?? [], NOTIFY_CONCURRENCY, async (trial) => {
    await sendWhatsAppTemplate({
      phone: trial.phone,
      template: "trial_reminder",
      bodyParams: [trial.full_name, trial.trial_code],
    }).catch(() => {});
    await sendEmailTemplate({
      to: trial.email,
      template: "trial_reminder",
      bodyParams: [trial.full_name, trial.trial_code],
    }).catch(() => {});

    await db.from("trial_registrations").update({ reminder_sent_at: new Date().toISOString() }).eq("id", trial.id);
  });

  return { sent: (trials ?? []).length };
}

// Only trial_registrations' own detail row (name/email/shift/code) is
// purged — trial_phone_claims (the permanent "already had a free trial"
// record) is never touched here, see claimTrial above.
export async function deleteOldTrialRegistrations(): Promise<{ deleted: number }> {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - TRIAL_REGISTRATION_RETENTION_DAYS);

  const { data, error } = await db.from("trial_registrations").delete().lt("created_at", cutoff.toISOString()).select("id");

  if (error) throw new Error(`Failed to delete old trial registrations: ${error.message}`);
  return { deleted: data?.length ?? 0 };
}
