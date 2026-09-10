import "server-only";
import { getDb } from "@/server/db/client";
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
  const { error } = await db.from("attendance").insert({
    member_id: memberId,
    checked_in_at: checkedInAt ?? new Date().toISOString(),
  });
  if (error) throw new Error(`Failed to add attendance: ${error.message}`);
}

export async function deleteAttendance(id: string): Promise<void> {
  const db = getDb();
  const { error } = await db.from("attendance").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete attendance: ${error.message}`);
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
