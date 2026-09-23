import "server-only";
import { getDb } from "@/backend/db/client";
import { isMissingColumnError } from "@/backend/db/errors";
import { sendPushToMember } from "@/backend/services/pushNotifications";
import { getIstStartOfTodayIso } from "@/frontend/lib/date";
import { mapWithConcurrency } from "@/backend/lib/concurrency";

// See backend/lib/concurrency.ts — these loops used to send one member at a
// time; with every active member opted in they'd risk this cron's timeout
// the same way the fee-reminder/birthday/broadcast loops did.
const NOTIFY_CONCURRENCY = 8;

// Opt-in personal reminders (water/meal-log/streak), toggled per-member
// from the dashboard — distinct from notifications.ts's fee/birthday
// reminders, which fire for everyone with contact info, no opt-in needed.
// Nobody gets any of these unless they explicitly turned the toggle on;
// fails open (0 sent, not an error) if the notify_* columns haven't been
// migrated onto `members` yet, same pattern as feeAbuse.ts.

async function listOptedInMemberIds(column: "notify_water" | "notify_meal_log" | "notify_streak"): Promise<string[]> {
  const db = getDb();
  const { data, error } = await db.from("members").select("id").eq("is_active", true).eq(column, true);

  if (!error) return (data ?? []).map((m) => m.id as string);
  if (isMissingColumnError(error)) return [];
  throw new Error(`Failed to load members opted into ${column}: ${error.message}`);
}

// Flat, unconditional nudge — there's no way to track actual water intake
// in this app, so this is just a recurring reminder at fixed times
// (registered 3x in vercel.json, same route, different schedules).
export async function runWaterReminderCheck(): Promise<{ sent: number }> {
  const memberIds = await listOptedInMemberIds("notify_water");

  await mapWithConcurrency(memberIds, NOTIFY_CONCURRENCY, (memberId) =>
    sendPushToMember(memberId, {
      title: "💧 Stay Hydrated",
      body: "Quick reminder to drink some water — keep the gains coming.",
      url: "/dashboard",
    }).catch(() => {})
  );

  return { sent: memberIds.length };
}

// Smart, not naggy: only sends to members who haven't logged ANY food yet
// today (IST) — someone who already logged breakfast and lunch doesn't
// need a reminder to log meals.
export async function runMealLogReminderCheck(): Promise<{ sent: number }> {
  const memberIds = await listOptedInMemberIds("notify_meal_log");
  if (memberIds.length === 0) return { sent: 0 };

  const db = getDb();
  const todayStart = getIstStartOfTodayIso();

  const results = await mapWithConcurrency(memberIds, NOTIFY_CONCURRENCY, async (memberId) => {
    const { data, error } = await db
      .from("food_logs")
      .select("id")
      .eq("member_id", memberId)
      .gte("logged_at", todayStart)
      .limit(1);
    if (error) return false;
    if (data && data.length > 0) return false; // already logged something today

    await sendPushToMember(memberId, {
      title: "🍽️ Log Today's Meals",
      body: "You haven't logged any food today — take a second to track what you've eaten.",
      url: "/dashboard/nutrition",
    }).catch(() => {});
    return true;
  });

  return { sent: results.filter(Boolean).length };
}

// Smart, not naggy: only sends to members who haven't checked in yet
// today (IST), based on real attendance data — not the separate,
// self-reported streak tracker (which is 100% client-side localStorage,
// the server has no visibility into it at all).
export async function runStreakReminderCheck(): Promise<{ sent: number }> {
  const memberIds = await listOptedInMemberIds("notify_streak");
  if (memberIds.length === 0) return { sent: 0 };

  const db = getDb();
  const todayStart = getIstStartOfTodayIso();

  const results = await mapWithConcurrency(memberIds, NOTIFY_CONCURRENCY, async (memberId) => {
    const { data, error } = await db
      .from("attendance")
      .select("id")
      .eq("member_id", memberId)
      .gte("checked_in_at", todayStart)
      .limit(1);
    if (error) return false;
    if (data && data.length > 0) return false; // already checked in today

    await sendPushToMember(memberId, {
      title: "🔥 Don't Break Your Streak",
      body: "You haven't checked in today yet — get to the floor before it closes.",
      url: "/dashboard",
    }).catch(() => {});
    return true;
  });

  return { sent: results.filter(Boolean).length };
}
