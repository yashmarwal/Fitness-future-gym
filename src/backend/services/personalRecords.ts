import "server-only";
import { getDb } from "@/backend/db/client";

function normalizeExerciseKey(name: string): string {
  return name.trim().toLowerCase();
}

export type PrCheckResult = {
  isPr: boolean;
  isFirstTime: boolean;
  exerciseName: string;
  weightKg: number | null;
  reps: number;
  previousBestWeightKg: number | null;
  previousBestReps: number | null;
};

// Called right after a workout set is saved (see the workouts API route) —
// wrapped in try/catch by the caller-facing contract (returns null on any
// failure) so a PR-check hiccup can never stop a member's set from being
// recorded. member_exercise_prs is a brand-new TABLE, not just a column on
// an existing one, so every error is swallowed wholesale rather than the
// usual isMissingColumnError check — same reasoning as
// legacyFeeImport.ts's status card, which has the identical "two brand-new
// tables" situation.
export async function checkAndRecordPr(
  memberId: string,
  exerciseName: string,
  weightKg: number | undefined,
  reps: number
): Promise<PrCheckResult | null> {
  try {
    const db = getDb();
    const exerciseKey = normalizeExerciseKey(exerciseName);
    const newWeight = weightKg ?? null;

    const { data: existing, error: selectError } = await db
      .from("member_exercise_prs")
      .select("id, best_weight_kg, best_reps")
      .eq("member_id", memberId)
      .eq("exercise_key", exerciseKey)
      .maybeSingle();
    if (selectError) return null;

    const existingWeight: number | null = existing?.best_weight_kg ?? null;
    const existingReps: number | null = existing?.best_reps ?? null;

    // A missing weight compares as 0 — correctly handles bodyweight
    // exercises (compared on reps alone) and the jump from bodyweight to
    // any added weight, which always counts as a new best.
    const newWeightForCompare = newWeight ?? 0;
    const existingWeightForCompare = existingWeight ?? 0;

    const isNewBest =
      !existing ||
      newWeightForCompare > existingWeightForCompare ||
      (newWeightForCompare === existingWeightForCompare && reps > (existingReps ?? 0));

    const result: PrCheckResult = {
      isPr: isNewBest,
      isFirstTime: !existing,
      exerciseName,
      weightKg: newWeight,
      reps,
      previousBestWeightKg: existingWeight,
      previousBestReps: existingReps,
    };

    if (!isNewBest) return result;

    if (existing) {
      const { error: updateError } = await db
        .from("member_exercise_prs")
        .update({
          exercise_name: exerciseName,
          best_weight_kg: newWeight,
          best_reps: reps,
          achieved_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (updateError) return null;
    } else {
      const { error: insertError } = await db.from("member_exercise_prs").insert({
        member_id: memberId,
        exercise_key: exerciseKey,
        exercise_name: exerciseName,
        best_weight_kg: newWeight,
        best_reps: reps,
      });
      if (insertError) return null;
    }

    return result;
  } catch {
    return null;
  }
}

export type PersonalRecord = {
  exerciseName: string;
  bestWeightKg: number | null;
  bestReps: number;
  achievedAt: string;
};

// Powers the Personal Records page — swallows every error (missing table
// included) rather than throwing, same reasoning as checkAndRecordPr:
// this feature must never break the page it's on while its migration is
// still pending.
export async function listPersonalRecords(memberId: string): Promise<PersonalRecord[]> {
  try {
    const db = getDb();
    const { data, error } = await db
      .from("member_exercise_prs")
      .select("exercise_name, best_weight_kg, best_reps, achieved_at")
      .eq("member_id", memberId)
      .order("achieved_at", { ascending: false });
    if (error) return [];

    return (data ?? []).map((row) => ({
      exerciseName: row.exercise_name,
      bestWeightKg: row.best_weight_kg,
      bestReps: row.best_reps,
      achievedAt: row.achieved_at,
    }));
  } catch {
    return [];
  }
}
