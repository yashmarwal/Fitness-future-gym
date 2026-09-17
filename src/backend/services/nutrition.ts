import "server-only";
import { getDb } from "@/backend/db/client";
import { getIstStartOfTodayIso } from "@/frontend/lib/date";

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

  const { data, error } = await db
    .from("food_logs")
    .select("id, description, calories, protein_g, carbs_g, fat_g, logged_at")
    .eq("member_id", memberId)
    .gte("logged_at", getIstStartOfTodayIso())
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

export type FrequentFood = {
  description: string;
  calories: number;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  timesLogged: number;
};

const FREQUENT_FOODS_LOOKBACK_DAYS = 30;

// Powers the "Log Again" quick-add strip on the nutrition page — a one-tap
// re-log of a member's most-used entries. Groups by the exact saved
// description (which already bakes in quantity, e.g. "Banana (120g)" — see
// FoodLogForm's finalDescription comment), so two different portion sizes
// of the same food are deliberately treated as distinct quick-add entries
// rather than being averaged together, which would produce a value the
// member never actually logged. Aggregated in JS over a bounded window
// (this app's scale never approaches enough rows per member for that to
// matter) since PostgREST has no clean "group by, order by count" query.
export async function listFrequentFoods(memberId: string, limit = 6): Promise<FrequentFood[]> {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - FREQUENT_FOODS_LOOKBACK_DAYS);

  const { data, error } = await db
    .from("food_logs")
    .select("description, calories, protein_g, carbs_g, fat_g, logged_at")
    .eq("member_id", memberId)
    .gte("logged_at", cutoff.toISOString())
    .order("logged_at", { ascending: false });

  if (error) throw new Error(`Failed to load frequent foods: ${error.message}`);

  const byDescription = new Map<string, { row: (typeof data)[number]; count: number }>();
  for (const row of data ?? []) {
    const key = row.description.trim().toLowerCase();
    const existing = byDescription.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      // Rows arrive most-recent-first, so the first row seen per key is
      // already the most recent occurrence — used as the quick-add template.
      byDescription.set(key, { row, count: 1 });
    }
  }

  return Array.from(byDescription.values())
    .filter((entry) => entry.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ row, count }) => ({
      description: row.description,
      calories: row.calories,
      proteinG: row.protein_g,
      carbsG: row.carbs_g,
      fatG: row.fat_g,
      timesLogged: count,
    }));
}
