import "server-only";
import { after } from "next/server";
import { getDb } from "@/backend/db/client";
import { issueOtp, checkOtp, consumeOtp } from "@/backend/auth/otp";
import { sendWhatsAppTemplate } from "@/backend/services/whatsapp";
import { sendEmailTemplate } from "@/backend/services/email";
import { insertMemberWithFreshNumber } from "@/backend/services/membershipNumber";
import { applyLegacyFeeImport } from "@/backend/services/legacyFeeImport";
import { createMemberSession } from "@/backend/auth/session";
import { normalizePhone, looksLikePhone, isPlausiblePhone } from "@/backend/lib/phone";
import { normalizeEmail } from "@/backend/lib/email";

const PENDING_SIGNUP_RETENTION_DAYS = 2;

// An abandoned signup (code requested, never verified) otherwise sits in
// pending_signups forever — not data-corrupting (a retry just upserts over
// it, since phone is unique with onConflict: "phone"), but unbounded and
// inconsistent with every other dated table in this app having a retention
// policy. 2 days comfortably outlives the 15-minute OTP TTL and any
// reasonable "let me find my phone" delay.
export async function deleteOldPendingSignups(): Promise<{ deleted: number }> {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - PENDING_SIGNUP_RETENTION_DAYS);

  const { data, error } = await db
    .from("pending_signups")
    .delete()
    .lt("created_at", cutoff.toISOString())
    .select("id");

  if (error) throw new Error(`Failed to delete old pending signups: ${error.message}`);
  return { deleted: data?.length ?? 0 };
}

export type RequestOtpResult =
  | { status: "sent"; devCode?: string; phone: string }
  | { status: "not_found" };

// Accepts either a phone number or an email as the login identifier. Looked
// up via two separate .eq() calls (not a single .or() with the raw value
// interpolated in) so nothing in user input can ever reach PostgREST's
// filter-string syntax.
export async function requestMemberOtp(identifier: string): Promise<RequestOtpResult> {
  const db = getDb();
  const phoneCandidate = looksLikePhone(identifier) ? normalizePhone(identifier) : identifier;

  const { data: byPhone, error: phoneError } = await db
    .from("members")
    .select("id, phone, email")
    .eq("phone", phoneCandidate)
    .maybeSingle();
  if (phoneError) throw new Error(`Failed to look up member: ${phoneError.message}`);

  let member = byPhone;
  if (!member) {
    // .limit(1) before .maybeSingle() defensively guards against a 500 if
    // more than one member ever ends up sharing an email (email has no DB
    // unique constraint prior to this — see registerMember for the new
    // app-level check, and the ALTER TABLE migration this needs).
    const { data: byEmail, error: emailError } = await db
      .from("members")
      .select("id, phone, email")
      .eq("email", normalizeEmail(identifier))
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (emailError) throw new Error(`Failed to look up member: ${emailError.message}`);
    member = byEmail;
  }

  if (!member || !member.phone) return { status: "not_found" };

  const code = await issueOtp(member.phone);
  // null means a still-valid code was issued moments ago (see issueOtp) —
  // don't fire a second round of messages for what's almost certainly a
  // double-tap or an immediate resend; the original message is still good.
  if (code) {
    // Each channel is independent — a WhatsApp failure (bad token, rate
    // limit, API outage) must not stop the email from going out, and vice
    // versa. Run concurrently, not one after the other: they don't depend
    // on each other's result, so awaiting them sequentially just adds both
    // networks' latency together instead of paying for whichever is slower.
    await Promise.all([
      sendWhatsAppTemplate({ phone: member.phone, template: "otp", bodyParams: [code], memberId: member.id }).catch(() => {}),
      member.email
        ? sendEmailTemplate({ to: member.email, template: "otp", bodyParams: [code], memberId: member.id }).catch(() => {})
        : Promise.resolve(),
    ]);
  }

  // Gated purely on NODE_ENV, not on whether WhatsApp is configured — email
  // is a required field now and always gets the code independently, so an
  // unconfigured WhatsApp is no longer a reason to echo the real OTP back
  // in an HTTP response body once this is actually deployed (Vercel sets
  // NODE_ENV=production for both Production and Preview deployments).
  const isDev = process.env.NODE_ENV !== "production";
  return { status: "sent", devCode: isDev ? (code ?? undefined) : undefined, phone: member.phone };
}

