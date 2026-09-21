import "server-only";
import { getDb } from "@/backend/db/client";
import { createNotification } from "@/backend/services/memberNotifications";
import { sendPushToMember } from "@/backend/services/pushNotifications";

// The "you're checked in — start logging your workout" nudge.
//
//   In-app bell entry   every successful check-in, either path (dashboard tap
//                       or front-desk QR). Only the newest one is kept, so it
//                       never piles up next to fee reminders and broadcasts.
//   Push notification   only when the check-in came from the front-desk QR
//                       AND the member turned on the "Workout Prompt" toggle.
//                       A member who just tapped Check In inside the app is
//                       already looking at it (and gets the popup instead);
//                       the push is for the person who scanned at the desk and
//                       put their phone away.
//
// Opt-in, like the water/meal/streak reminders: never pushed to anyone who
// hasn't switched it on. Needs `notify_workout` on `members` (see the
// migration note at the top of schema.sql); without it the toggle simply
// reads as off and the push is skipped — the bell entry and popup still work.

export async function getWorkoutPromptEnabled(memberId: string): Promise<boolean> {
  const { data, error } = await getDb().from("members").select("notify_workout").eq("id", memberId).maybeSingle();
  if (error) return false; // column not migrated yet, or a transient error: treat as off
  return Boolean(data?.notify_workout);
}

export async function setWorkoutPromptEnabled(memberId: string, enabled: boolean): Promise<void> {
  const { error } = await getDb().from("members").update({ notify_workout: enabled }).eq("id", memberId);
  if (error) throw new Error(`Failed to update workout prompt preference: ${error.message}`);
}

export async function sendCheckInPrompt(
  memberId: string,
  opts: { streak: number; atFrontDesk: boolean }
): Promise<void> {
  const body =
    opts.streak >= 2
      ? `${opts.streak}-day streak going. Log today's workout to keep your records and muscle ranks moving.`
      : "Log today's workout — every set counts toward your records and muscle ranks.";

  // Keep just the latest prompt.
  const { error } = await getDb()
    .from("member_notifications")
    .delete()
    .eq("member_id", memberId)
    .eq("type", "workout_prompt");
  if (error) throw new Error(`Failed to clear the previous workout prompt: ${error.message}`);

  await createNotification({ memberId, type: "workout_prompt", title: "Checked in — start logging", body });

  if (opts.atFrontDesk && (await getWorkoutPromptEnabled(memberId))) {
    await sendPushToMember(memberId, {
      title: "💪 You're checked in",
      body: "Start logging your workout — tap to open.",
      url: "/dashboard/workouts",
    });
  }
}
