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

// After a workout log is corrected (see workouts.ts::updateWorkoutLog), this
// keeps its Personal Record honest in the two directions an edit can push
// it:
//   1. UPGRADE — the corrected numbers are now a genuine new best. Just
//      re-running checkAndRecordPr on the new values handles this exactly
//      like a fresh log would; no special logic needed.
//   2. DOWNGRADE — this log's PRE-edit numbers were the current stored
//      record, and the correction lowers them (or moves the log to a
//      different exercise entirely), so the record no longer has a log
//      backing it. Recomputes from whatever of the member's OTHER logs for
//      that exercise still exist.
//
// The downgrade side is deliberately conservative: member_exercise_prs
// exists precisely because workout_logs is purged after 30 days (see
// listPersonalRecords above), so "no matching logs remain" is genuinely
// ambiguous — it could mean there's truly nothing to back the record
// anymore, or it could mean the real set that earned it just aged out of
// the log. Rather than guess, that case is left untouched. A downgrade only
// ever happens when there's a REMAINING log to positively point to as the
// new true best.
export async function reconcilePrAfterEdit(
  memberId: string,
  oldExerciseName: string,
  oldWeightKg: number | null,
  oldReps: number,
  newExerciseName: string,
  newWeightKg: number | undefined,
  newReps: number
): Promise<void> {
  await checkAndRecordPr(memberId, newExerciseName, newWeightKg, newReps).catch(() => null);
  await reconsiderPrDowngrade(memberId, oldExerciseName, oldWeightKg, oldReps).catch(() => {});
}

async function reconsiderPrDowngrade(
  memberId: string,
  exerciseName: string,
  oldWeightKg: number | null,
  oldReps: number
): Promise<void> {
  const db = getDb();
  const exerciseKey = normalizeExerciseKey(exerciseName);

  const { data: pr, error: prError } = await db
    .from("member_exercise_prs")
    .select("id, best_weight_kg, best_reps")
    .eq("member_id", memberId)
    .eq("exercise_key", exerciseKey)
    .maybeSingle();
  if (prError || !pr) return;

  const oldW = oldWeightKg ?? 0;
  const prW = pr.best_weight_kg ?? 0;
  // Only reconsider if this log's PRE-edit values are exactly what's
  // currently stored as the record — real evidence this specific log was
  // (or could have been) the record's source, not just any past set for
  // this exercise.
  if (oldW !== prW || oldReps !== pr.best_reps) return;

  const { data: logs, error: logsError } = await db
    .from("workout_logs")
    .select("exercise_name, weight_kg, reps, logged_at")
    .eq("member_id", memberId);
  if (logsError || !logs) return;

  const matching = logs.filter((l) => normalizeExerciseKey(l.exercise_name) === exerciseKey);
  if (matching.length === 0) return;

  let best = matching[0];
  for (const l of matching) {
    const bw = l.weight_kg ?? 0;
    const cw = best.weight_kg ?? 0;
    if (bw > cw || (bw === cw && l.reps > best.reps)) best = l;
  }

  const bestW = best.weight_kg ?? 0;
  const isLower = bestW < prW || (bestW === prW && best.reps < pr.best_reps);
  if (!isLower) return;

  await db
    .from("member_exercise_prs")
    .update({ best_weight_kg: best.weight_kg, best_reps: best.reps, achieved_at: best.logged_at })
    .eq("id", pr.id);
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
