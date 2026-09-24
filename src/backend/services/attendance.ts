import "server-only";
import { cache } from "react";
import { getDb } from "@/backend/db/client";
import { isMissingColumnError } from "@/backend/db/errors";
import { getIstDateString, daysBetweenIstDates } from "@/frontend/lib/date";
import { sendCheckInPrompt } from "@/backend/services/workoutPrompt";
import { isStreakMilestone } from "@/frontend/lib/streakTiers";
import type { CheckInResult } from "@/types/member";

// Below this, a "please review us" ask feels premature — a 7 or 14-day
// streak is a good start, not yet the kind of loyalty that makes an
// unprompted 5-star review, so the first ask only ever fires at 30+.
const REVIEW_PROMPT_MIN_STREAK = 30;

const COOLDOWN_HOURS = 3;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

// The gym floor's actual open windows. Computed in IST specifically (not
// server-local time) since Vercel's serverless functions run in UTC — using
// the server's own clock would silently gate attendance by the wrong hours
// in production even though it happened to look right in local dev on an
// IST machine.
const MORNING_START_MIN = 6 * 60; // 6:00 AM
const MORNING_END_MIN = 12 * 60; // 12:00 PM
const EVENING_START_MIN = 16 * 60; // 4:00 PM
const EVENING_END_MIN = 22 * 60 + 30; // 10:30 PM

function isWithinAttendanceHours(): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const totalMinutes = hour * 60 + minute;

  return (
    (totalMinutes >= MORNING_START_MIN && totalMinutes <= MORNING_END_MIN) ||
    (totalMinutes >= EVENING_START_MIN && totalMinutes <= EVENING_END_MIN)
  );
}

type MemberRow = {
  id: string;
  full_name: string;
  membership_number: string;
  is_active: boolean;
  is_frozen: boolean;
  last_checked_in_at: string | null;
  current_streak_days: number;
  longest_streak_days: number;
  review_prompted_at: string | null;
};

// Shared by both check-in paths: the front-desk QR poster (looked up by
// membership number, no login needed) and the dashboard's own one-tap
// button (already-authenticated member, looked up by id) — same cooldown,
// same attendance row, same last_checked_in_at update either way.
async function checkInMemberRow(member: MemberRow): Promise<CheckInResult> {
  const db = getDb();

  if (!member.is_active) {
    return { status: "inactive" };
  }

  // Blocked (fee-abuse tool, admin/feeAbuse.ts) takes priority over the
  // opening-hours check — a blocked member shouldn't see "come back at 5
  // AM," they should see the actual reason.
  if (member.is_frozen) {
    return { status: "blocked" };
  }

  if (!isWithinAttendanceHours()) {
    return { status: "outside_hours" };
  }

  const { data: lastVisit, error: attendanceError } = await db
    .from("attendance")
    .select("checked_in_at")
    .eq("member_id", member.id)
    .order("checked_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (attendanceError) {
    throw new Error(`Failed to check last attendance: ${attendanceError.message}`);
  }

  if (lastVisit) {
    const elapsedMs = Date.now() - new Date(lastVisit.checked_in_at).getTime();
    if (elapsedMs < COOLDOWN_MS) {
      const retryAfterMinutes = Math.ceil((COOLDOWN_MS - elapsedMs) / 60000);
      return { status: "cooldown", retryAfterMinutes };
    }
  }

  const checkedInAt = new Date().toISOString();

  const { error: insertError } = await db
    .from("attendance")
    .insert({ member_id: member.id, checked_in_at: checkedInAt });

  if (insertError) {
    throw new Error(`Failed to log attendance: ${insertError.message}`);
  }

  // Permanent streak counter — computed here from the gap since the
  // member's LAST real check-in (member.last_checked_in_at, which — like
  // the counters themselves — lives on the member row and survives the
  // attendance log's 30-day purge), never by re-scanning the log itself.
  const today = getIstDateString();
  let newStreak = 1;
  if (member.last_checked_in_at) {
    const lastCheckInDay = getIstDateString(new Date(member.last_checked_in_at));
    const gap = daysBetweenIstDates(lastCheckInDay, today);
    if (gap === 1) newStreak = member.current_streak_days + 1;
    else if (gap === 0) newStreak = member.current_streak_days || 1;
    // gap >= 2: a real missed day — streak restarts at 1 (the default above).
  }
  const newLongest = Math.max(member.longest_streak_days, newStreak);

  // A one-time-ever ask, not "every time a milestone happens again" — once
  // review_prompted_at is set, this member is never asked again regardless
  // of how many more milestones they hit. Real streak milestones only
  // (isStreakMilestone), not every day the streak happens to be >= 30, so
  // this fires exactly once at whichever named milestone comes first.
  const shouldPromptReview =
    !member.review_prompted_at && newStreak >= REVIEW_PROMPT_MIN_STREAK && isStreakMilestone(newStreak);

  // Kept on the member row (not just the attendance log) since attendance
  // rows are purged after 30 days but long-term inactivity — and now the
  // streak counters too — still need to be readable after that purge.
  const { error: updateError } = await db
    .from("members")
    .update({
      last_checked_in_at: checkedInAt,
      current_streak_days: newStreak,
      longest_streak_days: newLongest,
      ...(shouldPromptReview ? { review_prompted_at: checkedInAt } : {}),
    })
    .eq("id", member.id);

  if (updateError) {
    if (!isMissingColumnError(updateError)) throw new Error(`Failed to update member: ${updateError.message}`);
    // Migration not run yet — check-in itself still has to succeed; the
    // streak (and review-prompt tracking) just won't persist correctly
    // until it does.
    const { error: fallbackError } = await db
      .from("members")
      .update({ last_checked_in_at: checkedInAt })
      .eq("id", member.id);
    if (fallbackError) throw new Error(`Failed to update member: ${fallbackError.message}`);
  }

  // "Start logging your workout" nudge. Best-effort: a failure here must
  // never undo or fail a check-in that has already been recorded.
  await sendCheckInPrompt(member.id, { streak: newStreak }).catch((err) =>
    console.error("[check-in] workout prompt failed:", err instanceof Error ? err.message : err)
  );

  return {
    status: "success",
    member: {
      fullName: member.full_name,
      membershipNumber: member.membership_number,
    },
    streak: newStreak,
    reviewPrompt: shouldPromptReview,
  };
}

