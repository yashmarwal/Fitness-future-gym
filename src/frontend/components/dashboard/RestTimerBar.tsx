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

// A compact, always-visible sibling to the full-page Rest Timer
// (RestTimer.tsx, /dashboard/timer — untouched, same countdown/alarm
// behavior). That page's big square dial, heading, and page padding read
// as heavy pasted inline mid-page, so this condenses the same state
// machine into a single sleek bar pinned above the log-workout form
// instead. Unlike RestTimer.tsx, the countdown here is backed by
// localStorage (restTimer.ts) rather than plain component state, so
// navigating to another dashboard page and back (or a reload) resumes the
// same countdown instead of silently resetting it.
//
// This component is purely presentational — it shows the live countdown
// and the controls, but doesn't tick the underlying state, play sound, or
// detect when the timer finishes. That all lives in
// RestTimerAlarmWatcher.tsx, mounted once at the dashboard layout level so
// the alarm still fires (and the finish popup still shows) no matter which
// dashboard page the member is on when the countdown completes, not just
// this one.
export default function RestTimerBar() {
  const state = useRestTimerState();
  // Starts at a pure literal so the first render stays pure/SSR-safe (see
  // WorkoutTimerWidget for the same reasoning) — only ever updated from
  // inside the interval callback below, never read via a fresh Date.now()
  // call during render.
  const [now, setNow] = useState(0);

  // Purely a live display tick — the countdown's actual truth (and when it
  // flips to alarming) is owned by RestTimerAlarmWatcher.
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
    <div
      className={`shadow-soft rounded-2xl mb-6 flex flex-col gap-2.5 px-4 py-3 transition-colors ${
        state.alarming ? "bg-primary-container animate-pulse" : "bg-surface-container-low"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`material-symbols-outlined text-xl leading-none shrink-0 ${
            state.alarming ? "text-on-primary-container" : "text-primary-container"
          }`}
        >
          timer
        </span>
        <span
          className={`font-display text-3xl tabular-nums leading-none shrink-0 ${
            state.alarming ? "text-on-primary-container" : "text-primary-container"
          }`}
        >
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
        {state.alarming && (
          <span className="font-label text-[9px] uppercase tracking-widest text-on-primary-container hidden sm:inline">
            Time&apos;s Up!
          </span>
        )}

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setRestTimerSound(!state.soundOn)}
          aria-label={state.soundOn ? "Mute rest timer sound" : "Unmute rest timer sound"}
          className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
            state.alarming ? "text-on-primary-container/70 hover:text-on-primary-container" : "text-tertiary hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-base leading-none">
            {state.soundOn ? "volume_up" : "volume_off"}
          </span>
        </button>

        {state.alarming ? (
          <button
            type="button"
            onClick={() => resetRestTimer()}
            className="shrink-0 flex items-center gap-1.5 font-label text-[10px] uppercase font-bold px-3 py-2 rounded-xl bg-error text-on-error transition-colors"
          >
            <span className="material-symbols-outlined text-sm leading-none">notifications_off</span>
            Stop
          </button>
        ) : (
          <>
            {/* Reset sits beside the volume toggle, not after Start — so
                Start is always the last, right-aligned element in the row,
                same as WorkoutTimerBar's lone Start/Stop button one bar up.
                With Reset trailing (its old spot) the two bars' Start
                buttons landed at different x-positions when stacked. */}
            <button
              type="button"
              onClick={() => resetRestTimer()}
              aria-label="Reset rest timer"
              className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-base leading-none">restart_alt</span>
            </button>
            <button
              type="button"
              onClick={() => (state.running ? pauseRestTimer() : startRestTimer())}
              disabled={remaining <= 0}
              className="shrink-0 flex items-center gap-1.5 font-label text-[10px] uppercase font-bold px-3 py-2 rounded-xl bg-primary-container hover:bg-secondary-container text-on-primary-container disabled:opacity-60 transition-colors"
            >
              <span className="material-symbols-outlined text-sm leading-none">{state.running ? "pause" : "play_arrow"}</span>
              {state.running ? "Pause" : "Start"}
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => selectRestTimerPreset(preset)}
            className={`shrink-0 font-label text-[10px] uppercase px-2.5 py-1.5 rounded-full transition-colors ${
              state.duration === preset
                ? state.alarming
                  ? "bg-on-primary-container/25 text-on-primary-container"
                  : "bg-primary-container text-on-primary-container"
                : state.alarming
                  ? "bg-on-primary-container/10 text-on-primary-container/80 hover:bg-on-primary-container/20"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {preset}s
          </button>
        ))}
      </div>
    </div>
  );
}
