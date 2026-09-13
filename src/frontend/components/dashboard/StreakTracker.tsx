"use client";

import { useMemo, useState } from "react";
import {
  useStreakDates,
  toggleDate,
  todayStr,
  computeCurrentStreak,
  computeBestStreak,
  BADGES,
} from "@/frontend/lib/streak";
import { StatCard } from "@/frontend/components/dashboard/Primitives";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateStrFor(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function StreakTracker() {
  const dates = useStreakDates();
  const dateSet = useMemo(() => new Set(dates), [dates]);
  const today = todayStr();
  const currentStreak = useMemo(() => computeCurrentStreak(dates), [dates]);
  const bestStreak = useMemo(() => computeBestStreak(dates), [dates]);

  const [viewDate, setViewDate] = useState(() => new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstOfMonth.getDay();

  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  function changeMonth(delta: number) {
    setViewDate(new Date(year, month + delta, 1));
  }

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-md mx-auto">
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-2">Streak Tracker</h1>
      <p className="font-body text-sm text-tertiary mb-6">
        Tap a day to mark it done. Sundays are a free rest day — you can still check them off, but they never count
        for or against your streak. Miss any other day and the streak resets.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard value={currentStreak} label="Current Streak" tone="accent" />
        <StatCard value={bestStreak} label="Best Streak" />
      </div>

      <div className="bg-surface-container-low p-4 shadow-hard mb-6">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
            className="flex items-center justify-center w-9 h-9 bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-lg leading-none">chevron_left</span>
          </button>
          <span className="font-label text-xs uppercase tracking-widest text-on-surface">{monthLabel}</span>
          <button
            onClick={() => changeMonth(1)}
            aria-label="Next month"
            className="flex items-center justify-center w-9 h-9 bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors"
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

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`blank-${i}`} />;
            const dateStr = dateStrFor(year, month, day);
            const cellDate = new Date(year, month, day);
            const isSunday = cellDate.getDay() === 0;
            const isFuture = dateStr > today;
            const isChecked = dateSet.has(dateStr);
            const isToday = dateStr === today;

            return (
              <button
                key={dateStr}
                disabled={isFuture}
                onClick={() => toggleDate(dateStr)}
                className={`aspect-square flex items-center justify-center font-label text-xs relative
                  ${isSunday ? "text-outline/50 bg-surface-container/50" : "text-on-surface bg-surface-container"}
                  ${isChecked ? "bg-primary-container text-on-primary-container font-bold" : ""}
                  ${isToday && !isChecked ? "border border-primary-container" : ""}
                  ${isFuture ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:border hover:border-primary-container"}
                `}
              >
                {isChecked ? (
                  <span
                    className="material-symbols-outlined text-lg animate-[star-pop_0.35s_ease-out]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                ) : (
                  day
                )}
              </button>
            );
          })}
        </div>
      </div>

      <h2 className="font-display text-lg text-on-surface uppercase tracking-wide mb-3">Achievements</h2>
      <div className="grid grid-cols-3 gap-2">
        {BADGES.map((badge) => {
          const unlocked = bestStreak >= badge.days;
          return (
            <div
              key={badge.days}
              className={`flex flex-col items-center gap-1 p-3 shadow-hard text-center ${
                unlocked ? "bg-surface-container-low" : "bg-surface-container/40 opacity-50"
              }`}
            >
              <span
                className={`material-symbols-outlined text-2xl ${
                  unlocked ? "text-primary-container" : "text-outline"
                }`}
              >
                {badge.icon}
              </span>
              <span className="font-label text-[9px] uppercase tracking-wide text-on-surface">{badge.name}</span>
              <span className="font-body text-[10px] text-tertiary">{badge.days} days</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
