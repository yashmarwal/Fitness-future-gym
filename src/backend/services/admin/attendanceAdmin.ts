import "server-only";
import { getDb } from "@/backend/db/client";
import type { AttendanceRow } from "@/types/admin";

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

export async function countTodaysCheckIns(): Promise<number> {
  const db = getDb();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count, error } = await db
    .from("attendance")
    .select("id", { count: "exact", head: true })
    .gte("checked_in_at", startOfDay.toISOString());

  if (error) throw new Error(`Failed to count check-ins: ${error.message}`);
  return count ?? 0;
}
