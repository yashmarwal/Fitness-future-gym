// Free-typed DOB parsing, Indian convention (DD/MM/YYYY) — a native
// <input type="date"> forces a calendar-picker tap-through that's genuinely
// tedious for a field almost every signup fills in, when just typing the
// number is faster for basically everyone. This accepts whatever separator
// (or none) someone naturally types — "7/9/2003", "7-9-2003", "7.9.2003",
// "7 9 2003", even "07092003" — and normalizes it into an unambiguous
// DD/MM/YYYY display plus the ISO string the API actually requires.
export type ParsedDob = { iso: string; display: string };

export function parseIndianDob(raw: string): ParsedDob | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let parts = trimmed.split(/[^0-9]+/).filter(Boolean);

  // A single unbroken 8-digit run ("07092003") is DDMMYYYY typed with no
  // separator at all — split it the same way rather than rejecting it.
  if (parts.length === 1 && parts[0].length === 8) {
    parts = [parts[0].slice(0, 2), parts[0].slice(2, 4), parts[0].slice(4, 8)];
  }
  if (parts.length !== 3) return null;

  const [dStr, mStr, yStr] = parts;
  if (dStr.length > 2 || mStr.length > 2 || yStr.length > 4 || yStr.length < 2) return null;

  const day = Number(dStr);
  const month = Number(mStr);
  // A 2-digit year ("03") needs a century — pivoted at 30 so recent years
  // read as 2000s and everything older as 1900s. Nobody signing up at a gym
  // was born before 1900 or after this year, so both ends of that pivot are
  // safe for this specific field.
  const year = yStr.length <= 2 ? (Number(yStr) <= 30 ? 2000 + Number(yStr) : 1900 + Number(yStr)) : Number(yStr);

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (year < 1900) return null;

  // Real calendar validation, not just range checks — JS Date silently
  // rolls an invalid day (Feb 30, Apr 31) into the next month instead of
  // rejecting it, so round-tripping the constructed date back against the
  // typed day/month is what actually catches those.
  const candidate = new Date(year, month - 1, day);
  if (candidate.getFullYear() !== year || candidate.getMonth() !== month - 1 || candidate.getDate() !== day) {
    return null;
  }
  if (candidate.getTime() > Date.now()) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    iso: `${year}-${pad(month)}-${pad(day)}`,
    display: `${pad(day)}/${pad(month)}/${year}`,
  };
}
