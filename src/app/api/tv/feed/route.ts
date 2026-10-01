import { NextResponse } from "next/server";
import { getDb } from "@/backend/db/client";
import { finalizeDueRooms } from "@/backend/services/playground";

// Public, unauthenticated — this is meant to be left open on a gym TV/
// display device all day, the same way /api/attendance (the QR check-in
// poster) needs no session. Playground-only: PRs and Beast Mode records
// used to be mixed in here too, but a single active member can rack up
// several PRs across different exercises in one sitting, which just
// repeated their name over and over in the ticker. Restricting this to
// Playground wins keeps it to one real "event" per entry.
export const dynamic = "force-dynamic";

type FeedItem = {
  id: string;
  firstName: string;
  at: string;
  exerciseName?: string;
  playgroundMode: "common_exercise" | "xp_race";
};

const LIMIT = 15;

function firstNameOf(members: unknown): string | null {
  const row = Array.isArray(members) ? members[0] : members;
  const fullName = (row as { full_name?: string } | null)?.full_name;
  if (!fullName) return null;
  return fullName.trim().split(/\s+/)[0] ?? null;
}

export async function GET() {
  const db = getDb();

  // A room only finalizes (picks a winner) lazily, when a participant
  // reopens it after time's up — sweep anything overdue first so a winner
  // that nobody happened to check on still shows up here.
  await finalizeDueRooms().catch((err) => console.error("[tv feed] finalizeDueRooms failed:", err));

  const { data: wins, error } = await db
    .from("playground_rooms")
    // playground_rooms has two FKs into members (created_by and
    // winner_member_id) — the !winner_member_id hint is required so
    // PostgREST knows which one this embed follows, not the other.
    .select("id, mode, exercise_name, ends_at, winner:members!winner_member_id(full_name)")
    .eq("status", "ended")
    .not("winner_member_id", "is", null)
    .order("ends_at", { ascending: false })
    .limit(LIMIT);

  if (error) {
    console.error("[tv feed]", error);
    return NextResponse.json({ status: "ok", items: [] });
  }

  const items: FeedItem[] = [];
  for (const row of wins ?? []) {
    const firstName = firstNameOf(row.winner);
    if (!firstName || !row.ends_at) continue;
    items.push({
      id: `win:${row.id}`,
      firstName,
      at: row.ends_at,
      exerciseName: row.exercise_name ?? undefined,
      playgroundMode: row.mode as "common_exercise" | "xp_race",
    });
  }

  return NextResponse.json({ status: "ok", items });
}
