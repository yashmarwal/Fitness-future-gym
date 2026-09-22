"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { vibrate } from "@/frontend/lib/beep";
import { CHECKIN_SUCCESS_EVENT } from "@/frontend/components/dashboard/NotificationsCard";

const VISIBLE_MS = 1500;
// General, not tied to the member's name/streak/plan — the point is a quick
// jolt of energy the instant they're checked in, not another status report
// (the bell notification and WorkoutPromptBanner already cover that).
// Picked fresh each check-in so it doesn't go stale.
const PHRASES = ["LET'S GO", "SHOW UP.", "TIME TO WORK.", "NO EXCUSES.", "LOCKED IN.", "GO TIME.", "BEAST MODE.", "EARN IT.", "ALL IN.", "MAKE IT COUNT."];

// Mounted once at the dashboard layout level (like RestTimerAlarmWatcher
// and WorkoutTimerActivityWatcher) rather than on any one page, since a
// check-in can succeed from the dashboard's own button OR from the
// AttendanceLock card shown on the workouts/plan/timer pages — either way
// dispatches the same CHECKIN_SUCCESS_EVENT. Auto-dismisses itself; there's
// nothing to tap and nothing to configure, it's just a 1.5s beat.
export default function CheckInCelebration() {
  const [phrase, setPhrase] = useState<string | null>(null);

  useEffect(() => {
    function onCheckIn() {
      setPhrase(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
      vibrate([40, 30, 90]);
    }
    window.addEventListener(CHECKIN_SUCCESS_EVENT, onCheckIn);
    return () => window.removeEventListener(CHECKIN_SUCCESS_EVENT, onCheckIn);
  }, []);

  useEffect(() => {
    if (!phrase) return;
    const timer = setTimeout(() => setPhrase(null), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [phrase]);

  if (!phrase) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none px-8">
      <p
        key={phrase}
        className="animate-checkin-flash font-display text-5xl sm:text-6xl text-on-primary-container bg-primary-container px-6 py-4 uppercase tracking-wide text-center shadow-hard-lg"
      >
        {phrase}
      </p>
    </div>,
    document.body
  );
}
