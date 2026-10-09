import { NextResponse } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { deleteSavedMeal } from "@/backend/services/savedMeals";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMemberSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const { id } = await params;

  try {
    const result = await deleteSavedMeal(session.memberId, id);
    if (result.status === "not_found") {
      return NextResponse.json({ status: "error", message: "Saved meal not found." }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}
