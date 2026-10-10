"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useWorkoutTimerState, startTimer, stopTimer, getTodayMs, formatDuration } from "@/frontend/lib/workoutTimer";

// A compact sibling to the boxier WorkoutTimerWidget (dashboard home page)
// — same shared state (workoutTimer.ts), same underlying tick/flush/
// inactivity handling (WorkoutTimerActivityWatcher, mounted once at the
// dashboard layout level), just condensed to sit right above the log form
// here. Row proportions (icon size, number size, exact button padding) are
// untouched on purpose — only the surface itself (background art + blue
// accent, matching WorkoutTimerWidget's own treatment) and text colors
// changed, no resizing and no history strip, per explicit request. This
// was previously kept pixel-for-pixel identical to RestTimerBar below it
// on this page so the two didn't read as mismatched UI kits — that's no
// longer true now that only this one has the image treatment.
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
    <div className="relative overflow-hidden shadow-soft rounded-2xl mb-4 flex flex-col gap-1.5 px-4 py-3 bg-black">
      <Image
        src="/images/dashboard-stats/workout-timer.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover pointer-events-none"
        style={{ filter: "hue-rotate(200deg) saturate(1.15)" }}
      />
      <div className="relative z-10 flex items-center gap-2.5">
        <span className="material-symbols-outlined text-xl leading-none shrink-0 text-blue-400 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">timelapse</span>
        <span className="font-display text-3xl tabular-nums leading-none shrink-0 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">{formatDuration(todayTotal)}</span>
        <span className="font-label text-[9px] uppercase tracking-widest text-white/70 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          Workout Timer
          {state.running && <span className="text-blue-400"> · Running</span>}
        </span>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => (state.running ? stopTimer() : startTimer())}
          aria-pressed={state.running}
          className={`shrink-0 flex items-center gap-1.5 font-label text-[10px] uppercase font-bold px-3 py-2 rounded-xl transition-colors ${
            state.running ? "bg-error text-on-error" : "bg-blue-600 hover:bg-blue-500 text-white"
          }`}
        >
          <span className="material-symbols-outlined text-sm leading-none">{state.running ? "stop" : "play_arrow"}</span>
          {state.running ? "Stop" : "Start"}
        </button>
      </div>
      {state.running && (
        <p className="relative z-10 font-body text-[10px] text-white/70 flex items-center gap-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          <span className="material-symbols-outlined text-xs leading-none">info</span>
          Stops automatically after 10 min of inactivity
        </p>
      )}
    </div>
  );
}
