"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useWorkoutTimerState, startTimer, stopTimer, getTodayMs, getPreviousDays, formatDuration } from "@/frontend/lib/workoutTimer";

// Zero-padded HH:MM:SS for the big digital readout — distinct from the
// shared formatDuration() (which stays compact, "5m"/"13s"/"1h 23m", and is
// used elsewhere like WorkoutTimerBar) since a real stopwatch face reads
// "00:00:00", not "1h 23m".
function formatClock(ms: number): { hours: string; minutes: string; seconds: string } {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600) % 100; // caps the digit pair at 99, same as any two-digit clock face
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const seconds = totalSeconds % 60;
  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

// A separate stat from the rest timer (RestTimer.tsx, untouched) — this
// tracks time spent actually working out, until the member stops it or goes
// quiet for 10 minutes. The big number is always *today's* time and starts
// from zero every day; the 5 days before it are shown as their own pill row
// below the timer card (card size unchanged — see the layout further down).
// Local-only (see workoutTimer.ts).
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
  const clock = formatClock(todayTotal);
  const previousDays = getPreviousDays(state, now);

  return (
    <>
      <div className="relative overflow-hidden bg-black p-4 shadow-soft rounded-2xl mb-6">
        <Image
          src="/images/dashboard-stats/workout-timer.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover pointer-events-none"
          style={{ filter: "hue-rotate(200deg) saturate(1.15)" }}
        />
        <div className="relative z-10 flex flex-col gap-2">
          <span className="flex items-center gap-1.5 font-label text-xs uppercase tracking-widest text-blue-400 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            <span className="material-symbols-outlined text-base leading-none">timelapse</span>
            Workout Timer
          </span>

          <div className="flex items-stretch gap-3">
            <div className="flex-1 min-w-0 flex flex-col items-center justify-center gap-1 bg-black/40 border border-white/15 rounded-xl py-2">
              <div className="flex items-baseline gap-1 font-display text-2xl leading-none text-white tabular-nums drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                <span>{clock.hours}</span>
                <span className="text-white/40">:</span>
                <span>{clock.minutes}</span>
                <span className="text-white/40">:</span>
                <span>{clock.seconds}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-label text-[8px] uppercase tracking-wider text-white/60">Hr</span>
                <span className="font-label text-[8px] uppercase tracking-wider text-white/60">Min</span>
                <span className="font-label text-[8px] uppercase tracking-wider text-white/60">Sec</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggle}
              aria-pressed={state.running}
              className={`flex-1 flex items-center justify-center gap-2 font-label text-sm uppercase font-bold rounded-xl shadow-soft transition-colors ${
                state.running
                  ? "bg-error-container/40 text-error hover:bg-error-container/60"
                  : "bg-blue-600 text-white hover:bg-blue-500"
              }`}
            >
              <span className="material-symbols-outlined text-xl leading-none">
                {state.running ? "stop" : "play_arrow"}
              </span>
              {state.running ? "Stop" : "Start"}
            </button>
          </div>

          <p className="font-label text-[9px] uppercase tracking-wider text-white/60 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            Today &middot; resets at midnight
          </p>

          {state.running && (
            <p className="font-body text-[9px] text-white/75 -mt-1 flex items-center gap-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
              <span className="material-symbols-outlined text-xs leading-none">info</span>
              Stops automatically after 10 min of inactivity
            </p>
          )}
        </div>
      </div>

      {/* The 5-day history strip — its own row of pills, deliberately
          outside the timer card above rather than inside it, so adding
          history back never changes that card's own size. Oldest-first
          (left-to-right reads as the week unfolding toward today). A day
          with ms === 0 is a genuine rest day, shown as "0m" rather than
          hidden or relabeled — see getPreviousDays. No bar icon: at this
          pill width a real duration ("1h 12m") needs the full row to
          itself, an icon alongside it was forcing the number to truncate.
          Rest days just read dimmer (text-white/40) instead. */}
      <div className="flex gap-2 mb-6">
        {previousDays.map((day) => {
          const active = day.ms > 0;
          return (
            <div
              key={day.date}
              className="relative overflow-hidden card-corner-glow flex-1 min-w-0 bg-black border border-white/10 rounded-xl px-2.5 py-2.5 flex flex-col gap-1.5"
            >
              <span className="font-label text-[9px] uppercase tracking-wider text-blue-400">{day.label}</span>
              <span className={`font-display text-sm leading-none whitespace-nowrap ${active ? "text-white" : "text-white/40"}`}>
                {active ? formatDuration(day.ms) : "0m"}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
