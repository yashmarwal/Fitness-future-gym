import "server-only";
import { getDb } from "@/backend/db/client";

export type BeastModeSet = {
  plannedWeightKg: number | null;
  plannedReps: number;
  actualWeightKg: number | null;
  actualReps: number;
  hit: boolean;
};

export type BeastModeSessionInput = {
  exerciseName: string;
  restSeconds: number;
  // Only the sets actually attempted — a partial list on an early exit.
  sets: BeastModeSet[];
};

export type BeastModeSessionResult = {
  sessionId: string;
  isNewGymRecord: boolean;
};

export type GymBeastModeRecord = {
  memberName: string;
  weightKg: number;
  reps: number;
  achievedAt: string;
};

function exerciseKey(name: string): string {
  return name.trim().toLowerCase();
}

// Persists a finished (or early-exited) session and, if its best completed
// set beats the standing gym record for that exercise, updates the
// permanent record board. A "hit" fail never counts toward the record —
// it didn't actually happen at that weight.
export async function recordBeastModeSession(
  memberId: string,
  input: BeastModeSessionInput
): Promise<BeastModeSessionResult> {
  const db = getDb();

  const setsCompleted = input.sets.length;
  const setsHit = input.sets.filter((s) => s.hit).length;
  const totalVolumeKg = input.sets.reduce((sum, s) => sum + (s.actualWeightKg ?? 0) * s.actualReps, 0);

  let bestWeightKg: number | null = null;
  let bestReps = 0;
  for (const s of input.sets) {
    if (!s.hit || s.actualWeightKg == null) continue;
    if (bestWeightKg === null || s.actualWeightKg > bestWeightKg) {
      bestWeightKg = s.actualWeightKg;
      bestReps = s.actualReps;
    }
  }

  const { data: session, error: insertError } = await db
    .from("beast_mode_sessions")
    .insert({
      member_id: memberId,
      exercise_name: input.exerciseName,
      rest_seconds: input.restSeconds,
      sets: input.sets,
      sets_completed: setsCompleted,
      sets_hit: setsHit,
      total_volume_kg: totalVolumeKg,
    })
    .select("id")
    .single();
  if (insertError) throw new Error(`Failed to save Beast Mode session: ${insertError.message}`);

  let isNewGymRecord = false;

  if (bestWeightKg !== null && bestWeightKg > 0) {
    const key = exerciseKey(input.exerciseName);
    const { data: existing, error: recordError } = await db
      .from("gym_beast_mode_records")
      .select("id, weight_kg")
      .eq("exercise_key", key)
      .maybeSingle();
    if (recordError) throw new Error(`Failed to check gym record: ${recordError.message}`);

    if (!existing || bestWeightKg > existing.weight_kg) {
      isNewGymRecord = true;
      if (existing) {
        const { error } = await db
          .from("gym_beast_mode_records")
          .update({
            member_id: memberId,
            exercise_name: input.exerciseName,
            weight_kg: bestWeightKg,
            reps: bestReps,
            achieved_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw new Error(`Failed to update gym record: ${error.message}`);
      } else {
        const { error } = await db.from("gym_beast_mode_records").insert({
          exercise_key: key,
          exercise_name: input.exerciseName,
          member_id: memberId,
          weight_kg: bestWeightKg,
          reps: bestReps,
        });
        if (error) throw new Error(`Failed to create gym record: ${error.message}`);
      }
    }
  }

  return { sessionId: session.id, isNewGymRecord };
}

// members(full_name) relies on gym_beast_mode_records.member_id's FK for
// PostgREST's embedded-resource join.
export async function getGymBeastModeRecord(exerciseName: string): Promise<GymBeastModeRecord | null> {
  const db = getDb();
  const { data, error } = await db
    .from("gym_beast_mode_records")
    .select("weight_kg, reps, achieved_at, members(full_name)")
    .eq("exercise_key", exerciseKey(exerciseName))
    .maybeSingle();
  if (error || !data) return null;

  const member = data.members as unknown as { full_name: string } | { full_name: string }[] | null;
  const memberName = Array.isArray(member) ? member[0]?.full_name : member?.full_name;
  if (!memberName) return null;

  return { memberName, weightKg: data.weight_kg, reps: data.reps, achievedAt: data.achieved_at };
}

const BEAST_MODE_SESSION_RETENTION_DAYS = 7;

export async function deleteOldBeastModeSessions(): Promise<{ deleted: number }> {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - BEAST_MODE_SESSION_RETENTION_DAYS);

  const { data, error } = await db
    .from("beast_mode_sessions")
    .delete()
    .lt("completed_at", cutoff.toISOString())
    .select("id");

  if (error) throw new Error(`Failed to delete old Beast Mode sessions: ${error.message}`);
  return { deleted: data?.length ?? 0 };
}

const GYM_RECORD_STALE_DAYS = 30;

// A record no one has beaten in 30 days clears off the board — recordBeastModeSession
// only ever compares against whatever row currently exists, so once it's
// gone the very next completed set for that exercise becomes the new
// record automatically. Keeps the board turning over instead of one lift
// being permanently unbeatable.
export async function deleteStaleGymBeastModeRecords(): Promise<{ deleted: number }> {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - GYM_RECORD_STALE_DAYS);

  const { data, error } = await db
    .from("gym_beast_mode_records")
    .delete()
    .lt("achieved_at", cutoff.toISOString())
    .select("id");

  if (error) throw new Error(`Failed to delete stale gym Beast Mode records: ${error.message}`);
  return { deleted: data?.length ?? 0 };
}
