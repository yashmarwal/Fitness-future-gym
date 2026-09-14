import "server-only";

// This gym is India-only — canonicalizes any reasonable way a member might
// type their number (spaces, dashes, a leading 0, missing/present "+91")
// down to one "+91XXXXXXXXXX" form. Without this, "+91 98765 43210",
// "9876543210", and "+919876543210" are three different strings to every
// .eq("phone", ...) lookup this app does (signup dedupe, login-by-phone,
// the one-free-trial-per-number check) even though they're the same real
// person. Numbers that already carry a non-Indian country code are left
// alone (formatting-stripped only) rather than guessed at.
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");

  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;

  return raw.trim().startsWith("+") ? `+${digits}` : `+91${digits}`;
}

// Cheap heuristic to tell a phone from an email in a single "phone or
// email" login field — good enough since emails always contain "@" and
// phone numbers never do.
export function looksLikePhone(identifier: string): boolean {
  return !identifier.includes("@");
}

// A loose sanity check on an already-normalized number — not full E.164
// validation (overkill for a single-country gym), just enough to catch
// garbage input (empty, way too short/long) before it's staged and silently
// fails WhatsApp delivery with no useful error surfaced to the signer-upper.
export function isPlausiblePhone(normalized: string): boolean {
  return /^\+\d{10,15}$/.test(normalized);
}
