import { NextResponse, after } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { logWorkout } from "@/backend/services/workouts";
import { awardWorkoutXp } from "@/backend/services/muscleProgress";
import { checkAndRecordPr } from "@/backend/services/personalRecords";
import { checkAndAwardBadges } from "@/backend/services/badges";

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
    // Checked against the per-set weight/reps just logged, not sets*reps —
    // a PR is "heaviest weight for that many reps," never blocks or fails
    // the log itself (checkAndRecordPr swallows its own errors).
    const pr = await checkAndRecordPr(session.memberId, exerciseName, weightKg, reps).catch(() => null);
    // Deferred via after() — registered AFTER both XP and PR writes above
    // are already awaited/committed, so the badge check still reads
    // up-to-date numbers even though it runs post-response. No reason to
    // make the member wait on a handful of extra queries before their set
    // is confirmed logged.
    after(() => checkAndAwardBadges(session.memberId).catch(() => {}));
    return NextResponse.json({ status: "ok", pr });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}
