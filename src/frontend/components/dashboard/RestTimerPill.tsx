"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRestTimerState, getRemainingSeconds } from "@/frontend/lib/restTimer";

// A small always-visible "your rest timer is still running" indicator for
// the dashboard home page — reads the same shared, persistent timer store
// as RestTimerBar/RestTimer (restTimer.ts), so it stays in sync regardless
// of where the countdown was actually started. Deliberately the one
// rounded/pill shape on an otherwise sharp-edged, brutalist site — the
// contrast is what reads as "live" against everything else's static hard
// corners. Hidden once the countdown finishes: RestTimerAlarmWatcher's
// full-screen popup takes over from there.
export default function RestTimerPill() {
  const state = useRestTimerState();
  // Pure literal initial value so the first render stays SSR-safe (see
  // WorkoutTimerWidget for the same reasoning) — only ever updated from
  // inside the interval callback below.
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!state.running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state.running]);

  if (!state.running) return null;

  const remaining = now === 0 ? state.duration : getRemainingSeconds(state, now);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <Link
      href="/dashboard/workouts"
      className="inline-flex items-center gap-2 rounded-full bg-primary-container text-on-primary-container pl-2.5 pr-3.5 py-1.5 shadow-hard hover:bg-secondary-container transition-colors"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-on-primary-container opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-on-primary-container" />
      </span>
      <span className="material-symbols-outlined text-sm leading-none">timer</span>
      <span className="font-display text-sm tabular-nums leading-none">
        {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
    </Link>
  );
}
