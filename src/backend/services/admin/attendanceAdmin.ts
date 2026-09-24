import "server-only";
import { getDb } from "@/backend/db/client";
import { getIstStartOfTodayIso, getIstDateString, daysBetweenIstDates } from "@/frontend/lib/date";
import type { AttendanceRow } from "@/types/admin";

// Matches the exact self-check-in windows enforced in attendance.ts's
// isWithinAttendanceHours — the real, authoritative operational hours a
// check-in can even happen under (a manual admin-added entry is the only
// way a row lands outside these, which is what the "other" bucket is for).
// Note these differ slightly from the marketing site's Location page copy
// (5am-11pm there vs 6am-12pm/4-10:30pm here) — that's a separate, real
// inconsistency worth reconciling later, not something fixed by this file.
const MORNING_START_MIN = 6 * 60; // 6:00 AM
const MORNING_END_MIN = 12 * 60; // 12:00 PM
const EVENING_START_MIN = 16 * 60; // 4:00 PM
const EVENING_END_MIN = 22 * 60 + 30; // 10:30 PM

// Matches alerts.ts's UPCOMING_DUE_DAYS — same "due soon" window used
// elsewhere in the admin panel, so this doesn't invent a second definition
// of "soon."
const DUE_SOON_DAYS = 3;

export type AttendanceShift = "morning" | "evening" | "other";
export type FeeTag = { label: string; tone: "error" | "warning" } | null;
export type TodayAttendanceRow = AttendanceRow & { shift: AttendanceShift; feeTag: FeeTag };

function classifyShift(checkedInAtIso: string): AttendanceShift {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(new Date(checkedInAtIso));
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const totalMinutes = hour * 60 + minute;

  if (totalMinutes >= MORNING_START_MIN && totalMinutes <= MORNING_END_MIN) return "morning";
  if (totalMinutes >= EVENING_START_MIN && totalMinutes <= EVENING_END_MIN) return "evening";
  return "other";
}

// Only flags real problems — a comfortably paid-up member (due date well
// in the future) gets no tag at all, keeping the list clean for the common
// case. "Never billed" and "overdue" reuse the exact same language as the
// Access Control page's Needs Review flag, for consistency.
function computeFeeTag(feeDueDate: string | null): FeeTag {
  if (!feeDueDate) return { label: "Never Billed", tone: "warning" };
  const today = getIstDateString();
  if (feeDueDate < today) return { label: "Overdue", tone: "error" };
  const daysUntil = daysBetweenIstDates(today, feeDueDate);
  if (daysUntil === 0) return { label: "Due Today", tone: "warning" };
  if (daysUntil <= DUE_SOON_DAYS) return { label: `Due In ${daysUntil}d`, tone: "warning" };
  return null;
}

// Powers the admin Attendance page's live "who's checked in today" view —
// scoped to today (IST) only, not the last-100-regardless-of-date history
// listRecentAttendance below still serves (e.g. the AI assistant's
// list_recent_attendance tool genuinely wants historical browsing, a
// different use case from this one). Refreshed only on demand (the
// frontend's Refresh button calls router.refresh()) — deliberately no
// polling/auto-refresh here, this is a plain request-response query, not a
// live subscription.
export async function listTodaysAttendance(): Promise<TodayAttendanceRow[]> {
  const db = getDb();
  const { data, error } = await db
    .from("attendance")
    .select("id, checked_in_at, member_id, members(full_name, membership_number, fee_due_date)")
    .gte("checked_in_at", getIstStartOfTodayIso())
    .order("checked_in_at", { ascending: false });

  if (error) throw new Error(`Failed to load today's attendance: ${error.message}`);

  return (data ?? []).map((row) => {
    const member = row.members as unknown as { full_name: string; membership_number: string; fee_due_date: string | null } | null;
    return {
      id: row.id,
      memberId: row.member_id,
      memberName: member?.full_name ?? "Unknown",
      membershipNumber: member?.membership_number ?? "—",
      checkedInAt: row.checked_in_at,
      shift: classifyShift(row.checked_in_at),
      feeTag: computeFeeTag(member?.fee_due_date ?? null),
    };
  });
}

