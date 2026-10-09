"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useWorkoutTimerState, startTimer, stopTimer, getPreviousDays, getTodayMs, formatDuration } from "@/frontend/lib/workoutTimer";

// A separate stat from the rest timer (RestTimer.tsx, untouched) — this
// tracks time spent actually working out, until the member stops it or goes
// quiet for 10 minutes. The big number is always *today's* time and starts
// from zero every day; the last few days are shown beneath it as history (5
// days kept in total). Local-only (see workoutTimer.ts).
//
// Purely a live display + the Start/Stop button — the actual ticking,
// flushing, and inactivity detection (including the activity listeners that
// keep "inactivity" meaning genuine inactivity anywhere in the dashboard,
// not just while this widget happens to be mounted) live in
// WorkoutTimerActivityWatcher, mounted once at the dashboard layout level.
export default function WorkoutTimerWidget() {
  const state = useWorkoutTimerState();
  // Holds the live wall clock for the running-segment display. Starts at a
  // pure literal (0) so the first render stays pure — since the SSR/
  // pre-hydration snapshot always has running:false, the live-segment math
  // below never actually consults `now` before the first tick lands. Only
  // ever updated from inside the interval callback below, never read via a
  // fresh Date.now() call during render.
  const [now, setNow] = useState(0);

  // Live display tick — purely visual. The zero-delay first tick gets the
  // real clock in immediately instead of showing "0s" for a full second.
  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  function handleToggle() {
    if (state.running) stopTimer();
    else startTimer();
  }

  const todayTotal = getTodayMs(state, now);
  const previousDays = getPreviousDays(state, now);

  return (
    <div className="relative overflow-hidden bg-black p-5 shadow-soft rounded-2xl mb-6 flex items-center justify-between gap-4">
      <Image src="/images/dashboard-stats/workout-timer.jpg" alt="" fill priority sizes="100vw" className="object-cover pointer-events-none" />
      <div className="relative z-10 min-w-0">
        <span className="flex items-center gap-1.5 font-label text-xs uppercase tracking-widest text-primary-container drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          <span className="material-symbols-outlined text-base leading-none">timelapse</span>
          Workout Timer
        </span>
        <p className="font-display text-2xl text-white leading-tight mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          {formatDuration(todayTotal)}
        </p>
        <p className="font-label text-[9px] uppercase tracking-wider text-white/75 mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          Today &middot; resets at midnight
        </p>
        {state.running && (
          <p className="font-body text-[10px] text-white/75 mt-1.5 flex items-center gap-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            <span className="material-symbols-outlined text-xs leading-none">info</span>
            Stops automatically after 10 min of inactivity
          </p>
        )}
        {previousDays.length > 0 && (
          <ul className="flex flex-wrap gap-x-3 gap-y-1 mt-2" aria-label="Previous days">
            {previousDays.map((day) => (
              <li
                key={day.date}
                className="font-label text-[9px] uppercase tracking-wider text-white/60 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
              >
                {day.label} <span className="text-white/75">{formatDuration(day.ms)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={state.running}
        className={`relative z-10 shrink-0 flex items-center gap-2 font-label text-xs uppercase font-bold px-4 py-3 rounded-xl shadow-soft transition-colors ${
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