export type VerifyOtpResult =
  | { status: "success" }
  | { status: "invalid" }
  | { status: "not_found" }
  | { status: "email_already_registered" };

async function verifyAndCreateSession(phone: string, code: string) {
  const check = await checkOtp(phone, code);
  if (!check.valid) return { status: "invalid" as const };

  const db = getDb();
  const { data: member, error } = await db
    .from("members")
    .select("id, membership_number, full_name, email")
    .eq("phone", phone)
    .maybeSingle();

  if (error) throw new Error(`Failed to look up member: ${error.message}`);
  if (!member) return { status: "not_found" as const };

  await createMemberSession(member.id, member.membership_number);
  // Only spent once the session was actually created — a code that
  // checked out correctly must not be burned by an unrelated failure.
  await consumeOtp(check.otpId);
  return { status: "success" as const, member };
}

export async function verifyMemberOtpAndLogin(phone: string, code: string): Promise<VerifyOtpResult> {
  const result = await verifyAndCreateSession(phone, code);
  return { status: result.status };
}

// Signup's actual account creation: the members row (and its membership
// number) is only created here, once the OTP is verified — not at
// registerMember time. That's what guarantees an abandoned signup never
// occupies a phone/email or burns a membership number (see registerMember).
export async function verifySignupOtpAndLogin(phone: string, code: string): Promise<VerifyOtpResult> {
  // Checked, not yet consumed: account creation below has several steps
  // that can throw (a membership-number collision, an email race, a
  // transient DB error), and none of those are the code's fault. Consuming
  // it up front meant any one of those failures permanently burned a
  // genuinely correct code — every retry with it then wrongly reported
  // "incorrect or expired." The code is only spent once signup actually
  // finishes, right before each `return`.
  const check = await checkOtp(phone, code);
  if (!check.valid) return { status: "invalid" };

  const db = getDb();

  // A verified member with this phone already exists (e.g. they finished
  // signup earlier and are just re-verifying a stray tab) — treat as login.
  const { data: existingMember, error: existingError } = await db
    .from("members")
    .select("id, membership_number, full_name, email")
    .eq("phone", phone)
    .maybeSingle();
  if (existingError) throw new Error(`Failed to look up member: ${existingError.message}`);

  if (existingMember) {
    await createMemberSession(existingMember.id, existingMember.membership_number);
    await consumeOtp(check.otpId);
    return { status: "success" };
  }

  const { data: pending, error: pendingError } = await db
    .from("pending_signups")
    .select("full_name, email, date_of_birth, address")
    .eq("phone", phone)
    .maybeSingle();
  if (pendingError) throw new Error(`Failed to look up pending signup: ${pendingError.message}`);
  if (!pending) return { status: "not_found" };

  // registerMember already checked the email wasn't taken at staging time,
  // but two people can stage a pending signup with the same brand-new email
  // seconds apart and both verify around the same time — this is the real,
  // race-safe backstop (relies on the members.email unique constraint; see
  // the migration in schema.sql).
  type MemberRow = { id: string; membership_number: string; full_name: string; email: string | null };
  let member: MemberRow;
  try {
    member = await insertMemberWithFreshNumber<MemberRow>(
      (membershipNumber) => ({
        membership_number: membershipNumber,
        full_name: pending.full_name,
        phone,
        email: pending.email,
        date_of_birth: pending.date_of_birth,
        address: pending.address,
        is_active: true,
      }),
      "id, membership_number, full_name, email, joined_at, plan"
    );
  } catch (err) {
    if (err instanceof Error && err.message.includes("email")) {
      // The code was still genuinely correct — this just isn't a usable
      // outcome, so leave it unconsumed rather than burn it on a failure
      // that a different email (not a different code) is what fixes.
      return { status: "email_already_registered" };
    }
    throw err;
  }

  await db.from("pending_signups").delete().eq("phone", phone);

  // Silent, best-effort: if this phone matches a leftover record from the
  // old gym software, carry their real plan/due date over — see
  // legacyFeeImport.ts. Deferred via after() rather than awaited: it can
  // never fail or affect this response either way (it swallows its own
  // errors internally), so there's no reason to make the person waiting to
  // reach their dashboard sit through it. after() (not a bare fire-and-
  // forget call) is what guarantees Vercel actually lets it finish running
  // after the response is sent, instead of possibly freezing the function
  // mid-lookup.
  after(() => applyLegacyFeeImport(member.id, phone));

  await createMemberSession(member.id, member.membership_number);
  await consumeOtp(check.otpId);

  // No welcome/card message here on purpose — a fresh signup has no plan
  // or fee assigned yet, and deliverMembershipCard withholds the card
  // until admin sets both via Admin → Members. That later edit is what
  // actually sends it (see admin/members.ts).

  return { status: "success" };
}

