import "server-only";
import { randomInt } from "node:crypto";
import { getDb } from "@/backend/db/client";
import { sendWhatsAppTemplate } from "@/backend/services/whatsapp";
import { sendEmailTemplate } from "@/backend/services/email";

const TRIAL_DURATION_DAYS = 2;

function shiftLabel(shift: "morning" | "evening"): string {
  return shift === "morning" ? "Morning (06:00 - 11:00)" : "Evening (16:30 - 22:30)";
}

function generateTrialCode(): string {
  return `FF2-TRIAL-${randomInt(1000, 9999)}`;
}

export type ClaimTrialResult =
  | { status: "claimed"; trialCode: string; endsAt: string }
  | { status: "already_claimed" };

// Phone is unique on trial_registrations — that's the real, server-side
// enforcement of "one free trial per mobile number, ever." Anything the
// client checks first (localStorage) is just a fast-path UX hint.
export async function claimTrial(input: {
  fullName: string;
  phone: string;
  email: string;
  shift: "morning" | "evening";
}): Promise<ClaimTrialResult> {
  const db = getDb();

  const { data: existing, error: existingError } = await db
    .from("trial_registrations")
    .select("id")
    .eq("phone", input.phone)
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
    phone: input.phone,
    email: input.email,
    shift: input.shift,
    trial_code: trialCode,
    starts_at: startsAt.toISOString().slice(0, 10),
    ends_at: endsAtStr,
  });
  if (insertError) throw new Error(`Failed to save trial claim: ${insertError.message}`);

  const label = shiftLabel(input.shift);
  await sendWhatsAppTemplate({
    phone: input.phone,
    template: "trial_pass",
    bodyParams: [input.fullName, trialCode, label, endsAtStr],
  }).catch(() => {});
  await sendEmailTemplate({
    to: input.email,
    template: "trial_pass",
    bodyParams: [input.fullName, trialCode, label, endsAtStr],
  }).catch(() => {});

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

  for (const trial of trials ?? []) {
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
  }

  return { sent: (trials ?? []).length };
}
