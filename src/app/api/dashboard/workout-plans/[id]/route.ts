import { NextResponse } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { updateWorkoutPlan, deleteWorkoutPlan, type WorkoutPlanDay } from "@/backend/services/workoutPlans";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMemberSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name.trim() : undefined;
  const days = Array.isArray(body?.days) ? (body.days as WorkoutPlanDay[]) : undefined;

  try {
    const result = await updateWorkoutPlan(session.memberId, id, { name, days });
    if (result.status === "not_found") {
      return NextResponse.json({ status: "error", message: "Plan not found." }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMemberSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const { id } = await params;

  try {
    const result = await deleteWorkoutPlan(session.memberId, id);
    if (result.status === "not_found") {
      return NextResponse.json({ status: "error", message: "Plan not found." }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}
