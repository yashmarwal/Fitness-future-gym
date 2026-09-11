import "server-only";
import { createHash, randomInt } from "node:crypto";
import { getDb } from "@/backend/db/client";

const OTP_TTL_MINUTES = 10;

function hashCode(phone: string, code: string) {
  return createHash("sha256").update(`${phone}:${code}:${process.env.SESSION_SECRET ?? "dev"}`).digest("hex");
}

export async function issueOtp(phone: string): Promise<string> {
  const code = randomInt(100000, 999999).toString();
  const db = getDb();

  const { error } = await db.from("login_otps").insert({
    phone,
    code_hash: hashCode(phone, code),
    expires_at: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString(),
  });

  if (error) {
    throw new Error(`Failed to store OTP: ${error.message}`);
  }

  return code;
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const db = getDb();
  const { data, error } = await db
    .from("login_otps")
    .select("id, code_hash, expires_at, consumed_at")
    .eq("phone", phone)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to look up OTP: ${error.message}`);
  }

  if (!data) return false;
  if (new Date(data.expires_at) < new Date()) return false;
  if (data.code_hash !== hashCode(phone, code)) return false;

  await db.from("login_otps").update({ consumed_at: new Date().toISOString() }).eq("id", data.id);
  return true;
}
