import { NextResponse } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { logWorkout } from "@/backend/services/workouts";
import { awardWorkoutXp } from "@/backend/services/muscleProgress";

export async function POST(request: Request) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ status: "error", message: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const exerciseName = body?.exerciseName?.trim();
  const sets = Number(body?.sets);
  const reps = Number(body?.reps);
  const weightKg = body?.weightKg ? Number(body.weightKg) : undefined;

  if (!exerciseName || !sets || !reps) {
    return NextResponse.json({ status: "error", message: "Exercise, sets, and reps are required." }, { status: 400 });
  }

  try {
    await logWorkout(session.memberId, { exerciseName, sets, reps, weightKg });
    await awardWorkoutXp(session.memberId, exerciseName, sets).catch(() => {});
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}
