import { NextResponse } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { updateWorkoutLog } from "@/backend/services/workouts";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMemberSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const exerciseName = typeof body?.exerciseName === "string" ? body.exerciseName.trim() : undefined;
  const sets = body?.sets !== undefined ? Number(body.sets) : undefined;
  const reps = body?.reps !== undefined ? Number(body.reps) : undefined;
  const weightKg =
    body?.weightKg === null || body?.weightKg === "" ? null : body?.weightKg !== undefined ? Number(body.weightKg) : undefined;

  if (
    exerciseName === "" ||
    (sets !== undefined && (!Number.isFinite(sets) || sets < 1)) ||
    (reps !== undefined && (!Number.isFinite(reps) || reps < 1))
  ) {
    return NextResponse.json({ status: "error", message: "Exercise, sets, and reps are required." }, { status: 400 });
  }

  try {
    const result = await updateWorkoutLog(session.memberId, id, { exerciseName, sets, reps, weightKg });
    if (result.status === "not_found") {
      return NextResponse.json({ status: "error", message: "Log not found." }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}
