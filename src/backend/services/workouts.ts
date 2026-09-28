import "server-only";
import { getDb } from "@/backend/db/client";
import { reconcilePrAfterEdit } from "@/backend/services/personalRecords";
import { reconcileXpAfterEdit } from "@/backend/services/muscleProgress";

export type WorkoutLog = {
  id: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weightKg: number | null;
  loggedAt: string;
};

export async function logWorkout(
  memberId: string,
  entry: { exerciseName: string; sets: number; reps: number; weightKg?: number }
): Promise<void> {
  const db = getDb();
  const { error } = await db.from("workout_logs").insert({
    member_id: memberId,
    exercise_name: entry.exerciseName,
    sets: entry.sets,
    reps: entry.reps,
    weight_kg: entry.weightKg ?? null,
  });

  if (error) throw new Error(`Failed to log workout: ${error.message}`);
}

// Corrects a logged set after the fact (e.g. a stray "125" instead of "25")
// without deleting and re-logging it — which would lose its original
// logged_at (so it'd sort/group into the wrong day) and could double-count
// it in awardWorkoutXp/checkAndRecordPr if the member then logged a fresh
// correct set instead of noticing this existed. Scoped to memberId the same
// way updateWorkoutPlan is, so one member can never edit another's log via a
// guessed id.
//
// Also keeps Personal Records and Muscle XP honest — both are permanent
// totals that only ever get touched at log time (see personalRecords.ts /
// muscleProgress.ts), so without this an edit here would silently leave a
// stale PR or a wrong XP total behind, from data that no longer matches
// what's actually logged. Reconciliation runs best-effort AFTER the real
// update succeeds — a hiccup there must never undo or fail the correction
// itself, which is already saved by that point.
export async function updateWorkoutLog(
  memberId: string,
  logId: string,
  input: { exerciseName?: string; sets?: number; reps?: number; weightKg?: number | null }
): Promise<{ status: "ok" } | { status: "not_found" }> {
  const db = getDb();

  const { data: existing, error: fetchError } = await db
    .from("workout_logs")
    .select("exercise_name, sets, reps, weight_kg")
    .eq("id", logId)
    .eq("member_id", memberId)
    .maybeSingle();
  if (fetchError) throw new Error(`Failed to load workout log: ${fetchError.message}`);
  if (!existing) return { status: "not_found" };

  const patch: Record<string, unknown> = {};
  if (input.exerciseName !== undefined) patch.exercise_name = input.exerciseName;
  if (input.sets !== undefined) patch.sets = input.sets;
  if (input.reps !== undefined) patch.reps = input.reps;
  if (input.weightKg !== undefined) patch.weight_kg = input.weightKg;

  const { data, error } = await db
    .from("workout_logs")
    .update(patch)
    .eq("id", logId)
    .eq("member_id", memberId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Failed to update workout log: ${error.message}`);
  if (!data) return { status: "not_found" };

  const newExerciseName = input.exerciseName ?? existing.exercise_name;
  const newSets = input.sets ?? existing.sets;
  const newReps = input.reps ?? existing.reps;
  const newWeightKg = input.weightKg !== undefined ? (input.weightKg ?? undefined) : (existing.weight_kg ?? undefined);

  await reconcileXpAfterEdit(memberId, existing.exercise_name, existing.sets, newExerciseName, newSets).catch(() => {});
  await reconcilePrAfterEdit(
    memberId,
    existing.exercise_name,
    existing.weight_kg,
    existing.reps,
    newExerciseName,
    newWeightKg,
    newReps
  ).catch(() => {});

  return { status: "ok" };
}

const WORKOUT_LOG_RETENTION_DAYS = 30;

// Logs, not plans — a saved workout_plans split is a template the member
// wants to keep indefinitely, not a dated record, so it's untouched here.
export async function deleteOldWorkoutLogs(): Promise<{ deleted: number }> {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - WORKOUT_LOG_RETENTION_DAYS);

  const { data, error } = await db
    .from("workout_logs")
    .delete()
    .lt("logged_at", cutoff.toISOString())
    .select("id");

  if (error) throw new Error(`Failed to delete old workout logs: ${error.message}`);
  return { deleted: data?.length ?? 0 };
}

export async function listWorkoutLogs(memberId: string, limit = 20): Promise<WorkoutLog[]> {
  const db = getDb();
  const { data, error } = await db
    .from("workout_logs")
    .select("id, exercise_name, sets, reps, weight_kg, logged_at")
    .eq("member_id", memberId)
    .order("logged_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load workout logs: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    exerciseName: row.exercise_name,
    sets: row.sets,
    reps: row.reps,
    weightKg: row.weight_kg,
    loggedAt: row.logged_at,
  }));
}
