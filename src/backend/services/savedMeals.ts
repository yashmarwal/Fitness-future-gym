import "server-only";
import { getDb } from "@/backend/db/client";
import { isMissingTableError } from "@/backend/db/errors";

export type SavedMealItem = {
  description: string;
  calories: number;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
};

export type SavedMeal = {
  id: string;
  name: string;
  category: string;
  items: SavedMealItem[];
  createdAt: string;
};

function mapRow(row: { id: string; name: string; category: string; items: unknown; created_at: string }): SavedMeal {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    items: Array.isArray(row.items) ? (row.items as SavedMealItem[]) : [],
    createdAt: row.created_at,
  };
}

export async function listSavedMeals(memberId: string): Promise<SavedMeal[]> {
  const db = getDb();
  const { data, error } = await db
    .from("saved_meals")
    .select("id, name, category, items, created_at")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(`Failed to load saved meals: ${error.message}`);
  }
  return (data ?? []).map(mapRow);
}

export async function createSavedMeal(
  memberId: string,
  input: { name: string; category: string; items: SavedMealItem[] }
): Promise<SavedMeal> {
  if (!input.items.length) throw new Error("A saved meal needs at least one item.");

  const db = getDb();
  const { data, error } = await db
    .from("saved_meals")
    .insert({ member_id: memberId, name: input.name, category: input.category, items: input.items })
    .select("id, name, category, items, created_at")
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      throw new Error("Saved meals aren't set up yet — run the saved_meals migration in schema.sql first.");
    }
    throw new Error(`Failed to save meal: ${error.message}`);
  }
  return mapRow(data);
}

export async function deleteSavedMeal(
  memberId: string,
  mealId: string
): Promise<{ status: "ok" } | { status: "not_found" }> {
  const db = getDb();
  const { data, error } = await db
    .from("saved_meals")
    .delete()
    .eq("id", mealId)
    .eq("member_id", memberId)
    .select("id")
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) return { status: "not_found" };
    throw new Error(`Failed to delete saved meal: ${error.message}`);
  }
  return data ? { status: "ok" } : { status: "not_found" };
}
