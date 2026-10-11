"use client";

import { createPortal } from "react-dom";

// Shared by both local history strips (FoodLogHistoryStrip, WorkoutTimerWidget)
// — tapping a day pill opens this instead of the pill's own abbreviated
// "MON / 320 kcal" having to carry the full date too. Same portal/backdrop
// pattern as AttendanceIssuePopup.tsx, themed neutrally (no error/success
// connotation) since this is just "here's the full detail," not an alert.
export default function DayDetailPopup({
  date,
  icon,
  value,
  sublabel,
  accentClass,
  macros,
  items,
  onDismiss,
}: {
  /** IST date string, e.g. "2026-10-06". */
  date: string;
  icon: string;
  value: string;
  sublabel: string;
  /** Tailwind text-color class applied to the icon badge and the value. */
  accentClass: string;
  /** Optional stat row (e.g. protein/carbs/fat) shown below the sublabel. */
  macros?: { label: string; value: string }[];
  /** Optional itemized breakdown (e.g. each food logged that day). */
  items?: { label: string; value: string }[];
  onDismiss: () => void;
}) {
  const fullLabel = new Date(`${date}T12:00:00+05:30`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xl px-6"
      onClick={onDismiss}
    >
      <div className="relative w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="bg-surface-container-lowest border-2 border-surface-variant rounded-3xl shadow-soft-lg flex flex-col items-center text-center px-8 py-10 gap-3">
          <span className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-surface-container-high shrink-0 ${accentClass}`}>
            <span className="material-symbols-outlined text-3xl leading-none">{icon}</span>
          </span>
          <p className="font-label text-xs uppercase tracking-widest text-tertiary">{fullLabel}</p>
          <p className={`font-display text-4xl leading-none ${accentClass}`}>{value}</p>
          <p className="font-body text-sm text-tertiary">{sublabel}</p>

          {macros && macros.length > 0 && (
            <div className="w-full flex gap-2">
              {macros.map((m) => (
                <div key={m.label} className="flex-1 min-w-0 bg-surface-container rounded-xl py-2 px-1">
                  <p className="font-display text-sm text-on-surface truncate">{m.value}</p>
                  <p className="font-label text-[9px] uppercase tracking-wider text-tertiary">{m.label}</p>
                </div>
              ))}
            </div>
          )}

          {items && items.length > 0 && (
            <div className="w-full flex flex-col gap-1.5 max-h-40 overflow-y-auto text-left">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-surface-container rounded-lg px-3 py-2"
                >
                  <span className="flex-1 min-w-0 font-body text-sm text-on-surface capitalize truncate">
                    {item.label.toLowerCase()}
                  </span>
                  <span className="font-body text-xs text-tertiary shrink-0">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={onDismiss}
            className="w-full mt-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-label text-sm uppercase font-bold px-6 py-3.5 rounded-xl shadow-soft transition-colors active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
