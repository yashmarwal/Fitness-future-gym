"use client";

import Link from "next/link";
import { useWorkoutTimerState } from "@/frontend/lib/workoutTimer";

export default function DashboardHeader({ fullName }: { fullName: string }) {
  // Reads the same shared, persistent timer state as WorkoutTimerWidget/Bar
  // (workoutTimer.ts) — this is purely a status readout, it doesn't tick or
  // own the timer itself.
  const { running } = useWorkoutTimerState();

  return (
    // bg-black, not bg-surface-container-lowest (#0f0e0c) — matches the
    // dashboard layout's own pure-black page background exactly, instead of
    // this header bar reading as a visibly different, slightly warmer shade
    // sitting on top of it.
    <header className="w-full bg-black border-b border-surface-variant/50 px-gutter-mobile lg:px-gutter-desktop h-16 flex items-center justify-between">
      <div className="flex flex-col leading-none">
        <span className="font-label text-[10px] uppercase tracking-widest text-primary-container">
          Welcome Back
        </span>
        <span className="font-display text-xl text-on-surface uppercase tracking-wide leading-tight">{fullName}</span>
        {/* Green/red rather than the site's usual orange accent — a
            deliberate, literal status color (go/stop) distinct from the
            brand palette, so it reads instantly without needing a legend. */}
        <span className={`flex items-center gap-1 font-label text-[9px] uppercase tracking-wider ${running ? "text-green-400" : "text-error"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${running ? "bg-green-400 animate-pulse" : "bg-error"}`} />
          {running ? "Working Out" : "Not Working Out"}
        </span>
      </div>

      {/* Settings moved out to its own route, reached from the Settings tab
          in DashboardTabBar / DashboardDesktopNav instead — see
          dashboard/settings/page.tsx for why. TV stays here since it's not
          a section of the app so much as a thing to glance at and leave —
          a plain in-app Link (no target=_blank: this opens the gym's live
          Playground board within the app, not a separate browser tab). A
          hand-built retro-TV illustration was tried here and reverted —
          back to the plain Material icon + a small "Live" pill. */}
      <Link href="/tv" aria-label="Open gym live TV display" className="flex flex-col items-center gap-1 group">
        <span className="flex items-center justify-center bg-surface-container-high group-hover:bg-surface-container-highest text-on-surface-variant group-hover:text-primary-container p-2 rounded-xl transition-colors">
          <span className="material-symbols-outlined text-base leading-none">tv</span>
        </span>
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary-container/15 border border-primary-container/30 text-primary-container animate-pulse">
          <span className="w-1 h-1 rounded-full bg-primary-container" />
          <span className="font-label text-[8px] uppercase tracking-wider leading-none">Live</span>
        </span>
      </Link>
    </header>
  );
}
