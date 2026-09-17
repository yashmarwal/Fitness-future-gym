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

// The calendar date (IST) a given instant falls on, as a YYYY-MM-DD
// string — defaults to now. Same IST-explicit reasoning as getIstHour
// above. Used by the opt-in reminder crons (reminders.ts) to check "has
// this member already logged food / checked in today," and by the
// permanent attendance-streak counter (attendance.ts) to compare "today"
// against a past check-in's date without server-local-time drift.
export function getIstDateString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
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

// The weekday name (IST) a given instant falls on — same IST-explicit
// reasoning as getIstDateString. Used by findTodaysWorkout to match a plan
// day's label against "today," which must be IST's today, not the server's
// (Vercel runs UTC, so a plain Date().toLocaleDateString would show the
// wrong day's plan for hours around midnight IST).
export function getIstWeekday(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "long" }).format(date);
}

// Whole-day difference between two IST calendar-date strings (both from
// getIstDateString) — e.g. "checked in yesterday" is exactly 1, "checked
// in today already" is 0, a missed day (or more) is 2+.
export function daysBetweenIstDates(earlier: string, later: string): number {
  const earlierMs = new Date(`${earlier}T00:00:00+05:30`).getTime();
  const laterMs = new Date(`${later}T00:00:00+05:30`).getTime();
  return Math.round((laterMs - earlierMs) / (1000 * 60 * 60 * 24));
}
