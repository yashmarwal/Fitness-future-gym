import "server-only";
import { cache } from "react";
import { getDb } from "@/backend/db/client";
import type { CheckInResult } from "@/types/member";

const COOLDOWN_HOURS = 3;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

// The gym floor's actual open windows. Computed in IST specifically (not
// server-local time) since Vercel's serverless functions run in UTC — using
// the server's own clock would silently gate attendance by the wrong hours
// in production even though it happened to look right in local dev on an
// IST machine.
const MORNING_START_MIN = 6 * 60; // 6:00 AM
const MORNING_END_MIN = 11 * 60; // 11:00 AM
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

  // Kept on the member row (not just the attendance log) since attendance
  // rows are purged after 30 days but long-term inactivity still needs to
  // be detectable — see deleteOldAttendance and listInactiveMembers.
  await db.from("members").update({ last_checked_in_at: checkedInAt }).eq("id", member.id);

  return {
    status: "success",
    member: {
      fullName: member.full_name,
      membershipNumber: member.membership_number,
    },
  };
}

export async function checkInMember(membershipNumber: string): Promise<CheckInResult> {
  const db = getDb();
  const { data: member, error: memberError } = await db
    .from("members")
    .select("id, full_name, membership_number, is_active, is_frozen")
    .eq("membership_number", membershipNumber)
    .maybeSingle();

  if (memberError) {
    throw new Error(`Failed to look up member: ${memberError.message}`);
  }
  if (!member) {
    return { status: "not_found" };
  }

  return checkInMemberRow(member);
}

// Dashboard's one-tap button — the member is already authenticated, so no
// membership-number lookup or device-binding trick is needed at all, just
// check them in directly by their session's member id.
export async function checkInMemberById(memberId: string): Promise<CheckInResult> {
  const db = getDb();
  const { data: member, error: memberError } = await db
    .from("members")
    .select("id, full_name, membership_number, is_active, is_frozen")
    .eq("id", memberId)
    .maybeSingle();

  if (memberError) {
    throw new Error(`Failed to look up member: ${memberError.message}`);
  }
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
