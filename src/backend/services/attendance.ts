import "server-only";
import { getDb } from "@/backend/db/client";
import type { CheckInResult } from "@/types/member";

const COOLDOWN_HOURS = 3;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

type MemberRow = { id: string; full_name: string; membership_number: string; is_active: boolean };

// Shared by both check-in paths: the front-desk QR poster (looked up by
// membership number, no login needed) and the dashboard's own one-tap
// button (already-authenticated member, looked up by id) — same cooldown,
// same attendance row, same last_checked_in_at update either way.
async function checkInMemberRow(member: MemberRow): Promise<CheckInResult> {
  const db = getDb();

  if (!member.is_active) {
    return { status: "inactive" };
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
  // rows are purged after 60 days but long-term inactivity still needs to
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
    .select("id, full_name, membership_number, is_active")
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
    .select("id, full_name, membership_number, is_active")
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
// cooldown window as checkInMemberRow, read-only.
export async function getAttendanceStatus(memberId: string): Promise<AttendanceStatus> {
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
}

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

const ATTENDANCE_RETENTION_DAYS = 60;

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
