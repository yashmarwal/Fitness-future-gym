import "server-only";
import { getDb } from "@/backend/db/client";
import { issueOtp, verifyOtp } from "@/backend/auth/otp";
import { sendWhatsAppTemplate } from "@/backend/services/whatsapp";
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

export async function verifyMemberOtpAndLogin(phone: string, code: string): Promise<VerifyOtpResult> {
  const isValid = await verifyOtp(phone, code);
  if (!isValid) return { status: "invalid" };

  const db = getDb();
  const { data: member, error } = await db
    .from("members")
    .select("id, membership_number")
    .eq("phone", phone)
    .maybeSingle();

  if (error) throw new Error(`Failed to look up member: ${error.message}`);
  if (!member) return { status: "not_found" };

  await createMemberSession(member.id, member.membership_number);
  return { status: "success" };
}

export type RegisterResult =
  | { status: "sent"; devCode?: string; membershipNumber: string }
  | { status: "already_registered" };

export async function registerMember(input: {
  fullName: string;
  phone: string;
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
      date_of_birth: input.dateOfBirth || null,
      is_active: true,
    })
    .select("id")
    .single();
  if (insertError) throw new Error(`Failed to create member: ${insertError.message}`);

  // Welcome card first, OTP second — a failure to deliver the card shouldn't
  // block the person from logging in.
  await sendWhatsAppTemplate({
    phone: input.phone,
    template: "welcome_card",
    bodyParams: [input.fullName, membershipNumber],
    memberId: member.id,
  }).catch(() => {});

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
