import { NextResponse } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { createRoom, listMyRooms, type PlaygroundMode } from "@/backend/services/playground";

const VALID_MODES: PlaygroundMode[] = ["common_exercise", "xp_race"];

export async function GET() {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ status: "error", message: "Not signed in." }, { status: 401 });
  }

  try {
    const rooms = await listMyRooms(session.memberId);
    return NextResponse.json({ status: "ok", rooms });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ status: "error", message: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const mode = body?.mode;
  const durationMinutes = Number(body?.durationMinutes);
  const inviteeIds = Array.isArray(body?.inviteeIds) ? body.inviteeIds.filter((id: unknown) => typeof id === "string") : [];

  if (!VALID_MODES.includes(mode)) {
    return NextResponse.json({ status: "error", message: "Invalid mode." }, { status: 400 });
  }

  try {
    const result = await createRoom(session.memberId, {
      name: typeof body?.name === "string" ? body.name : "",
      mode,
      exerciseName: typeof body?.exerciseName === "string" ? body.exerciseName : undefined,
      durationMinutes,
      inviteeIds,
    });
    return NextResponse.json({ status: "ok", ...result });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ status: "error", message }, { status: 400 });
  }
}
