import { NextResponse } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { createSavedMeal, type SavedMealItem } from "@/backend/services/savedMeals";

function parseItems(raw: unknown): SavedMealItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => ({
      description: typeof item?.description === "string" ? item.description.trim() : "",
      calories: Number(item?.calories),
      proteinG: item?.proteinG != null ? Number(item.proteinG) : null,
      carbsG: item?.carbsG != null ? Number(item.carbsG) : null,
      fatG: item?.fatG != null ? Number(item.fatG) : null,
    }))
    .filter((item) => item.description && Number.isFinite(item.calories));
}

export async function POST(request: Request) {
  const session = await getMemberSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const category = typeof body?.category === "string" ? body.category.trim() : "";
  const items = parseItems(body?.items);

  if (!name) {
    return NextResponse.json({ status: "error", message: "Meal name is required." }, { status: 400 });
  }
  if (!category) {
    return NextResponse.json({ status: "error", message: "A category is required." }, { status: 400 });
  }
  if (!items.length) {
    return NextResponse.json({ status: "error", message: "Pick at least one item to save." }, { status: 400 });
  }

  try {
    const meal = await createSavedMeal(session.memberId, { name, category, items });
    return NextResponse.json({ status: "ok", meal });
  } catch (err) {
    console.error(err);
    // createSavedMeal throws an actionable message when the table isn't
    // migrated yet (see savedMeals.ts) — relay it instead of a generic
    // string, same as the broadcast route does for markHolidayRange.
    return NextResponse.json(
      { status: "error", message: err instanceof Error ? err.message : "Something went wrong." },
      { status: 500 }
    );
  }
}
