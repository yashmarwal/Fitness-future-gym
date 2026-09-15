export function daysUntil(dateIso: string): number {
  const target = new Date(dateIso);
  return Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function isPastDate(dateIso: string): boolean {
  return new Date(dateIso).getTime() < Date.now();
}

// IST-explicit, not server-local time — Vercel's serverless functions run
// in UTC, so a plain `new Date().getHours()` greeting would say "Good
// Night" to a member opening the app at 9am IST. Same Intl.DateTimeFormat
// pattern already used in attendance.ts's isWithinAttendanceHours.
export function getIstHour(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  return Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
}

export function greetingForHour(hour: number): string {
  if (hour < 5) return "Still Grinding";
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
}

// "Today" in IST as a YYYY-MM-DD string — same IST-explicit reasoning as
// getIstHour above. Used by the opt-in reminder crons (reminders.ts) to
// check "has this member already logged food / checked in today" before
// nagging them, since a plain server-local "today" would be wrong by
// several hours relative to what a member in India actually considers
// "today."
export function getIstDateString(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

// The UTC instant corresponding to 00:00:00 IST today — the correct lower
// bound for "did this happen today" range queries against timestamptz
// columns (logged_at, checked_in_at), which are stored in UTC.
export function getIstStartOfTodayIso(): string {
  return new Date(`${getIstDateString()}T00:00:00+05:30`).toISOString();
}
