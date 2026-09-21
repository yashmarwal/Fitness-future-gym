import "server-only";
import { getDb } from "@/backend/db/client";
import { sendPushToMember } from "@/backend/services/pushNotifications";

// The "you're checked in — start logging your workout" nudge: a push
// notification the moment a check-in is recorded, whether the member tapped
// Check In in the app or scanned the front-desk QR. (The popup on the
// dashboard is the in-app half of the same nudge.)
//
// On by default — it answers the member's own action rather than arriving on
// a schedule like the water/meal/streak reminders, which stay opt-in — and
// the "Workout Prompt" toggle turns it off. The push only reaches members who
// have push notifications enabled on a device. Needs `notify_workout` on
// `members` (see the migration note at the top of schema.sql); until it's
// migrated the preference reads as on, so the push still goes out.

export async function getWorkoutPromptEnabled(memberId: string): Promise<boolean> {
  const { data, error } = await getDb().from("members").select("notify_workout").eq("id", memberId).maybeSingle();
  if (error) return true; // column not migrated yet, or a transient error: fall back to the default (on)
  return data?.notify_workout !== false;
}

export async function setWorkoutPromptEnabled(memberId: string, enabled: boolean): Promise<void> {
  const { error } = await getDb().from("members").update({ notify_workout: enabled }).eq("id", memberId);
  if (error) throw new Error(`Failed to update workout prompt preference: ${error.message}`);
}

export async function sendCheckInPrompt(memberId: string, opts: { streak: number }): Promise<void> {
  if (!(await getWorkoutPromptEnabled(memberId))) return;
  await sendPushToMember(memberId, {
    title: "💪 You're checked in — start logging",
    body:
      opts.streak >= 2
        ? `${opts.streak}-day streak going. Log today's workout to keep it alive.`
        : "Log today's workout — every set counts toward your records and muscle ranks.",
    url: "/dashboard/workouts",
  });
}
