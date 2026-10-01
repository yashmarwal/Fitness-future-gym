import { NextResponse } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { recordBeastModeSession, type BeastModeSet } from "@/backend/services/beastMode";

function isValidSet(s: unknown): s is BeastModeSet {
  if (!s || typeof s !== "object") return false;
  const set = s as Record<string, unknown>;
  return (
    (set.plannedWeightKg === null || typeof set.plannedWeightKg === "number") &&
    typeof set.plannedReps === "number" &&
    (set.actualWeightKg === null || typeof set.actualWeightKg === "number") &&
    typeof set.actualReps === "number" &&
    typeof set.hit === "boolean"
  );
}

export async function POST(request: Request) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ status: "error", message: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const exerciseName = body?.exerciseName?.trim();
  const restSeconds = Number(body?.restSeconds);
  const sets = Array.isArray(body?.sets) ? body.sets : null;

  if (!exerciseName || !Number.isFinite(restSeconds) || restSeconds < 0 || !sets || sets.length === 0 || !sets.every(isValidSet)) {
    return NextResponse.json({ status: "error", message: "Invalid Beast Mode session." }, { status: 400 });
  }

  try {
    const result = await recordBeastModeSession(session.memberId, { exerciseName, restSeconds, sets });
    return NextResponse.json({ status: "ok", ...result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}