export async function listRecentAttendance(limit = 100): Promise<AttendanceRow[]> {
  const db = getDb();
  const { data, error } = await db
    .from("attendance")
    .select("id, checked_in_at, member_id, members(full_name, membership_number)")
    .order("checked_in_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load attendance: ${error.message}`);

  return (data ?? []).map((row) => {
    const member = row.members as unknown as { full_name: string; membership_number: string } | null;
    return {
      id: row.id,
      memberId: row.member_id,
      memberName: member?.full_name ?? "Unknown",
      membershipNumber: member?.membership_number ?? "—",
      checkedInAt: row.checked_in_at,
    };
  });
}

export async function addManualAttendance(memberId: string, checkedInAt?: string): Promise<void> {
  const db = getDb();
  const timestamp = checkedInAt ?? new Date().toISOString();

  const { error } = await db.from("attendance").insert({ member_id: memberId, checked_in_at: timestamp });
  if (error) throw new Error(`Failed to add attendance: ${error.message}`);

  // Only move the member's "last checked in" marker forward — a backfilled
  // old date shouldn't overwrite a more recent real check-in.
  const { data: member } = await db.from("members").select("last_checked_in_at").eq("id", memberId).maybeSingle();
  if (!member?.last_checked_in_at || new Date(timestamp) > new Date(member.last_checked_in_at)) {
    await db.from("members").update({ last_checked_in_at: timestamp }).eq("id", memberId);
  }
}

export async function deleteAttendance(id: string): Promise<void> {
  const db = getDb();
  const { error } = await db.from("attendance").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete attendance: ${error.message}`);
}

// Powers the admin calendar view of one member's check-ins — bounded by
// the existing 30-day attendance retention (deleteOldAttendance), so this
// never needs its own date-range filter; whatever's in the table is
// already "the last month," which is exactly the view's scope. Navigating
// to an earlier month will just show empty — there's no older data to see.
export async function getMemberAttendanceTimestamps(memberId: string): Promise<string[]> {
  const db = getDb();
  const { data, error } = await db
    .from("attendance")
    .select("checked_in_at")
    .eq("member_id", memberId)
    .order("checked_in_at", { ascending: false });

  if (error) throw new Error(`Failed to load member attendance: ${error.message}`);
  return (data ?? []).map((row) => row.checked_in_at as string);
}

export type DayAttendanceSummary = { date: string; morning: number; evening: number; other: number; total: number };

// Powers the gym-wide monthly calendar on the admin Attendance page —
// distinct from getMemberAttendanceTimestamps, which is scoped to one
// member. Bounded by the same 30-day attendance retention as that
// function (deleteOldAttendance), so there's no separate date-range filter
// needed here either: whatever's in the table already IS "the last month."
// Grouped server-side (not per-row on the client) since gym-wide could be
// a few thousand rows over that window, and the client only ever needs the
// per-day totals, never the individual timestamps.
export async function getDailyAttendanceSummary(): Promise<DayAttendanceSummary[]> {
  const db = getDb();
  const { data, error } = await db.from("attendance").select("checked_in_at");
  if (error) throw new Error(`Failed to load attendance summary: ${error.message}`);

  const byDay = new Map<string, { morning: number; evening: number; other: number }>();
  for (const row of data ?? []) {
    const day = getIstDateString(new Date(row.checked_in_at));
    const shift = classifyShift(row.checked_in_at);
    const entry = byDay.get(day) ?? { morning: 0, evening: 0, other: 0 };
    entry[shift]++;
    byDay.set(day, entry);
  }

  return [...byDay.entries()]
    .map(([date, counts]) => ({ date, ...counts, total: counts.morning + counts.evening + counts.other }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function countTodaysCheckIns(): Promise<number> {
  const db = getDb();
  // IST-explicit, not server-local time (Vercel runs UTC) — the same class
  // of bug already fixed elsewhere; a plain new Date().setHours(0,0,0,0)
  // here would silently use the wrong "today" for part of the day.
  const startOfDay = getIstStartOfTodayIso();

  const { count, error } = await db
    .from("attendance")
    .select("id", { count: "exact", head: true })
    .gte("checked_in_at", startOfDay);

  if (error) throw new Error(`Failed to count check-ins: ${error.message}`);
  return count ?? 0;
}
