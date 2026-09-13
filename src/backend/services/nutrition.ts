import "server-only";
import { getDb } from "@/backend/db/client";

export type FoodLog = {
  id: string;
  description: string;
  calories: number;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  loggedAt: string;
};

export async function logFood(
  memberId: string,
  entry: { description: string; calories: number; proteinG?: number; carbsG?: number; fatG?: number }
): Promise<void> {
  const db = getDb();
  const { error } = await db.from("food_logs").insert({
    member_id: memberId,
    description: entry.description,
    calories: entry.calories,
    protein_g: entry.proteinG ?? null,
    carbs_g: entry.carbsG ?? null,
    fat_g: entry.fatG ?? null,
  });

  if (error) throw new Error(`Failed to log food: ${error.message}`);
}

const FOOD_LOG_RETENTION_DAYS = 30;

export async function deleteOldFoodLogs(): Promise<{ deleted: number }> {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - FOOD_LOG_RETENTION_DAYS);

  const { data, error } = await db
    .from("food_logs")
    .delete()
    .lt("logged_at", cutoff.toISOString())
    .select("id");

  if (error) throw new Error(`Failed to delete old food logs: ${error.message}`);
  return { deleted: data?.length ?? 0 };
}

export async function listTodaysFoodLogs(memberId: string): Promise<FoodLog[]> {
  const db = getDb();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await db
    .from("food_logs")
    .select("id, description, calories, protein_g, carbs_g, fat_g, logged_at")
    .eq("member_id", memberId)
    .gte("logged_at", startOfDay.toISOString())
    .order("logged_at", { ascending: false });

  if (error) throw new Error(`Failed to load food logs: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    description: row.description,
    calories: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    loggedAt: row.logged_at,
  }));
}
