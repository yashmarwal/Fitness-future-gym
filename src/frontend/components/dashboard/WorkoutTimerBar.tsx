"use client";

import { useEffect, useState } from "react";
import { useWorkoutTimerState, startTimer, stopTimer, getTodayMs, formatDuration } from "@/frontend/lib/workoutTimer";

// A compact sibling to the boxier WorkoutTimerWidget (dashboard home page)
// — same shared state (workoutTimer.ts), same underlying tick/flush/
// inactivity handling (WorkoutTimerActivityWatcher, mounted once at the
// dashboard layout level), just condensed to sit right above the log form
// here. Deliberately matches RestTimerBar's row pixel-for-pixel (icon size,
// number size/color, exact button padding) — an earlier version used its
// own sizing (a boxed icon, a smaller/differently-colored number, taller
// buttons) and stacking two visually different bars directly on top of each
// other on this page read as two mismatched UI kits, not one page.
export default function WorkoutTimerBar() {
  const state = useWorkoutTimerState();
  // Pure literal initial value so the first render stays SSR-safe — only
  // ever updated from inside the interval callback below.
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!state.running) return;
    const first = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [state.running]);

  const todayTotal = getTodayMs(state, now);

  return (
    <div className="shadow-hard mb-4 flex items-center gap-2.5 px-4 py-3 bg-surface-container-low">
      <span className="material-symbols-outlined text-xl leading-none shrink-0 text-primary-container">timelapse</span>
      <span className="font-display text-3xl tabular-nums leading-none shrink-0 text-primary-container">{formatDuration(todayTotal)}</span>
      <span className="font-label text-[9px] uppercase tracking-widest text-tertiary">
        Workout Timer
        {state.running && <span className="text-primary-container"> · Running</span>}
      </span>

      <div className="flex-1" />

      <button
        type="button"
        onClick={() => (state.running ? stopTimer() : startTimer())}
        aria-pressed={state.running}
        className={`shrink-0 flex items-center gap-1.5 font-label text-[10px] uppercase font-bold px-3 py-2 transition-colors ${
          state.running ? "bg-error text-on-error" : "bg-primary-container hover:bg-secondary-container text-on-primary-container"
        }`}
      >
        <span className="material-symbols-outlined text-sm leading-none">{state.running ? "stop" : "play_arrow"}</span>
        {state.running ? "Stop" : "Start"}
      </button>
    </div>
  );
}
