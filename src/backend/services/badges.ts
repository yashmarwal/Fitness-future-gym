import "server-only";
import { getDb } from "@/backend/db/client";
import { getMemberMuscleProgress, RANKS } from "@/backend/services/muscleProgress";
import { createNotification } from "@/backend/services/memberNotifications";
import { BADGE_MAP, type BadgeId } from "@/frontend/lib/badges";

const GOLD_XP = RANKS.find((r) => r.name === "Gold")!.threshold;
const DIAMOND_XP = RANKS.find((r) => r.name === "Diamond")!.threshold;
const LEGEND_XP = RANKS.find((r) => r.name === "Legend")!.threshold;
const SILVER_XP = RANKS.find((r) => r.name === "Silver")!.threshold;

const BENCH_CLUB_KG = 60;
const SQUAT_CLUB_KG = 100;
const DEADLIFT_CLUB_KG = 120;

// Matched against member_exercise_prs.exercise_key (already
// trim().toLowerCase()'d at write time — see personalRecords.ts), copied
// from the matching entries' own alias lists in exerciseLibrary.ts.
// Deliberately NOT routed through matchExerciseCategory's fuzzy matching —
// that's tuned for "which muscle group earned XP," a looser question than
// "is this specifically a flat barbell bench/squat/deadlift," where a false
// positive (crediting an incline press as "Bench Press Club") would be a
// real wrong claim on a card a member might share.
const LIFT_CLUB_ALIASES: Record<"bench_club" | "squat_club" | "deadlift_club", Set<string>> = {
  bench_club: new Set([
    "barbell bench press", "bench press", "bench", "barbell bench", "bb bench",
    "flat bench", "flat bench press", "flat barbell press", "chest press barbell",
  ]),
  squat_club: new Set([
    "barbell back squat", "squat", "squats", "back squat", "bb squat",
    "barbell squat", "squat barbell", "high bar squat", "low bar squat",
  ]),
  deadlift_club: new Set([
    "deadlift", "conventional deadlift", "dl", "barbell deadlift",
    "deadlifts", "dead lift", "deadlift barbell",
  ]),
};
const LIFT_CLUB_MIN_KG: Record<"bench_club" | "squat_club" | "deadlift_club", number> = {
  bench_club: BENCH_CLUB_KG,
  squat_club: SQUAT_CLUB_KG,
  deadlift_club: DEADLIFT_CLUB_KG,
};

export type EarnedBadge = { badgeId: BadgeId; earnedAt: string };

// Powers the badge shelf (dashboard/achievements) — every badge type is
// brand-new (member_badges didn't exist before this feature), same
// "swallow every error, including a missing table" posture
// checkAndRecordPr/listPersonalRecords already use for the identical
// situation, so a pending migration degrades to an empty shelf instead of
// a broken page.
export async function listMemberBadges(memberId: string): Promise<EarnedBadge[]> {
  try {
    const db = getDb();
    const { data, error } = await db.from("member_badges").select("badge_id, earned_at").eq("member_id", memberId);
    if (error) return [];
    return (data ?? []).map((row) => ({ badgeId: row.badge_id as BadgeId, earnedAt: row.earned_at as string }));
  } catch {
    return [];
  }
}

// Re-evaluates EVERY badge condition against the member's current stats and
// awards whichever ones aren't already owned — called after any event that
// could cross a threshold (a check-in, a logged set, a Playground win)
// rather than each call site trying to know which specific badges its own
// event could possibly affect. The handful of extra reads this costs per
// event is cheap next to the risk of a narrower per-event check quietly
// missing a badge because its trigger logic drifted out of sync with the
// catalog. Never throws — every caller fires this with .catch(() => {}),
// same posture as awardWorkoutXp/checkAndRecordPr: a badge-check failure
// must never break the real action (a check-in, a logged set) it rode in
// on.
export async function checkAndAwardBadges(memberId: string): Promise<BadgeId[]> {
  try {
    const db = getDb();

    const { data: existingRows, error: existingError } = await db
      .from("member_badges")
      .select("badge_id")
      .eq("member_id", memberId);
    if (existingError) return [];
    const owned = new Set((existingRows ?? []).map((r) => r.badge_id as BadgeId));

    const earned = new Set<BadgeId>();

    const { data: memberRow, error: memberError } = await db
      .from("members")
      .select("total_checkins, current_streak_days, playground_wins")
      .eq("id", memberId)
      .maybeSingle();
    if (!memberError && memberRow) {
      const checkins = (memberRow.total_checkins as number | null) ?? 0;
      const streak = (memberRow.current_streak_days as number | null) ?? 0;
      const wins = (memberRow.playground_wins as number | null) ?? 0;

      if (checkins >= 1) earned.add("first_checkin");
      if (checkins >= 10) earned.add("checkins_10");
      if (checkins >= 50) earned.add("checkins_50");
      if (checkins >= 100) earned.add("checkins_100");

      if (streak >= 7) earned.add("streak_bronze");
      if (streak >= 30) earned.add("streak_silver");
      if (streak >= 60) earned.add("streak_gold");
      if (streak >= 100) earned.add("streak_platinum");

      if (wins >= 1) earned.add("playground_first_win");
      if (wins >= 5) earned.add("playground_5_wins");
      if (wins >= 15) earned.add("playground_15_wins");
    }

    const { data: prRows, error: prError } = await db
      .from("member_exercise_prs")
      .select("exercise_key, best_weight_kg")
      .eq("member_id", memberId);
    if (!prError && prRows) {
      if (prRows.length >= 1) earned.add("first_pr");
      if (prRows.length >= 10) earned.add("prs_10");
      if (prRows.length >= 25) earned.add("prs_25");

      for (const row of prRows) {
        const key = row.exercise_key as string;
        const weight = (row.best_weight_kg as number | null) ?? 0;
        for (const badgeId of ["bench_club", "squat_club", "deadlift_club"] as const) {
          if (LIFT_CLUB_ALIASES[badgeId].has(key) && weight >= LIFT_CLUB_MIN_KG[badgeId]) earned.add(badgeId);
        }
      }
    }

    const progress = await getMemberMuscleProgress(memberId);
    if (progress.some((p) => p.xp >= GOLD_XP)) earned.add("rank_gold");
    if (progress.some((p) => p.xp >= DIAMOND_XP)) earned.add("rank_diamond");
    if (progress.some((p) => p.xp >= LEGEND_XP)) earned.add("rank_legend");
    if (progress.every((p) => p.xp >= SILVER_XP)) earned.add("well_rounded");

    const newlyEarned = [...earned].filter((id) => !owned.has(id));
    if (newlyEarned.length === 0) return [];

    // upsert + ignoreDuplicates, not a plain insert — two concurrent calls
    // both crossing the same threshold at once is expected (check-in and a
    // logged set can land in the same few seconds), and a plain multi-row
    // insert is all-or-nothing: one row losing a race to the unique
    // constraint would fail the WHOLE batch, silently dropping every other
    // genuinely-new badge in it too. This way only the actual conflicting
    // row is skipped.
    const { error: insertError } = await db
      .from("member_badges")
      .upsert(
        newlyEarned.map((badge_id) => ({ member_id: memberId, badge_id })),
        { onConflict: "member_id,badge_id", ignoreDuplicates: true }
      );
    if (insertError) return [];

    await Promise.all(
      newlyEarned.map((badgeId) => {
        const def = BADGE_MAP[badgeId];
        return createNotification({
          memberId,
          type: "badge_earned",
          title: `New Badge: ${def.name}`,
          body: def.description,
        }).catch(() => {});
      })
    );

    return newlyEarned;
  } catch {
    return [];
  }
}
