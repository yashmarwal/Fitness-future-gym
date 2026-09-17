"use client";

import { useEffect, useRef, useState } from "react";
import {
  useWorkoutTimerState,
  startTimer,
  stopTimer,
  tickWorkoutTimer,
  recordWorkoutActivity,
  getWeekTotalMs,
  getTodayMs,
  formatDuration,
  FLUSH_INTERVAL_MS,
} from "@/frontend/lib/workoutTimer";

const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "touchstart", "scroll"] as const;
// Only ever write to localStorage on activity at most this often — a raw
// mousemove listener fires far too fast to persist on every event.
const ACTIVITY_WRITE_THROTTLE_MS = 5_000;

// A separate stat from the rest timer (RestTimer.tsx, untouched) — this
// tracks total time spent actually working out, running in the background
// while the member is on this page until they stop it or go quiet for 10
// minutes. Local-only (see workoutTimer.ts) and mounted on the dashboard
// home page, directly above the Muscle Progress teaser, so "inactivity on
// dashboard" is tracked for exactly as long as this widget is on screen.
export default function WorkoutTimerWidget() {
  const state = useWorkoutTimerState();
  // Holds the live wall clock for the running-segment display. Starts at a
  // pure literal (0) so the first render stays pure — since the SSR/
  // pre-hydration snapshot always has running:false, the live-segment math
  // below never actually consults `now` before the first tick lands. Only
  // ever updated from inside the interval callback below, never read via a
  // fresh Date.now() call during render.
  const [now, setNow] = useState(0);
  const lastActivityWriteRef = useRef(0);

  // Live display tick — purely visual.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Persisted flush + inactivity check, independent of the display tick.
  useEffect(() => {
    const id = setInterval(() => tickWorkoutTimer(), FLUSH_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // Activity listeners — only registered while the timer is actually
  // running, so this widget costs nothing when idle.
  useEffect(() => {
    if (!state.running) return;

    function onActivity() {
      const now = Date.now();
      if (now - lastActivityWriteRef.current < ACTIVITY_WRITE_THROTTLE_MS) return;
      lastActivityWriteRef.current = now;
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

  function handleToggle() {
    if (state.running) stopTimer();
    else startTimer();
  }

  const weekTotal = getWeekTotalMs(state, now);
  const todayTotal = getTodayMs(state, now);

  return (
    <div className="bg-surface-container-low p-5 shadow-hard mb-6 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <span className="flex items-center gap-1.5 font-label text-xs uppercase tracking-widest text-primary-container">
          <span className="material-symbols-outlined text-base leading-none">timelapse</span>
          Workout Timer
        </span>
        <p className="font-display text-2xl text-on-surface leading-tight mt-1">{formatDuration(weekTotal)}</p>
        <p className="font-label text-[9px] uppercase tracking-wider text-tertiary mt-0.5">
          This week &middot; {formatDuration(todayTotal)} today
        </p>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={state.running}
        className={`shrink-0 flex items-center gap-2 font-label text-xs uppercase font-bold px-4 py-3 shadow-hard transition-colors ${
          state.running
            ? "bg-error-container/40 text-error hover:bg-error-container/60"
            : "bg-primary-container text-on-primary-container hover:bg-secondary-container"
        }`}
      >
        <span className="material-symbols-outlined text-lg leading-none">
          {state.running ? "stop" : "play_arrow"}
        </span>
        {state.running ? "Stop" : "Start"}
      </button>
    </div>
  );
}
