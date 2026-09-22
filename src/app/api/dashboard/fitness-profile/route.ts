import { NextResponse } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { saveFitnessProfile, type FitnessProfile } from "@/backend/services/fitnessProfile";

const GENDERS = new Set(["male", "female"]);
const GOAL_KEYS = new Set(["cut", "maintain", "bulk"]);
const EXPERIENCE_LEVELS = new Set(["beginner", "intermediate", "advanced"]);

// Sanity-range validated server-side — the wizard's own inputs already
// constrain these, but this route trusts nothing handed to it over the
// network, same as every other write in this app.
function parseProfile(body: unknown): FitnessProfile | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  const heightCm = Number(b.heightCm);
  const weightKg = Number(b.weightKg);
  const age = Number(b.age);
  const activityMultiplier = Number(b.activityMultiplier);
  const goalOffset = Number(b.goalOffset);
  const daysPerWeek = Number(b.daysPerWeek);

  if (!Number.isFinite(heightCm) || heightCm < 90 || heightCm > 250) return null;
  if (!Number.isFinite(weightKg) || weightKg < 35 || weightKg > 220) return null;
  if (!Number.isFinite(age) || age < 14 || age > 90) return null;
  if (!Number.isFinite(activityMultiplier) || activityMultiplier < 1 || activityMultiplier > 2.5) return null;
  if (!Number.isFinite(goalOffset) || goalOffset < -1000 || goalOffset > 1000) return null;
  if (!Number.isFinite(daysPerWeek) || daysPerWeek < 1 || daysPerWeek > 7) return null;
  if (typeof b.gender !== "string" || !GENDERS.has(b.gender)) return null;
  if (typeof b.goalKey !== "string" || !GOAL_KEYS.has(b.goalKey)) return null;
  if (typeof b.experienceLevel !== "string" || !EXPERIENCE_LEVELS.has(b.experienceLevel)) return null;

  return {
    heightCm,
    weightKg,
    age,
    gender: b.gender as FitnessProfile["gender"],
    activityMultiplier,
    goalOffset,
    goalKey: b.goalKey as FitnessProfile["goalKey"],
    experienceLevel: b.experienceLevel as FitnessProfile["experienceLevel"],
    daysPerWeek,
    completedAt: new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ status: "error", message: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const profile = parseProfile(body);
  if (!profile) {
    return NextResponse.json({ status: "error", message: "Invalid profile data." }, { status: 400 });
  }

  try {
    await saveFitnessProfile(session.memberId, profile);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("[fitness-profile] save failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ status: "error", message: "Could not save your profile." }, { status: 500 });
  }
}
