import "server-only";
import { getDb } from "@/server/db/client";
import { issueOtp, verifyOtp } from "@/server/auth/otp";
import { sendWhatsAppTemplate } from "@/server/services/whatsapp";
import { createMemberSession } from "@/server/auth/session";

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
