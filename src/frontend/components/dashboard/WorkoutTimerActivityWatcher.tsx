"use client";

import { useEffect } from "react";
import { useWorkoutTimerState, tickWorkoutTimer, recordWorkoutActivity, FLUSH_INTERVAL_MS } from "@/frontend/lib/workoutTimer";

const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "touchstart", "scroll"] as const;
// Only ever write to localStorage on activity at most this often — a raw
// mousemove listener fires far too fast to persist on every event.
const ACTIVITY_WRITE_THROTTLE_MS = 5_000;

// Mounted once at the dashboard layout level (not inside WorkoutTimerWidget
// itself) for the exact reason RestTimerAlarmWatcher lives at layout level:
// the widget only renders on the /dashboard home page, so its old
// self-contained activity listeners + flush/inactivity tick went dead the
// moment a member navigated to /dashboard/workouts to actually log the
// workout they'd just started timing. Real activity there was never
// recorded, so `lastActivityAt` went stale and the 10-minute inactivity
// check (still correctly implemented in workoutTimer.ts) auto-stopped a
// timer the member was genuinely, continuously using — the "auto-stops
// after 10 minutes regardless" bug. This component owns nothing visual; it
// just keeps the tick/flush/activity-detection alive across every dashboard
// page, the same way the rest-timer alarm does.
export default function WorkoutTimerActivityWatcher() {
  const state = useWorkoutTimerState();

  // Settle a timer left "running" by a closed tab right away (it auto-stops
  // once the quiet window has passed) instead of waiting for the first
  // flush tick.
  useEffect(() => {
    tickWorkoutTimer();
  }, []);

  // Persisted flush + inactivity check — runs for as long as the member is
  // anywhere in /dashboard, not just on one page.
  useEffect(() => {
    const id = setInterval(() => tickWorkoutTimer(), FLUSH_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // Activity listeners — only registered while the timer is actually
  // running, so this costs nothing the rest of the time.
  useEffect(() => {
    if (!state.running) return;

    let lastWriteAt = 0;
    function onActivity() {
      const now = Date.now();
      if (now - lastWriteAt < ACTIVITY_WRITE_THROTTLE_MS) return;
      lastWriteAt = now;
      recordWorkoutActivity(now);
    }
    for (const evt of ACTIVITY_EVENTS) window.addEventListener(evt, onActivity, { passive: true });

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") tickWorkoutTimer();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      for (const evt of ACTIVITY_EVENTS) window.removeEventListener(evt, onActivity);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [state.running]);

  return null;
}
