import "server-only";
import { getDb } from "@/backend/db/client";

export type WorkoutPlanExercise = {
  name: string;
  sets: number;
  reps: string;
  notes?: string;
};

export type WorkoutPlanDay = {
  day: string;
  focus?: string;
  exercises: WorkoutPlanExercise[];
};

export type WorkoutPlan = {
  id: string;
  name: string;
  days: WorkoutPlanDay[];
  createdAt: string;
};

function mapRow(row: { id: string; name: string; days: unknown; created_at: string }): WorkoutPlan {
  return {
    id: row.id,
    name: row.name,
    days: Array.isArray(row.days) ? (row.days as WorkoutPlanDay[]) : [],
    createdAt: row.created_at,
  };
}

export async function listWorkoutPlans(memberId: string): Promise<WorkoutPlan[]> {
  const db = getDb();
  const { data, error } = await db
    .from("workout_plans")
    .select("id, name, days, created_at")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load workout plans: ${error.message}`);
  return (data ?? []).map(mapRow);
}

export async function createWorkoutPlan(
  memberId: string,
  input: { name: string; days: WorkoutPlanDay[] }
): Promise<WorkoutPlan> {
  const db = getDb();
  const { data, error } = await db
    .from("workout_plans")
    .insert({ member_id: memberId, name: input.name, days: input.days })
    .select("id, name, days, created_at")
    .single();

  if (error) throw new Error(`Failed to create workout plan: ${error.message}`);
  return mapRow(data);
}

// Ownership check (member_id match) on every mutation — this is
// member-facing, not admin, so a crafted request must never be able to
// touch another member's plan by guessing an id.
export async function updateWorkoutPlan(
  memberId: string,
  planId: string,
  input: { name?: string; days?: WorkoutPlanDay[] }
): Promise<{ status: "ok" } | { status: "not_found" }> {
  const db = getDb();
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.days !== undefined) patch.days = input.days;

  const { data, error } = await db
    .from("workout_plans")
    .update(patch)
    .eq("id", planId)
    .eq("member_id", memberId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Failed to update workout plan: ${error.message}`);
  return data ? { status: "ok" } : { status: "not_found" };
}

export async function deleteWorkoutPlan(
  memberId: string,
  planId: string
): Promise<{ status: "ok" } | { status: "not_found" }> {
  const db = getDb();
  const { data, error } = await db
    .from("workout_plans")
    .delete()
    .eq("id", planId)
    .eq("member_id", memberId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Failed to delete workout plan: ${error.message}`);
  return data ? { status: "ok" } : { status: "not_found" };
}
