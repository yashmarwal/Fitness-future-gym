import { NextResponse } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { listWorkoutPlans, createWorkoutPlan, type WorkoutPlanDay } from "@/backend/services/workoutPlans";

export async function GET() {
  const session = await getMemberSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  try {
    const plans = await listWorkoutPlans(session.memberId);
    return NextResponse.json({ status: "ok", plans });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getMemberSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = body?.name?.trim();
  const days = Array.isArray(body?.days) ? (body.days as WorkoutPlanDay[]) : [];

  if (!name) {
    return NextResponse.json({ status: "error", message: "Plan name is required." }, { status: 400 });
  }

  try {
    const plan = await createWorkoutPlan(session.memberId, { name, days });
    return NextResponse.json({ status: "ok", plan });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}
