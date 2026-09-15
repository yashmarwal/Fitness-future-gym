import "server-only";
import { getDb } from "@/backend/db/client";
import { matchExerciseCategory, type ExerciseCategory } from "@/frontend/lib/exerciseLibrary";

// Deliberately a small, permanent, incrementing total — NOT computed by
// summing workout_logs on every read. workout_logs is purged after 30 days
// (see WORKOUT_LOG_RETENTION_DAYS in workouts.ts), so deriving XP from it
// live would silently regress a member's rank every month as old sets age
// out of the log, which defeats the entire point of a progression system
// that's supposed to feel earned and permanent. Instead each logged set
// increments member_muscle_xp once, at insert time, and that total is never
// recomputed from history the way the streak tracker's "best streak" is.
export const XP_PER_SET = 12;

export const ALL_CATEGORIES: ExerciseCategory[] = [
  "Chest",
  "Back",
  "Shoulders",
  "Legs",
  "Arms",
  "Core",
  "Cardio",
  "Full Body",
];

export const RANKS = [
  { name: "Bronze", threshold: 0 },
  { name: "Silver", threshold: 300 },
  { name: "Gold", threshold: 800 },
  { name: "Platinum", threshold: 1800 },
  { name: "Diamond", threshold: 3600 },
  { name: "Legend", threshold: 6500 },
] as const;

export type MuscleProgress = {
  category: ExerciseCategory;
  xp: number;
  rankName: string;
  rankIndex: number;
  xpIntoRank: number;
  xpForNextRank: number | null;
  progressPct: number;
  maxed: boolean;
};

function buildProgress(category: ExerciseCategory, xp: number): MuscleProgress {
  let rankIndex = 0;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].threshold) {
      rankIndex = i;
      break;
    }
  }
  const current = RANKS[rankIndex];
  const next = RANKS[rankIndex + 1] ?? null;
  const xpIntoRank = xp - current.threshold;
  const xpForNextRank = next ? next.threshold - current.threshold : null;
  const progressPct = next ? Math.min(100, Math.round((xpIntoRank / (xpForNextRank as number)) * 100)) : 100;

  return {
    category,
    xp,
    rankName: current.name,
    rankIndex,
    xpIntoRank,
    xpForNextRank,
    progressPct,
    maxed: !next,
  };
}

// Fails open (missing table → everyone shows at Bronze/0 XP, not an error
// page) since member_muscle_xp needs a migration run on the live DB —
// mirrors the same fail-open pattern used for frozen_reason/frozen_at in
// admin/feeAbuse.ts before that migration had been run.
export async function getMemberMuscleProgress(memberId: string): Promise<MuscleProgress[]> {
  const db = getDb();
  let rows: { category: string; xp: number }[] = [];
  try {
    const { data, error } = await db.from("member_muscle_xp").select("category, xp").eq("member_id", memberId);
    if (error) throw error;
    rows = data ?? [];
  } catch {
    rows = [];
  }

  const xpByCategory = new Map(rows.map((r) => [r.category, r.xp]));
  return ALL_CATEGORIES.map((category) => buildProgress(category, xpByCategory.get(category) ?? 0));
}

// Called from the workout-log API route right after a set is saved. Never
// throws — callers wrap this in .catch(() => {}) so a missing migration or
// an unrecognized exercise name never breaks the actual workout log save.
export async function awardWorkoutXp(memberId: string, exerciseName: string, sets: number): Promise<void> {
  const category = matchExerciseCategory(exerciseName);
  if (!category || sets <= 0) return;

  const db = getDb();
  const xpGain = sets * XP_PER_SET;

  const { data: existing, error: selectError } = await db
    .from("member_muscle_xp")
    .select("id, xp")
    .eq("member_id", memberId)
    .eq("category", category)
    .maybeSingle();
  if (selectError) throw selectError;

  if (existing) {
    const { error } = await db
      .from("member_muscle_xp")
      .update({ xp: existing.xp + xpGain, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await db.from("member_muscle_xp").insert({ member_id: memberId, category, xp: xpGain });
    if (error) throw error;
  }
}
