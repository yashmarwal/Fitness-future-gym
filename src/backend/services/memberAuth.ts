import "server-only";
import { getDb } from "@/backend/db/client";
import { issueOtp, verifyOtp } from "@/backend/auth/otp";
import { sendWhatsAppTemplate } from "@/backend/services/whatsapp";
import { sendEmailTemplate } from "@/backend/services/email";
import { generateMembershipNumber } from "@/backend/services/membershipNumber";
import { createMemberSession } from "@/backend/auth/session";

export type RequestOtpResult =
  | { status: "sent"; devCode?: string; phone: string }
  | { status: "not_found" };

// Accepts either a phone number or an email as the login identifier. Looked
// up via two separate .eq() calls (not a single .or() with the raw value
// interpolated in) so nothing in user input can ever reach PostgREST's
// filter-string syntax.
export async function requestMemberOtp(identifier: string): Promise<RequestOtpResult> {
  const db = getDb();

  const { data: byPhone, error: phoneError } = await db
    .from("members")
    .select("id, phone, email")
    .eq("phone", identifier)
    .maybeSingle();
  if (phoneError) throw new Error(`Failed to look up member: ${phoneError.message}`);

  let member = byPhone;
  if (!member) {
    const { data: byEmail, error: emailError } = await db
      .from("members")
      .select("id, phone, email")
      .eq("email", identifier)
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
    // versa.
    await sendWhatsAppTemplate({ phone: member.phone, template: "otp", bodyParams: [code], memberId: member.id }).catch(() => {});
    if (member.email) {
      await sendEmailTemplate({ to: member.email, template: "otp", bodyParams: [code], memberId: member.id }).catch(() => {});
    }
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
  | { status: "not_found" };

async function verifyAndCreateSession(phone: string, code: string) {
  const isValid = await verifyOtp(phone, code);
  if (!isValid) return { status: "invalid" as const };

  const db = getDb();
  const { data: member, error } = await db
    .from("members")
    .select("id, membership_number, full_name, email")
    .eq("phone", phone)
    .maybeSingle();

  if (error) throw new Error(`Failed to look up member: ${error.message}`);
  if (!member) return { status: "not_found" as const };

  await createMemberSession(member.id, member.membership_number);
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
  const isValid = await verifyOtp(phone, code);
  if (!isValid) return { status: "invalid" };

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
    return { status: "success" };
  }

  const { data: pending, error: pendingError } = await db
    .from("pending_signups")
    .select("full_name, email, date_of_birth")
    .eq("phone", phone)
    .maybeSingle();
  if (pendingError) throw new Error(`Failed to look up pending signup: ${pendingError.message}`);
  if (!pending) return { status: "not_found" };

  const membershipNumber = await generateMembershipNumber();

  const { data: member, error: insertError } = await db
    .from("members")
    .insert({
      membership_number: membershipNumber,
      full_name: pending.full_name,
      phone,
      email: pending.email,
      date_of_birth: pending.date_of_birth,
      is_active: true,
    })
    .select("id, membership_number, full_name, email, joined_at, plan")
    .single();
  if (insertError) throw new Error(`Failed to create member: ${insertError.message}`);

  await db.from("pending_signups").delete().eq("phone", phone);

  await createMemberSession(member.id, member.membership_number);

  // No welcome/card message here on purpose — a fresh signup has no plan
  // or fee assigned yet, and deliverMembershipCard withholds the card
  // until admin sets both via Admin → Members. That later edit is what
  // actually sends it (see admin/members.ts).

  return { status: "success" };
}

export type RegisterResult =
  | { status: "sent"; devCode?: string }
  | { status: "already_registered" };

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
  dateOfBirth?: string;
}): Promise<RegisterResult> {
  const db = getDb();

  const { data: existing, error: existingError } = await db
    .from("members")
    .select("id")
    .eq("phone", input.phone)
    .maybeSingle();
  if (existingError) throw new Error(`Failed to check existing member: ${existingError.message}`);
  if (existing) return { status: "already_registered" };

  const { error: upsertError } = await db.from("pending_signups").upsert(
    {
      phone: input.phone,
      full_name: input.fullName,
      email: input.email || null,
      date_of_birth: input.dateOfBirth || null,
    },
    { onConflict: "phone" }
  );
  if (upsertError) throw new Error(`Failed to stage signup: ${upsertError.message}`);

  const code = await issueOtp(input.phone);
  // null means a still-valid code was issued moments ago (see issueOtp) —
  // don't fire a second round of messages for what's almost certainly a
  // double-tap or an immediate resend; the original message is still good.
  if (code) {
    // Each channel is independent — a WhatsApp failure must not stop the
    // email from going out, and vice versa.
    await sendWhatsAppTemplate({
      phone: input.phone,
      template: "otp",
      bodyParams: [code],
    }).catch(() => {});
    await sendEmailTemplate({ to: input.email, template: "otp", bodyParams: [code] }).catch(() => {});
  }

  // Gated purely on NODE_ENV, not on whether WhatsApp is configured — email
  // is a required field now and always gets the code independently, so an
  // unconfigured WhatsApp is no longer a reason to echo the real OTP back
  // in an HTTP response body once this is actually deployed (Vercel sets
  // NODE_ENV=production for both Production and Preview deployments).
  const isDev = process.env.NODE_ENV !== "production";
  return { status: "sent", devCode: isDev ? (code ?? undefined) : undefined };
}
