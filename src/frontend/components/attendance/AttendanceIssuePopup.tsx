"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { vibrateError } from "@/frontend/lib/beep";

const AUTO_DISMISS_MS = 7000;

// Shared by every attendance surface (dashboard one-tap button, the
// workout-page AttendanceLock gate, and the front-desk QR AttendanceForm) —
// ANY reason a check-in didn't go through (not found, inactive, blocked,
// cooldown, outside hours, gym closed) shows this same popup with the same
// buzz, instead of each surface quietly printing a line of text someone on
// a gym floor could easily miss. Same portal/backdrop pattern as
// StreakMilestoneCelebration.tsx, themed as an alert rather than a
// celebration.
export default function AttendanceIssuePopup({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    vibrateError();
    const id = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [onDismiss]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xl px-6"
      onClick={onDismiss}
    >
      <div className="relative w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="bg-surface-container-lowest border-2 border-error rounded-3xl shadow-soft-lg flex flex-col items-center text-center px-8 py-10 gap-4">
          <span className="w-16 h-16 rounded-2xl flex items-center justify-center bg-error/15 text-error shrink-0">
            <span className="material-symbols-outlined text-3xl leading-none">event_busy</span>
          </span>
          <p className="font-body text-base text-on-surface leading-snug">{message}</p>
          <button
            type="button"
            onClick={onDismiss}
            className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label text-sm uppercase font-bold px-6 py-3.5 rounded-xl shadow-soft transition-colors active:scale-[0.98]"
          >
            Got It
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