const CHECKIN_COLUMNS =
  "id, full_name, membership_number, is_active, is_frozen, last_checked_in_at, current_streak_days, longest_streak_days, review_prompted_at";
const CHECKIN_COLUMNS_BASE = "id, full_name, membership_number, is_active, is_frozen, last_checked_in_at";

// Falls back to a query without the streak columns if that migration
// hasn't landed yet — check-in is core, member-facing functionality, so it
// can't just throw and break for everyone until the migration runs.
async function fetchMemberForCheckIn(column: "membership_number" | "id", value: string): Promise<MemberRow | null> {
  const db = getDb();
  const { data, error } = await db.from("members").select(CHECKIN_COLUMNS).eq(column, value).maybeSingle();

  if (!error) return data as MemberRow | null;
  if (!isMissingColumnError(error)) throw new Error(`Failed to look up member: ${error.message}`);

  const { data: fallbackData, error: fallbackError } = await db
    .from("members")
    .select(CHECKIN_COLUMNS_BASE)
    .eq(column, value)
    .maybeSingle();
  if (fallbackError) throw new Error(`Failed to look up member: ${fallbackError.message}`);
  if (!fallbackData) return null;
  return { ...fallbackData, current_streak_days: 0, longest_streak_days: 0, review_prompted_at: null } as MemberRow;
}

export async function checkInMember(membershipNumber: string): Promise<CheckInResult> {
  const member = await fetchMemberForCheckIn("membership_number", membershipNumber);
  if (!member) {
    return { status: "not_found" };
  }

  return checkInMemberRow(member);
}

// Dashboard's one-tap button — the member is already authenticated, so no
// membership-number lookup or device-binding trick is needed at all, just
// check them in directly by their session's member id.
export async function checkInMemberById(memberId: string): Promise<CheckInResult> {
  const member = await fetchMemberForCheckIn("id", memberId);
  if (!member) {
    return { status: "not_found" };
  }

  return checkInMemberRow(member);
}

export type AttendanceStatus = {
  checkedIn: boolean;
  lastCheckedInAt: string | null;
  retryAfterMinutes: number | null;
};

// Powers both the dashboard's check-in button state (active vs. "marked,
// disabled for 3h") and the whole-dashboard attendance gate — same
// cooldown window as checkInMemberRow, read-only. Wrapped in React's
// cache() so dashboard/layout.tsx (the gate) and dashboard/page.tsx (the
// check-in button's initial state) share one Supabase call per request
// instead of each firing its own — same pattern as getMemberById.
export const getAttendanceStatus = cache(async function getAttendanceStatus(memberId: string): Promise<AttendanceStatus> {
  const db = getDb();
  const { data: lastVisit, error } = await db
    .from("attendance")
    .select("checked_in_at")
    .eq("member_id", memberId)
    .order("checked_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to check attendance status: ${error.message}`);
  if (!lastVisit) return { checkedIn: false, lastCheckedInAt: null, retryAfterMinutes: null };

  const elapsedMs = Date.now() - new Date(lastVisit.checked_in_at).getTime();
  const withinCooldown = elapsedMs < COOLDOWN_MS;

  return {
    checkedIn: withinCooldown,
    lastCheckedInAt: lastVisit.checked_in_at,
    retryAfterMinutes: withinCooldown ? Math.ceil((COOLDOWN_MS - elapsedMs) / 60000) : null,
  };
});

export async function getRecentAttendance(memberId: string, limit = 30): Promise<string[]> {
  const db = getDb();
  const { data, error } = await db
    .from("attendance")
    .select("checked_in_at")
    .eq("member_id", memberId)
    .order("checked_in_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load attendance history: ${error.message}`);
  return (data ?? []).map((row) => row.checked_in_at as string);
}

const ATTENDANCE_RETENTION_DAYS = 30;

export async function deleteOldAttendance(): Promise<{ deleted: number }> {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ATTENDANCE_RETENTION_DAYS);

  const { data, error } = await db
    .from("attendance")
    .delete()
    .lt("checked_in_at", cutoff.toISOString())
    .select("id");

  if (error) throw new Error(`Failed to delete old attendance: ${error.message}`);
  return { deleted: data?.length ?? 0 };
}
