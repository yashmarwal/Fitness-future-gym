"use client";

import { useMemo, useState } from "react";
import type { DayAttendanceSummary } from "@/backend/services/admin/attendanceAdmin";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateStrFor(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Approximate buckets for a single-location gym's daily total (morning +
// evening + other combined) — not derived from real distribution data, just
// reasonable-looking bands so busier days read as visually "hotter" than
// quiet ones. Adjust these thresholds if they don't match how this gym's
// day-to-day numbers actually spread once there's real data to look at.
function heatLevel(total: number): 0 | 1 | 2 | 3 {
  if (total === 0) return 0;
  if (total <= 10) return 1;
  if (total <= 25) return 2;
  return 3;
}

const HEAT_CLASSES: Record<0 | 1 | 2 | 3, string> = {
  0: "bg-surface-container text-on-surface",
  1: "bg-primary-container/25 text-on-surface font-semibold",
  2: "bg-primary-container/60 text-on-primary-container font-bold",
  3: "bg-primary-container text-on-primary-container font-bold",
};

// Gym-wide (every member combined), distinct from MemberAttendanceCalendar
// which is scoped to one member picked from a search box. All-data fetched
// once server-side (getDailyAttendanceSummary, already grouped by day) and
// navigated month-by-month entirely client-side from there — same pattern
// as MemberAttendanceCalendar, just never needing a per-member re-fetch.
export default function GymAttendanceCalendar({ summary }: { summary: DayAttendanceSummary[] }) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, DayAttendanceSummary>();
    for (const s of summary) map.set(s.date, s);
    return map;
  }, [summary]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstOfMonth.getDay();

  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = viewDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  // Totals for the currently viewed month only — this is the pill up top;
  // it changes as you page between months, same as the calendar grid below it.
  const monthTotals = useMemo(() => {
    let morning = 0;
    let evening = 0;
    let other = 0;
    for (const day of cells) {
      if (day === null) continue;
      const entry = byDay.get(dateStrFor(year, month, day));
      if (!entry) continue;
      morning += entry.morning;
      evening += entry.evening;
      other += entry.other;
    }
    return { morning, evening, other, total: morning + evening + other };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byDay, year, month, daysInMonth, startOffset]);

  function changeMonth(delta: number) {
    setViewDate(new Date(year, month + delta, 1));
    setSelectedDay(null);
  }

  const selected = selectedDay ? byDay.get(selectedDay) : undefined;

  return (
    <div className="flex flex-col gap-4">
      {/* The "sleek pill" summary — month totals at a glance, before ever
          having to read the grid below it. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-2 bg-surface-container-low pl-4 pr-5 py-2.5 rounded-full shadow-soft border-2 border-surface-variant">
          <span className="material-symbols-outlined text-lg leading-none text-primary-container">calendar_month</span>
          <span className="font-label text-xs uppercase tracking-wide text-on-surface">
            {monthTotals.total} check-in{monthTotals.total === 1 ? "" : "s"} this month
          </span>
        </span>
        <span className="flex items-center gap-1.5 bg-surface-container-low px-4 py-2.5 rounded-full shadow-soft border-2 border-surface-variant">
          <span className="material-symbols-outlined text-base leading-none text-primary-container">wb_twilight</span>
          <span className="font-label text-xs uppercase tracking-wide text-tertiary">
            Morning <span className="text-on-surface font-bold">{monthTotals.morning}</span>
          </span>
        </span>
        <span className="flex items-center gap-1.5 bg-surface-container-low px-4 py-2.5 rounded-full shadow-soft border-2 border-surface-variant">
          <span className="material-symbols-outlined text-base leading-none text-primary-container">bedtime</span>
          <span className="font-label text-xs uppercase tracking-wide text-tertiary">
            Evening <span className="text-on-surface font-bold">{monthTotals.evening}</span>
          </span>
        </span>
      </div>

      <div className="bg-surface-container-low p-4 rounded-2xl shadow-soft max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-lg leading-none">chevron_left</span>
          </button>
          <span className="font-label text-xs uppercase tracking-widest text-on-surface">{monthLabel}</span>
          <button
            onClick={() => changeMonth(1)}
            aria-label="Next month"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-lg leading-none">chevron_right</span>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label} className="font-label text-[9px] uppercase text-outline text-center">
              {label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((day, i) => {
            if (day === null) return <div key={`blank-${i}`} />;
            const dateStr = dateStrFor(year, month, day);
            const entry = byDay.get(dateStr);
            const total = entry?.total ?? 0;
            const isSelected = selectedDay === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDay(total > 0 ? (isSelected ? null : dateStr) : null)}
                disabled={total === 0}
                aria-label={total > 0 ? `${total} check-ins on ${dateStr}` : undefined}
                className={`aspect-square rounded-full flex items-center justify-center font-label text-xs transition-colors
                  ${HEAT_CLASSES[heatLevel(total)]}
                  ${total > 0 ? "cursor-pointer" : "cursor-default"}
                  ${isSelected ? "ring-2 ring-offset-2 ring-offset-surface-container-low ring-on-surface" : ""}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>

        {selectedDay && selected && (
          <div className="mt-4 pt-3 border-t border-surface-variant/40 flex flex-col gap-1.5">
            <p className="font-label text-[10px] uppercase tracking-widest text-tertiary mb-1">
              {(() => {
                // From the y/m/d parts, not `new Date(selectedDay)` — that
                // string-form parse is UTC, which can land on the wrong
                // calendar day for timezones behind UTC.
                const [y, m, d] = selectedDay.split("-").map(Number);
                return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
              })()}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="font-body text-sm text-on-surface">
                <span className="text-primary-container font-bold">{selected.morning}</span> morning
              </span>
              <span className="font-body text-sm text-on-surface">
                <span className="text-primary-container font-bold">{selected.evening}</span> evening
              </span>
              {selected.other > 0 && (
                <span className="font-body text-sm text-on-surface">
                  <span className="text-primary-container font-bold">{selected.other}</span> other
                </span>
              )}
              <span className="font-body text-sm text-tertiary">· {selected.total} total</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
