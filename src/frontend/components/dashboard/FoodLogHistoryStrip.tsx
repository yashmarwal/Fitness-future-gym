"use client";

import { useEffect, useState } from "react";
import { useFoodLogHistoryState, getPreviousFoodDays, type FoodHistoryDay } from "@/frontend/lib/foodLogHistory";
import DayDetailPopup from "@/frontend/components/dashboard/DayDetailPopup";

// The local-only "last 6 days at a glance" strip — see foodLogHistory.ts
// for why this is a separate, same-device companion stat rather than a
// server query against the real food_logs history. Same day-pill shape as
// WorkoutTimerWidget's history row (that's the established pattern for
// this kind of strip now), just in this page's own orange theme rather
// than the Workout Timer's blue.
export default function FoodLogHistoryStrip() {
  const state = useFoodLogHistoryState();
  // Pure literal initial value so the first render stays SSR-safe — the
  // server snapshot always has empty days, so "now" never actually needs
  // to be real until after hydration (same reasoning as every other local
  // timer/history widget in this app).
  const [now, setNow] = useState(0);
  // The pill a member tapped, if any — its full-date detail shows via
  // DayDetailPopup instead of trying to cram a full date onto the pill
  // itself (there's only room for a 3-letter weekday there).
  const [selectedDay, setSelectedDay] = useState<FoodHistoryDay | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(id);
  }, []);

  const previousDays = getPreviousFoodDays(state, now);

  return (
    <>
      <div className="flex gap-2 mb-6">
        {previousDays.map((day) => {
          const active = day.calories > 0;
          return (
            <button
              type="button"
              key={day.date}
              onClick={() => setSelectedDay(day)}
              className="relative overflow-hidden card-corner-glow flex-1 min-w-0 bg-surface-container-low border border-surface-variant rounded-xl px-2.5 py-2.5 flex flex-col gap-1.5 text-left hover:border-primary-container transition-colors"
            >
              <span className="font-label text-[9px] uppercase tracking-wider text-primary-container">{day.label}</span>
              <span
                className={`font-display text-sm leading-none whitespace-nowrap ${active ? "text-on-surface" : "text-tertiary"}`}
              >
                {active ? `${Math.round(day.calories)} kcal` : "0 kcal"}
              </span>
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <DayDetailPopup
          date={selectedDay.date}
          icon="restaurant"
          value={selectedDay.calories > 0 ? `${Math.round(selectedDay.calories)} kcal` : "0 kcal"}
          sublabel={
            selectedDay.calories > 0
              ? `${selectedDay.items.length} item${selectedDay.items.length === 1 ? "" : "s"} logged on this device.`
              : "Nothing logged on this device that day."
          }
          accentClass="text-primary-container"
          macros={
            selectedDay.calories > 0
              ? [
                  { label: "Protein", value: `${Math.round(selectedDay.proteinG)}g` },
                  { label: "Carbs", value: `${Math.round(selectedDay.carbsG)}g` },
                  { label: "Fat", value: `${Math.round(selectedDay.fatG)}g` },
                ]
              : undefined
          }
          items={selectedDay.items.map((item) => ({
            label: item.description,
            value: `${Math.round(item.calories)} kcal`,
          }))}
          onDismiss={() => setSelectedDay(null)}
        />
      )}
    </>
  );
}
