import "server-only";
import { cache } from "react";
import { getDb } from "@/backend/db/client";
import { isMissingColumnError } from "@/backend/db/errors";

export type MemberProfile = {
  id: string;
  membershipNumber: string;
  fullName: string;
  phone: string | null;
  plan: string | null;
  feeAmount: number | null;
  feeDueDate: string | null;
  joinedAt: string;
  isActive: boolean;
  isBlocked: boolean;
  notifyWater: boolean;
  notifyMealLog: boolean;
  notifyStreak: boolean;
};

const BASE_COLUMNS = "id, membership_number, full_name, phone, plan, fee_amount, fee_due_date, joined_at, is_active, is_frozen";
const NOTIFY_COLUMNS = "notify_water, notify_meal_log, notify_streak";

function mapMemberRow(data: Record<string, unknown>): MemberProfile {
  return {
    id: data.id as string,
    membershipNumber: data.membership_number as string,
    fullName: data.full_name as string,
    phone: data.phone as string | null,
    plan: data.plan as string | null,
    feeAmount: data.fee_amount as number | null,
    feeDueDate: data.fee_due_date as string | null,
    joinedAt: data.joined_at as string,
    isActive: data.is_active as boolean,
    isBlocked: data.is_frozen as boolean,
    notifyWater: (data.notify_water as boolean | undefined) ?? false,
    notifyMealLog: (data.notify_meal_log as boolean | undefined) ?? false,
    notifyStreak: (data.notify_streak as boolean | undefined) ?? false,
  };
}

// Wrapped in React's cache() so the layout and a page rendering under it
// (both calling this with the same memberId in one request) share a single
// Supabase round-trip instead of each firing its own — this was previously
// duplicated on every dashboard page load (layout + page.tsx both called
// it), doubling that query for no reason.
//
// getMemberById is core infrastructure — nearly every dashboard route calls
// it, directly or via the layout — so unlike other migration-gated
// features this session, a missing notify_* column here can't just log and
// move on: it has to fall back to a query without those columns (defaults
// to false) rather than throw, or the entire dashboard 500s for every
// member until the migration is run.
export const getMemberById = cache(async function getMemberById(memberId: string): Promise<MemberProfile | null> {
  const db = getDb();
  const { data, error } = await db
    .from("members")
    .select(`${BASE_COLUMNS}, ${NOTIFY_COLUMNS}`)
    .eq("id", memberId)
    .maybeSingle();

  if (!error) return data ? mapMemberRow(data) : null;
  if (!isMissingColumnError(error)) throw new Error(`Failed to load member: ${error.message}`);

  const { data: fallbackData, error: fallbackError } = await db
    .from("members")
    .select(BASE_COLUMNS)
    .eq("id", memberId)
    .maybeSingle();
  if (fallbackError) throw new Error(`Failed to load member: ${fallbackError.message}`);
  return fallbackData ? mapMemberRow(fallbackData) : null;
});

export async function updateNotificationPrefs(
  memberId: string,
  prefs: { water?: boolean; mealLog?: boolean; streak?: boolean }
): Promise<void> {
  const db = getDb();
  const update: Record<string, boolean> = {};
  if (prefs.water !== undefined) update.notify_water = prefs.water;
  if (prefs.mealLog !== undefined) update.notify_meal_log = prefs.mealLog;
  if (prefs.streak !== undefined) update.notify_streak = prefs.streak;
  if (Object.keys(update).length === 0) return;

  const { error } = await db.from("members").update(update).eq("id", memberId);
  if (error) throw new Error(`Failed to update notification preferences: ${error.message}`);
}
