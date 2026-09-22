import "server-only";
import { getDb } from "@/backend/db/client";
import { isMissingColumnError } from "@/backend/db/errors";
import type { Gender, FitnessGoalKey } from "@/frontend/lib/bmiMacro";
import type { ExperienceLevel } from "@/frontend/lib/workoutTemplates";

// The fitness-onboarding wizard's saved answers (see schema.sql's migration
// note) — one jsonb blob, read and written as a unit, never queried by an
// individual field in SQL. heightCm/weightKg/age/gender/activityMultiplier/
// goalOffset feed the exact same calculateBmiMacro() the BMI tile and the
// public calculator use; experienceLevel/daysPerWeek feed the workout-plan
// recommendation (workoutRecommendation.ts) and nothing else.
export type FitnessProfile = {
  heightCm: number;
  weightKg: number;
  age: number;
  gender: Gender;
  activityMultiplier: number;
  goalOffset: number;
  goalKey: FitnessGoalKey;
  experienceLevel: ExperienceLevel;
  daysPerWeek: number;
  completedAt: string;
};

const EXPERIENCE_LEVELS = new Set(["beginner", "intermediate", "advanced"]);
const GOAL_KEYS = new Set(["cut", "maintain", "bulk"]);

// Matches the write-time validation in the API route (route.ts) — the only
// path that ever saves this, so a mismatch here can't happen today, but a
// weaker check here would silently stop protecting the read side the
// moment another write path is ever added.
function isValid(v: unknown): v is FitnessProfile {
  if (!v || typeof v !== "object") return false;
  const p = v as Record<string, unknown>;
  return (
    typeof p.heightCm === "number" &&
    typeof p.weightKg === "number" &&
    typeof p.age === "number" &&
    (p.gender === "male" || p.gender === "female") &&
    typeof p.activityMultiplier === "number" &&
    typeof p.goalOffset === "number" &&
    typeof p.goalKey === "string" &&
    GOAL_KEYS.has(p.goalKey) &&
    typeof p.experienceLevel === "string" &&
    EXPERIENCE_LEVELS.has(p.experienceLevel) &&
    typeof p.daysPerWeek === "number" &&
    typeof p.completedAt === "string"
  );
}

// Column not migrated yet, or nothing saved yet: both simply read as "no
// profile" — the wizard/BMI tile/nudge banner all treat that the same way
// (show defaults, show the nudge), so callers don't need to tell the two
// apart.
export async function getFitnessProfile(memberId: string): Promise<FitnessProfile | null> {
  const { data, error } = await getDb().from("members").select("fitness_profile").eq("id", memberId).maybeSingle();
  if (error) return null;
  const raw = (data as { fitness_profile?: unknown } | null)?.fitness_profile;
  return isValid(raw) ? raw : null;
}

export async function saveFitnessProfile(memberId: string, profile: FitnessProfile): Promise<void> {
  const { error } = await getDb().from("members").update({ fitness_profile: profile }).eq("id", memberId);
  if (error) {
    if (isMissingColumnError(error)) {
      throw new Error("This gym's database hasn't been updated for profiles yet — ask the gym to run the pending migration.");
    }
    throw new Error(`Failed to save fitness profile: ${error.message}`);
  }
}
