import "server-only";
import { getDb } from "@/backend/db/client";

const DAY_MS = 86_400_000;
const PAGE_SIZE = 1000; // Supabase's default cap on rows per request
const MAX_PAGES = 20;

function istDayBounds(istDate: string): { startIso: string; endIso: string } {
  const start = new Date(`${istDate}T00:00:00+05:30`);
  return { startIso: start.toISOString(), endIso: new Date(start.getTime() + DAY_MS).toISOString() };
}

// Check-ins on one IST calendar day, counted the same way as the Overview's
// "check-ins today" (every attendance row).
export async function countCheckInsOn(istDate: string): Promise<number> {
  const { startIso, endIso } = istDayBounds(istDate);
  const { count, error } = await getDb()
    .from("attendance")
    .select("id", { count: "exact", head: true })
    .gte("checked_in_at", startIso)
    .lt("checked_in_at", endIso);
  if (error) throw new Error(`Failed to count check-ins for ${istDate}: ${error.message}`);
  return count ?? 0;
}

// Every check-in since a moment, across all members, paged past Supabase's
// 1000-row default. Attendance rows are only kept ~30 days, so this stays small.
export async function listAttendanceSince(sinceIso: string): Promise<{ memberId: string; checkedInAt: string }[]> {
  const db = getDb();
  const rows: { memberId: string; checkedInAt: string }[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await db
      .from("attendance")
      .select("member_id, checked_in_at")
      .gte("checked_in_at", sinceIso)
      .order("checked_in_at", { ascending: true })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (error) throw new Error(`Failed to load attendance: ${error.message}`);
    for (const row of data ?? []) rows.push({ memberId: row.member_id as string, checkedInAt: row.checked_in_at as string });
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}
