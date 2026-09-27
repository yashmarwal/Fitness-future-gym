import "server-only";
import { getDb } from "@/backend/db/client";
import { isMissingTableError } from "@/backend/db/errors";
import { getIstDateString, addIstDays, isIstSunday, daysBetweenIstDates } from "@/frontend/lib/date";
import { MAX_HOLIDAY_DAYS } from "@/frontend/lib/holidayConfig";

export { MAX_HOLIDAY_DAYS };

export type GymHoliday = { date: string; reason: string };

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function mapHolidayRow(row: { holiday_date: string; reason: string | null }): GymHoliday {
  return { date: row.holiday_date, reason: row.reason ?? "Gym closed" };
}

// The Broadcast composer's "Holiday" toggle: closes the gym floor for every
// date from `from` to `till` (inclusive, both IST). Deliberately has no
// effect on its own — this is only ever called from inside the broadcast
// send route (api/admin/broadcast/route.ts), at the moment the admin
// actually sends the announcement, never from a separate action. Attendance
// check-in is blocked on each of these dates (see attendance.ts), and —
// since a gym-mandated closure is never the member's fault — none of them
// count against a streak or the 3-day inactivity auto-block either (see
// isGapFullyRestDays / hasMissedAtLeastNEligibleDays below).
export async function markHolidayRange(from: string, till: string, reason: string): Promise<{ dates: string[] }> {
  if (!ISO_DATE_RE.test(from) || !ISO_DATE_RE.test(till)) {
    throw new Error("Holiday from/till must be valid dates.");
  }
  if (from > till) {
    throw new Error("The holiday's 'from' date must be on or before its 'till' date.");
  }
  const today = getIstDateString();
  if (from < today) {
    throw new Error("The holiday's 'from' date can't be in the past.");
  }
  const dayCount = daysBetweenIstDates(from, till) + 1;
  if (dayCount > MAX_HOLIDAY_DAYS) {
    throw new Error(`A holiday can span at most ${MAX_HOLIDAY_DAYS} days.`);
  }

  const trimmedReason = reason.trim() || "Gym closed";
  const dates = Array.from({ length: dayCount }, (_, i) => addIstDays(from, i));

  const db = getDb();
  const { error } = await db
    .from("gym_holidays")
    .upsert(
      dates.map((date) => ({ holiday_date: date, reason: trimmedReason })),
      { onConflict: "holiday_date" }
    );
  if (error) {
    if (isMissingTableError(error)) {
      throw new Error("Holiday calendar isn't set up yet — run the gym_holidays migration in schema.sql first.");
    }
    throw new Error(`Failed to mark holiday: ${error.message}`);
  }

  return { dates };
}

// Today's holiday row, if the gym is closed today — used by the check-in
// gate (attendance.ts) to block attendance and show the real reason. Fails
// open (returns null, i.e. "not a holiday") if the migration hasn't been
// run yet, same degrade-gracefully approach used everywhere else in this
// codebase for a not-yet-migrated column/table — check-in can't start
// throwing for every member just because this optional table is missing.
export async function getTodayHoliday(): Promise<GymHoliday | null> {
  const db = getDb();
  const today = getIstDateString();
  const { data, error } = await db.from("gym_holidays").select("holiday_date, reason").eq("holiday_date", today).maybeSingle();

  if (error) {
    if (isMissingTableError(error)) return null;
    throw new Error(`Failed to check holiday: ${error.message}`);
  }
  if (!data) return null;
  return mapHolidayRow(data as { holiday_date: string; reason: string | null });
}

// Holiday dates within an inclusive IST date range, as a Set for O(1)
// membership checks in the day-by-day loops below. Fails open (empty set)
// if the migration hasn't run — Sunday-exemption still works either way,
// since that's pure day-of-week math with no DB dependency.
async function getHolidaySet(fromInclusive: string, toInclusive: string): Promise<Set<string>> {
  if (fromInclusive > toInclusive) return new Set();
  const db = getDb();
  const { data, error } = await db
    .from("gym_holidays")
    .select("holiday_date")
    .gte("holiday_date", fromInclusive)
    .lte("holiday_date", toInclusive);

  if (error) {
    if (isMissingTableError(error)) return new Set();
    throw new Error(`Failed to load holidays: ${error.message}`);
  }
  return new Set((data ?? []).map((row) => row.holiday_date as string));
}

// Whether every calendar day strictly between `fromDay` and `toDay`
// (exclusive both ends) is a Sunday or an admin-marked holiday — i.e.
// whether a gap between two check-ins is fully explained by gym-mandated
// closures rather than a real miss. Used by attendance.ts to decide whether
// a streak survives a gap that includes a weekly Sunday closure or an
// admin-marked holiday stretch.
export async function isGapFullyRestDays(fromDay: string, toDay: string): Promise<boolean> {
  const start = addIstDays(fromDay, 1);
  const end = addIstDays(toDay, -1);
  if (start > end) return true; // nothing strictly between (gap of 0 or 1 day)

  const holidays = await getHolidaySet(start, end);
  let cursor = start;
  while (cursor <= end) {
    if (!isIstSunday(cursor) && !holidays.has(cursor)) return false;
    cursor = addIstDays(cursor, 1);
  }
  return true;
}

// Whether a member has missed at least `n` real (non-Sunday, non-holiday)
// attendance days strictly after `fromDay`, up to and including `today` —
// the same "gym-closure days don't count against you" rule as
// isGapFullyRestDays above, applied as a threshold rather than an
// all-or-nothing check. Powers the 3-day inactivity auto-block
// (admin/feeAbuse.ts::autoBlockInactiveMembers). Short-circuits once the
// threshold is reached rather than always counting the full range.
export async function hasMissedAtLeastNEligibleDays(fromDay: string, today: string, n: number): Promise<boolean> {
  const start = addIstDays(fromDay, 1);
  if (start > today) return false;

  const holidays = await getHolidaySet(start, today);
  let cursor = start;
  let missed = 0;
  while (cursor <= today) {
    if (!isIstSunday(cursor) && !holidays.has(cursor)) {
      missed += 1;
      if (missed >= n) return true;
    }
    cursor = addIstDays(cursor, 1);
  }
  return false;
}