export type RegisterResult =
  | { status: "sent"; devCode?: string; phone: string }
  | { status: "already_registered" }
  | { status: "email_already_registered" }
  | { status: "invalid_phone" };

// Only stages the signup — nothing is written to `members` (and no
// membership number is generated) until the OTP is verified in
// verifySignupOtpAndLogin. Previously the member row was created here,
// which meant an abandoned or failed verification permanently occupied the
// phone number (and email), so retrying signup with the same details
// always came back "already registered" even though no verified account
// existed. Upserting on phone means retrying simply overwrites the
// still-pending attempt.
export async function registerMember(input: {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  dateOfBirth?: string;
}): Promise<RegisterResult> {
  const db = getDb();
  const phone = normalizePhone(input.phone);
  const email = normalizeEmail(input.email);

  // Catches garbage input before it's staged and silently fails WhatsApp
  // delivery with nothing useful surfaced to the signer-upper — they'd
  // otherwise see "sent" and only the email (if valid) would ever arrive.
  if (!isPlausiblePhone(phone)) return { status: "invalid_phone" };

  // Phone and email are two unrelated lookups — run them concurrently
  // rather than one after the other. Errors/results are still checked in
  // the same order as before (phone first), so a phone AND email collision
  // still reports "already_registered", exactly like the sequential
  // version did — this only changes when the two queries fire, not the
  // outcome.
  const [existingResult, existingEmailResult] = await Promise.all([
    db.from("members").select("id").eq("phone", phone).maybeSingle(),
    db.from("members").select("id").eq("email", email).maybeSingle(),
  ]);
  if (existingResult.error) throw new Error(`Failed to check existing member: ${existingResult.error.message}`);
  if (existingResult.data) return { status: "already_registered" };

  // Email has no DB-level unique constraint prior to this fix (see the
  // migration in schema.sql), and without this check two different phone
  // numbers could both complete signup with the identical email — which
  // then breaks email-based login outright (requestMemberOtp's .eq("email",
  // ...).maybeSingle() throws once more than one row matches). This is a
  // best-effort app-level check; verifySignupOtpAndLogin's insert is the
  // real, race-safe backstop once the DB constraint is in place.
  if (existingEmailResult.error) throw new Error(`Failed to check existing email: ${existingEmailResult.error.message}`);
  if (existingEmailResult.data) return { status: "email_already_registered" };

  const { error: upsertError } = await db.from("pending_signups").upsert(
    {
      phone,
      full_name: input.fullName,
      email,
      address: input.address,
      date_of_birth: input.dateOfBirth || null,
    },
    { onConflict: "phone" }
  );
  if (upsertError) throw new Error(`Failed to stage signup: ${upsertError.message}`);

  const code = await issueOtp(phone);
  // null means a still-valid code was issued moments ago (see issueOtp) —
  // don't fire a second round of messages for what's almost certainly a
  // double-tap or an immediate resend; the original message is still good.
  if (code) {
    // Each channel is independent — a WhatsApp failure must not stop the
    // email from going out, and vice versa. Concurrent, not sequential —
    // see the same note in requestMemberOtp above.
    await Promise.all([
      sendWhatsAppTemplate({ phone, template: "otp", bodyParams: [code] }).catch(() => {}),
      sendEmailTemplate({ to: email, template: "otp", bodyParams: [code] }).catch(() => {}),
    ]);
  }

  // Gated purely on NODE_ENV, not on whether WhatsApp is configured — email
  // is a required field now and always gets the code independently, so an
  // unconfigured WhatsApp is no longer a reason to echo the real OTP back
  // in an HTTP response body once this is actually deployed (Vercel sets
  // NODE_ENV=production for both Production and Preview deployments).
  const isDev = process.env.NODE_ENV !== "production";
  // Returning the normalized phone (not necessarily what the user typed)
  // matters: the client must submit this exact string back to verify-otp,
  // since that's the key issueOtp/pending_signups actually stored it under.
  return { status: "sent", devCode: isDev ? (code ?? undefined) : undefined, phone };
}
