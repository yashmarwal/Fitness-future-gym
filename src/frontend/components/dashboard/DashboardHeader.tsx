"use client";

import { useState } from "react";
import type { MemberNotification } from "@/backend/services/memberNotifications";
import { useWorkoutTimerState } from "@/frontend/lib/workoutTimer";
import SettingsPanel from "@/frontend/components/dashboard/SettingsPanel";

type Prefs = { water: boolean; mealLog: boolean; streak: boolean; workout: boolean };

export default function DashboardHeader({
  fullName,
  membershipNumber,
  plan,
  initialPrefs,
  initialNotifications,
}: {
  fullName: string;
  membershipNumber: string;
  plan: string | null;
  initialPrefs: Prefs;
  initialNotifications: MemberNotification[];
}) {
  // Reads the same shared, persistent timer state as WorkoutTimerWidget/Bar
  // (workoutTimer.ts) — this is purely a status readout, it doesn't tick or
  // own the timer itself.
  const { running } = useWorkoutTimerState();
  // Notifications, Membership Card and Sign Out used to be scattered (a
  // lone Sign Out button here, a Notifications card only on the dashboard
  // home page) — they now all live in one settings sheet reachable from
  // every dashboard route, see SettingsPanel.tsx.
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="w-full bg-surface-container-lowest border-b border-surface-variant/50 px-gutter-mobile lg:px-gutter-desktop h-16 flex items-center justify-between">
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
      <button
        onClick={() => setSettingsOpen(true)}
        aria-label="Open settings"
        className="flex items-center gap-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-primary-container font-label text-xs uppercase tracking-wider px-3 py-2 rounded-xl transition-colors"
      >
        <span className="material-symbols-outlined text-base leading-none">settings</span>
        <span className="hidden sm:inline">Settings</span>
      </button>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        fullName={fullName}
        membershipNumber={membershipNumber}
        plan={plan}
        initialPrefs={initialPrefs}
        initialNotifications={initialNotifications}
      />
    </header>
  );
}
