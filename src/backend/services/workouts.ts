import "server-only";
import { getDb } from "@/backend/db/client";

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
