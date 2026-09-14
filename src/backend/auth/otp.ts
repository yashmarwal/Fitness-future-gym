import "server-only";
import { createHash, randomInt } from "node:crypto";
import { getDb } from "@/backend/db/client";

// Bumped from 10 → 15 minutes: with WhatsApp not yet configured, email is
// the only real delivery channel right now, and a brand-new sending domain
// often lands in spam long enough that 10 minutes wasn't always enough time
// for someone to actually find the code.
const OTP_TTL_MINUTES = 15;

function hashCode(phone: string, code: string) {
  return createHash("sha256").update(`${phone}:${code}:${process.env.SESSION_SECRET ?? "dev"}`).digest("hex");
}

// How long a just-issued, still-valid code is left completely untouched on
// a repeat request, instead of being invalidated for a new one. Without
// this, a slow-feeling tap that gets pressed twice (or "Resend" hit right
// after the first send actually landed) invalidates the code already on
// its way in the first email/WhatsApp message — the user then types that
// exact, correctly-copied code and gets "invalid" because a newer one
// silently replaced it seconds earlier. We never store the plaintext code
// (only its hash), so a deduped request can't literally resend the same
// digits — instead it returns null and the caller skips sending a new
// message entirely, leaving the original (still valid) one as the one to
// use.
const REISSUE_DEDUPE_SECONDS = 20;

export async function issueOtp(phone: string): Promise<string | null> {
  const db = getDb();

  const { data: recent, error: recentError } = await db
    .from("login_otps")
    .select("expires_at, created_at")
    .eq("phone", phone)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (recentError) throw new Error(`Failed to check recent OTP: ${recentError.message}`);

  if (
    recent &&
    new Date(recent.expires_at) > new Date() &&
    Date.now() - new Date(recent.created_at).getTime() < REISSUE_DEDUPE_SECONDS * 1000
  ) {
    return null;
  }

  const code = randomInt(100000, 999999).toString();

  // Invalidate any previously-issued-but-unused code for this phone first.
  // Without this, verifyOtp's "most recent still-unconsumed" lookup means
  // an OLD code stays valid indefinitely (until its own expiry) even after
  // a newer one is issued and used — confirmed live: requesting a code
  // twice then verifying with the FIRST (stale) one still succeeded,
  // because it was still sitting there unconsumed. Only the code just sent
  // should ever be valid.
  await db
    .from("login_otps")
    .update({ consumed_at: new Date().toISOString() })
    .eq("phone", phone)
    .is("consumed_at", null);

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

export type OtpCheckResult = { valid: true; otpId: string } | { valid: false };

// A 6-digit code is only 1,000,000 combinations — within the 15-minute TTL
// that's brute-forceable with unlimited guesses otherwise. Once a single
// OTP row accumulates this many wrong guesses, it's locked out (treated as
// invalid regardless of what's typed) and the member has to request a
// fresh code.
const MAX_VERIFY_ATTEMPTS = 5;

// Both of these read/write a login_otps.attempt_count column that may not
// exist yet on an older database (see the migration in schema.sql) — they
// deliberately fail OPEN (no lockout, current behavior) rather than
// throwing, so shipping this can't break login/signup for anyone who
// hasn't run that migration yet. Once it's run, lockout starts working
// automatically with no further deploy needed.
async function isLockedOut(otpId: string): Promise<boolean> {
  const db = getDb();
  const { data, error } = await db.from("login_otps").select("attempt_count").eq("id", otpId).maybeSingle();
  if (error || !data) return false;
  return ((data as { attempt_count?: number }).attempt_count ?? 0) >= MAX_VERIFY_ATTEMPTS;
}

async function recordFailedAttempt(otpId: string): Promise<void> {
  const db = getDb();
  const { data } = await db.from("login_otps").select("attempt_count").eq("id", otpId).maybeSingle();
  const current = (data as { attempt_count?: number } | null)?.attempt_count ?? 0;
  await db.from("login_otps").update({ attempt_count: current + 1 }).eq("id", otpId);
}

// Checks a code WITHOUT consuming it. Split out from the old all-in-one
// verifyOtp so a caller with follow-up work that can fail (creating a
// members row, generating a membership number, ...) can defer consumption
// until that work actually succeeds — see consumeOtp below and its callers
// in memberAuth.ts. Consuming eagerly meant a genuinely correct code got
// permanently burned the instant something *else* downstream failed, and
// every retry with that same correct code then failed too, misleadingly,
// with "incorrect or expired code."
export async function checkOtp(phone: string, code: string): Promise<OtpCheckResult> {
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

  if (!data) return { valid: false };
  if (new Date(data.expires_at) < new Date()) return { valid: false };
  if (await isLockedOut(data.id)) return { valid: false };

  if (data.code_hash !== hashCode(phone, code)) {
    await recordFailedAttempt(data.id);
    return { valid: false };
  }

  return { valid: true, otpId: data.id };
}

export async function consumeOtp(otpId: string): Promise<void> {
  const db = getDb();
  const { error } = await db.from("login_otps").update({ consumed_at: new Date().toISOString() }).eq("id", otpId);
  if (error) throw new Error(`Failed to consume OTP: ${error.message}`);
}

// Convenience all-in-one for callers with no follow-up work that can fail
// (kept so nothing else needs to change) — checks and immediately consumes.
export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const result = await checkOtp(phone, code);
  if (!result.valid) return false;
  await consumeOtp(result.otpId);
  return true;
}
