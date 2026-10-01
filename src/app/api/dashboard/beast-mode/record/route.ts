import { NextResponse } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { getGymBeastModeRecord } from "@/backend/services/beastMode";

export async function GET(request: Request) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ status: "error", message: "Not signed in." }, { status: 401 });
  }

  const exerciseName = new URL(request.url).searchParams.get("exercise")?.trim();
  if (!exerciseName) {
    return NextResponse.json({ status: "error", message: "Exercise is required." }, { status: 400 });
  }

  const record = await getGymBeastModeRecord(exerciseName);
  return NextResponse.json({ status: "ok", record });
}
