import { NextResponse } from "next/server";
import { getMemberSession } from "@/server/auth/session";
import { logFood } from "@/server/services/nutrition";

export async function POST(request: Request) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ status: "error", message: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const description = body?.description?.trim();
  const calories = Number(body?.calories);

  if (!description || !calories) {
    return NextResponse.json({ status: "error", message: "Description and calories are required." }, { status: 400 });
  }

  try {
    await logFood(session.memberId, {
      description,
      calories,
      proteinG: body?.proteinG ? Number(body.proteinG) : undefined,
      carbsG: body?.carbsG ? Number(body.carbsG) : undefined,
      fatG: body?.fatG ? Number(body.fatG) : undefined,
    });
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}
