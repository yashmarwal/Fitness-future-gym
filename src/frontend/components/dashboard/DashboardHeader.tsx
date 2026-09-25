"use client";

import { useEffect, useState } from "react";
import { useWorkoutTimerState } from "@/frontend/lib/workoutTimer";
import SettingsPanel from "@/frontend/components/dashboard/SettingsPanel";

export default function DashboardHeader({
  fullName,
  membershipNumber,
  plan,
}: {
  fullName: string;
  membershipNumber: string;
  plan: string | null;
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
  // A dedicated, cheap head-count endpoint (see unread-count/route.ts) —
  // not the same fetch SettingsPanel does lazily on open (that one pulls
  // the full notification list). Checked whenever the panel is NOT open,
  // which covers both the initial mount AND every close: if the member
  // opened the notification feed inside the panel, it already marked
  // everything read server-side, so re-checking on close is what clears
  // the dot without needing a prop/callback threaded down through
  // SettingsPanel -> NotificationBar just for this.
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (settingsOpen) return;
    let cancelled = false;
    fetch("/api/dashboard/notifications/unread-count")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.status === "ok") setHasUnread(d.count > 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [settingsOpen]);

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
        aria-label={hasUnread ? "Open settings — unread notifications" : "Open settings"}
        className="relative flex items-center gap-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-primary-container font-label text-xs uppercase tracking-wider px-3 py-2 rounded-xl transition-colors"
      >
        <span className="material-symbols-outlined text-base leading-none">settings</span>
        <span className="hidden sm:inline">Settings</span>
        {/* bg-red-500, not the theme's --color-error (bg-error) — that
            token is tuned as a soft pink for legible text/icons on a dark
            surface (see AttendanceCheckInButton's error text), which reads
            as pink, not red, at this size. Same "deliberate literal color"
            call as the green/red Working Out dot above. */}
        {hasUnread && (
          <span className="absolute -top-1 -right-1 flex w-2.5 h-2.5" aria-hidden="true">
            <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-surface-container-high" />
          </span>
        )}
      </button>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        fullName={fullName}
        membershipNumber={membershipNumber}
        plan={plan}
      />
    </header>
  );
}
