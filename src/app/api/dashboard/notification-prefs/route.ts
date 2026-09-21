import { NextResponse } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { updateNotificationPrefs } from "@/backend/services/member";
import { setWorkoutPromptEnabled } from "@/backend/services/workoutPrompt";

export async function POST(request: Request) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ status: "error", message: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ status: "error", message: "Invalid request." }, { status: 400 });
  }

  const prefs: { water?: boolean; mealLog?: boolean; streak?: boolean } = {};
  if (typeof body.water === "boolean") prefs.water = body.water;
  if (typeof body.mealLog === "boolean") prefs.mealLog = body.mealLog;
  if (typeof body.streak === "boolean") prefs.streak = body.streak;

  try {
    await updateNotificationPrefs(session.memberId, prefs);
    // Its own column (and its own migration), so it's saved separately from
    // the others — see workoutPrompt.ts.
    if (typeof body.workout === "boolean") await setWorkoutPromptEnabled(session.memberId, body.workout);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Could not save preference." }, { status: 500 });
  }
}
