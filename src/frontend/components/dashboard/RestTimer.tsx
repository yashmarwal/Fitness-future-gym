"use client";

import { useEffect, useState } from "react";
import {
  useRestTimerState,
  selectRestTimerPreset,
  startRestTimer,
  pauseRestTimer,
  resetRestTimer,
  setRestTimerSound,
  getRemainingSeconds,
} from "@/frontend/lib/restTimer";

const PRESETS = [30, 60, 90, 120, 180];

// Backed by the same persistent, shared store as the inline Rest Timer bar
// on the workouts page (restTimer.ts) — starting a countdown here and
// switching to another dashboard page (this one included) resumes the
// same countdown instead of resetting it, and RestTimerAlarmWatcher
// (mounted once at the dashboard layout level) is what actually detects
// completion, plays the alarm, and shows the finish popup — this
// component is purely presentational, same as RestTimerBar.tsx.
export default function RestTimer() {
  const state = useRestTimerState();
  // Starts at a pure literal so the first render stays pure/SSR-safe (see
  // WorkoutTimerWidget for the same reasoning) — only ever updated from
  // inside the interval callback below, never read via a fresh Date.now()
  // call during render.
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!state.running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state.running]);

  // now === 0 is the pure pre-mount placeholder — computing a remaining
  // time against it would subtract from a real endsAt epoch and briefly
  // flash a huge bogus number, so fall back to a sensible static value
  // until the first real tick lands (within ~1s).
  const remaining = now === 0 ? (state.running ? state.duration : state.pausedRemaining) : getRemainingSeconds(state, now);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-md mx-auto flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide">Rest Timer</h1>
        <button
          onClick={() => setRestTimerSound(!state.soundOn)}
          aria-label={state.soundOn ? "Mute sound" : "Unmute sound"}
          className="flex items-center gap-1.5 bg-surface-container-high hover:bg-surface-container-highest text-tertiary hover:text-on-surface font-label text-[10px] uppercase tracking-widest px-3 py-2 rounded-xl transition-colors"
        >
          <span className="material-symbols-outlined text-base leading-none">
            {state.soundOn ? "volume_up" : "volume_off"}
          </span>
          Sound: {state.soundOn ? "On" : "Off"}
        </button>
      </div>

      <div
        className={`w-full aspect-square max-w-xs flex flex-col items-center justify-center shadow-soft rounded-3xl mb-6 ${
          state.alarming ? "bg-primary-container animate-pulse" : "bg-surface-container-low"
        }`}
      >
        <span
          className={`font-display text-7xl tabular-nums ${
            state.alarming ? "text-on-primary-container" : "text-primary-container"
          }`}
        >
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
        {state.alarming && (
          <span className="font-label text-xs uppercase tracking-widest text-on-primary-container mt-2">
            Time&apos;s Up!
          </span>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2 w-full mb-6">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => selectRestTimerPreset(preset)}
            className={`font-label text-xs uppercase py-2.5 rounded-xl transition-colors ${
              state.duration === preset
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {preset}s
          </button>
        ))}
      </div>

      <div className="flex gap-3 w-full">
        {state.alarming ? (
          <button
            onClick={() => resetRestTimer()}
            className="flex-1 bg-error text-on-error font-label text-sm uppercase font-bold px-6 py-3 rounded-xl shadow-soft"
          >
            Stop Alarm
          </button>
        ) : (
          <>
            <button
              onClick={() => (state.running ? pauseRestTimer() : startRestTimer())}
              disabled={remaining === 0}
              className="flex-1 bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 rounded-xl shadow-soft disabled:opacity-60"
            >
              {state.running ? "Pause" : "Start"}
            </button>
            <button
              onClick={() => resetRestTimer()}
              className="flex-1 bg-surface-container-high text-on-surface font-label text-sm uppercase px-6 py-3 rounded-xl"
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}
