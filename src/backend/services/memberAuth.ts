import "server-only";
import { getDb } from "@/backend/db/client";
import { issueOtp, verifyOtp } from "@/backend/auth/otp";
import { sendWhatsAppTemplate } from "@/backend/services/whatsapp";
import { sendEmailTemplate } from "@/backend/services/email";
import { createMemberSession } from "@/backend/auth/session";

async function generateMembershipNumber(): Promise<string> {
  const db = getDb();
  const { data, error } = await db
    .from("members")
    .select("membership_number")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to generate membership number: ${error.message}`);

  const match = data?.membership_number?.match(/(\d+)$/);
  const next = match ? Number(match[1]) + 1 : 1001;
  return `FF-${next}`;
}

export type RequestOtpResult =
  | { status: "sent"; devCode?: string }
  | { status: "not_found" };

export async function requestMemberOtp(phone: string): Promise<RequestOtpResult> {
  const db = getDb();
  const { data: member, error } = await db
    .from("members")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (error) throw new Error(`Failed to look up member: ${error.message}`);
  if (!member) return { status: "not_found" };

  const code = await issueOtp(phone);
  await sendWhatsAppTemplate({ phone, template: "otp", bodyParams: [code], memberId: member.id });

  const isDev = !process.env.WHATSAPP_ACCESS_TOKEN || process.env.NODE_ENV !== "production";
  return { status: "sent", devCode: isDev ? code : undefined };
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

// Signup's first verification: same as a regular login, but this is also
// the moment the phone is confirmed to belong to the person who signed up —
// so the welcome/card message is sent here, once, rather than at
// registration time (before the number was verified at all).
export async function verifySignupOtpAndLogin(phone: string, code: string): Promise<VerifyOtpResult> {
  const result = await verifyAndCreateSession(phone, code);
  if (result.status !== "success") return { status: result.status };

  await sendWhatsAppTemplate({
    phone,
    template: "welcome_card",
    bodyParams: [result.member.full_name, result.member.membership_number],
    memberId: result.member.id,
  }).catch(() => {});

  if (result.member.email) {
    await sendEmailTemplate({
      to: result.member.email,
      template: "welcome_card",
      bodyParams: [result.member.full_name, result.member.membership_number],
      memberId: result.member.id,
    }).catch(() => {});
  }

  return { status: "success" };
}

export type RegisterResult =
  | { status: "sent"; devCode?: string; membershipNumber: string }
  | { status: "already_registered" };

export async function registerMember(input: {
  fullName: string;
  phone: string;
  email?: string;
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

  const membershipNumber = await generateMembershipNumber();

  const { data: member, error: insertError } = await db
    .from("members")
    .insert({
      membership_number: membershipNumber,
      full_name: input.fullName,
      phone: input.phone,
      email: input.email || null,
      date_of_birth: input.dateOfBirth || null,
      is_active: true,
    })
    .select("id")
    .single();
  if (insertError) throw new Error(`Failed to create member: ${insertError.message}`);

  // Card comes after the first successful login (verifySignupOtpAndLogin),
  // not here — sending it before the phone is verified could hand someone's
  // membership number to a mistyped or unverified number.
  const code = await issueOtp(input.phone);
  await sendWhatsAppTemplate({
    phone: input.phone,
    template: "otp",
    bodyParams: [code],
    memberId: member.id,
  });

  const isDev = !process.env.WHATSAPP_ACCESS_TOKEN || process.env.NODE_ENV !== "production";
  return { status: "sent", devCode: isDev ? code : undefined, membershipNumber };
}
