"use client";

import { useState } from "react";
import type { WorkoutLog } from "@/backend/services/workouts";
import { getIstDateString, daysBetweenIstDates } from "@/frontend/lib/date";

// Groups logs (already most-recent-first from listWorkoutLogs) by IST
// calendar day — moved here from workouts/page.tsx along with the rest of
// the history rendering, since a drawer needs client-side open/closed
// state a Server Component can't hold.
function groupByDay(logs: WorkoutLog[]): { dateKey: string; logs: WorkoutLog[] }[] {
  const groups: { dateKey: string; logs: WorkoutLog[] }[] = [];
  for (const log of logs) {
    const key = getIstDateString(new Date(log.loggedAt));
    const last = groups[groups.length - 1];
    if (last && last.dateKey === key) last.logs.push(log);
    else groups.push({ dateKey: key, logs: [log] });
  }
  return groups;
}

function dayLabel(dateKey: string, todayKey: string): string {
  const diff = daysBetweenIstDates(dateKey, todayKey);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return new Date(`${dateKey}T00:00:00+05:30`).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
  });
}

// One collapsible day — same smooth height animation (grid-template-rows
// 0fr/1fr on an inner min-h-0 overflow-hidden wrapper) already used by
// DashboardSnapshot.tsx's panel, so this reads as the same interaction
// pattern rather than a new one-off.
function DayDrawer({
  dateKey,
  logs,
  todayKey,
  defaultOpen,
}: {
  dateKey: string;
  logs: WorkoutLog[];
  todayKey: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-surface-container-low shadow-soft rounded-2xl border border-surface-variant/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left"
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <span className="font-label text-xs uppercase tracking-widest text-primary-container shrink-0">
            {dayLabel(dateKey, todayKey)}
          </span>
          <span className="font-label text-[9px] uppercase tracking-wider text-tertiary truncate">
            {logs.length} {logs.length === 1 ? "exercise" : "exercises"}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`material-symbols-outlined text-lg leading-none text-tertiary shrink-0 transition-transform duration-300 motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
        >
          expand_more
        </span>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col divide-y divide-surface-variant/40 border-t border-surface-variant/40">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 px-5 py-3">
                <span className="material-symbols-outlined text-lg text-primary-container leading-none shrink-0">
                  fitness_center
                </span>
                <p className="flex-1 min-w-0 font-label text-sm uppercase tracking-wide text-on-surface truncate">
                  {log.exerciseName}
                </p>
                <p className="font-display text-lg text-primary-container tabular-nums shrink-0">
                  {log.sets}×{log.reps}
                  {log.weightKg ? ` @ ${log.weightKg}kg` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Only the most recent day starts open — everything older is one tap away
// instead of pre-expanded, which is what actually fixes "very long list"
// (grouping by day alone still shows every session's sets at once).
export default function WorkoutLogHistory({ logs }: { logs: WorkoutLog[] }) {
  const todayKey = getIstDateString();
  const groups = groupByDay(logs);

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group, i) => (
        <DayDrawer key={group.dateKey} dateKey={group.dateKey} logs={group.logs} todayKey={todayKey} defaultOpen={i === 0} />
      ))}
    </div>
  );
}
