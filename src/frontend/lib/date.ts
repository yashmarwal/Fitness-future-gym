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
