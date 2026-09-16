import "server-only";
import { cache } from "react";
import { getDb } from "@/backend/db/client";
import { isMissingColumnError } from "@/backend/db/errors";
import { getIstDateString, daysBetweenIstDates } from "@/frontend/lib/date";

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
  currentStreakDays: number;
  longestStreakDays: number;
};

const BASE_COLUMNS =
  "id, membership_number, full_name, phone, plan, fee_amount, fee_due_date, joined_at, is_active, is_frozen, last_checked_in_at";
const NOTIFY_COLUMNS = "notify_water, notify_meal_log, notify_streak";
const STREAK_COLUMNS = "current_streak_days, longest_streak_days";

// The stored current_streak_days is only ever WRITTEN at check-in time
// (attendance.ts), so a member who simply stops coming — without checking
// in again — would otherwise keep showing their old, stale streak number
// forever, only correcting itself the next time they happen to check in.
// This computes the truthful value on every READ instead: if more than a
// day has passed since their last real check-in with no new one, the
// streak reads as broken (0) immediately, without needing a write.
function effectiveCurrentStreak(storedStreak: number, lastCheckedInAt: string | null): number {
  if (!lastCheckedInAt || storedStreak === 0) return storedStreak;
  const today = getIstDateString();
  const lastDay = getIstDateString(new Date(lastCheckedInAt));
  const gap = daysBetweenIstDates(lastDay, today);
  // gap 0 = checked in today, gap 1 = checked in yesterday (streak still
  // "alive," today just hasn't happened yet) — anything more is a missed day.
  return gap >= 2 ? 0 : storedStreak;
}

function mapMemberRow(data: Record<string, unknown>): MemberProfile {
  const lastCheckedInAt = (data.last_checked_in_at as string | null | undefined) ?? null;
  const storedStreak = (data.current_streak_days as number | undefined) ?? 0;

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
    currentStreakDays: effectiveCurrentStreak(storedStreak, lastCheckedInAt),
    longestStreakDays: (data.longest_streak_days as number | undefined) ?? 0,
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
// features this session, a missing notify_*/streak column here can't just
// log and move on: it has to fall back to a query without those columns
// (defaulting them) rather than throw, or the entire dashboard 500s for
// every member until the migration is run. Tries progressively fewer
// columns (full → base+notify → base only) so it degrades correctly
// regardless of which of the two migrations have or haven't landed yet.
export const getMemberById = cache(async function getMemberById(memberId: string): Promise<MemberProfile | null> {
  const db = getDb();

  const full = await db
    .from("members")
    .select(`${BASE_COLUMNS}, ${NOTIFY_COLUMNS}, ${STREAK_COLUMNS}`)
    .eq("id", memberId)
    .maybeSingle();
  if (!full.error) return full.data ? mapMemberRow(full.data) : null;
  if (!isMissingColumnError(full.error)) throw new Error(`Failed to load member: ${full.error.message}`);

  const withNotify = await db.from("members").select(`${BASE_COLUMNS}, ${NOTIFY_COLUMNS}`).eq("id", memberId).maybeSingle();
  if (!withNotify.error) return withNotify.data ? mapMemberRow(withNotify.data) : null;
  if (!isMissingColumnError(withNotify.error)) throw new Error(`Failed to load member: ${withNotify.error.message}`);

  const baseOnly = await db.from("members").select(BASE_COLUMNS).eq("id", memberId).maybeSingle();
  if (baseOnly.error) throw new Error(`Failed to load member: ${baseOnly.error.message}`);
  return baseOnly.data ? mapMemberRow(baseOnly.data) : null;
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
