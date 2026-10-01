"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkoutLog } from "@/backend/services/workouts";
import { getIstDateString, daysBetweenIstDates } from "@/frontend/lib/date";
import { NumberStepper, WeightStepper } from "@/frontend/components/dashboard/WorkoutLogForm";
import { fetchCardFile, shareOrDownloadCard } from "@/frontend/lib/shareCard";

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

// One logged set — a plain row that turns into an inline edit form so a
// wrong input can actually be corrected instead of living in history
// forever. Editing does NOT retroactively touch Personal Records or Muscle
// Progress XP — those are permanent, accumulate-once-at-log-time totals
// (see personalRecords.ts / muscleProgress.ts), never recomputed from
// workout_logs on read, so a corrected set doesn't undo whatever PR/XP the
// original (wrong) numbers already produced.
function LogRow({ log }: { log: WorkoutLog }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [exerciseName, setExerciseName] = useState(log.exerciseName);
  const [sets, setSets] = useState(String(log.sets));
  const [reps, setReps] = useState(String(log.reps));
  const [weightKg, setWeightKg] = useState(log.weightKg != null ? String(log.weightKg) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cancel() {
    setEditing(false);
    setError(null);
    setExerciseName(log.exerciseName);
    setSets(String(log.sets));
    setReps(String(log.reps));
    setWeightKg(log.weightKg != null ? String(log.weightKg) : "");
  }

  async function handleSave() {
    const setsNum = Math.trunc(Number(sets));
    const repsNum = Math.trunc(Number(reps));
    if (!exerciseName.trim() || !sets.trim() || !reps.trim() || !Number.isFinite(setsNum) || setsNum < 1 || !Number.isFinite(repsNum) || repsNum < 1) {
      setError("Exercise, sets, and reps are required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/workouts/${log.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseName: exerciseName.trim(),
          sets: setsNum,
          reps: repsNum,
          weightKg: weightKg ? Number(weightKg) : null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (data?.status !== "ok") {
        setError(data?.message ?? "Couldn't save — try again.");
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 px-5 py-3 bg-surface-container">
        <input
          value={exerciseName}
          onChange={(e) => setExerciseName(e.target.value)}
          className="w-full rounded-lg bg-surface-container-low border border-surface-variant text-on-surface font-body text-sm px-3 py-2 outline-none focus:border-primary-container"
        />
        <div className="grid grid-cols-[1fr_1fr_1.3fr] gap-2">
          <NumberStepper label="Sets" value={sets} min={0} onChange={setSets} />
          <NumberStepper label="Reps" value={reps} min={0} onChange={setReps} />
          <WeightStepper value={weightKg} onChange={setWeightKg} />
        </div>
        {error && <p className="font-body text-xs text-error">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-xs uppercase font-bold px-4 py-2.5 rounded-lg shadow-soft disabled:opacity-60 transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={saving}
            className="font-label text-xs uppercase font-bold px-4 py-2.5 rounded-lg bg-surface-container-low text-tertiary hover:text-on-surface transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3">
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
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Edit ${log.exerciseName}`}
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-tertiary hover:text-primary-container hover:bg-surface-container-high transition-colors"
      >
        <span className="material-symbols-outlined text-base leading-none">edit</span>
      </button>
    </div>
  );
}

// The Strava-style "just finished, share it now" moment — right on
// today's own group, not buried in a separate achievements/share page a
// member would have to go find days later. Only ever rendered for a group
// that genuinely has logs (DayDrawer only exists for non-empty groups, see
// groupByDay), so the card route's own "nothing logged today" 404 can
// never actually trigger from here.
function ShareTodayButton() {
  const [busy, setBusy] = useState(false);

  async function handleShare() {
    setBusy(true);
    try {
      const file = await fetchCardFile("/api/dashboard/achievement-card?type=today", "fitness-future-today.png");
      await shareOrDownloadCard(file, "Today's Session", "Just finished a session at Fitness Future Gym 💪");
    } catch {
      // Passive failure — this is a one-tap bonus action on a page whose
      // real job is logging sets, not something worth an error banner.
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={busy}
      aria-label="Share today's workout"
      className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-primary-container hover:bg-surface-container-high transition-colors disabled:opacity-60"
    >
      <span className="material-symbols-outlined text-lg leading-none">ios_share</span>
    </button>
  );
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
  const isToday = dateKey === todayKey;

  return (
    <div className="bg-surface-container-low shadow-soft rounded-2xl border border-surface-variant/40 overflow-hidden">
      {/* A button nested inside a button is invalid HTML — ShareTodayButton
          needs its own click target separate from the drawer's own
          open/close toggle, so the toggle is only the label/chevron part,
          not the whole header row like it used to be. */}
      <div className="w-full flex items-center justify-between gap-2 pl-5 pr-3 py-3.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex-1 flex items-center justify-between gap-3 min-w-0 text-left"
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
        {isToday && <ShareTodayButton />}
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col divide-y divide-surface-variant/40 border-t border-surface-variant/40">
            {logs.map((log) => (
              <LogRow key={log.id} log={log} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const DAYS_SHOWN_COLLAPSED = 5;

// Only the most recent day starts open — everything older is one tap away
// instead of pre-expanded, which is what actually fixes "very long list"
// (grouping by day alone still shows every session's sets at once). The
// day list itself is capped to 5 for the same reason — listWorkoutLogs now
// fetches up to a month's worth of rows, which for an active lifter can be
// 20+ day groups, not just a handful.
export default function WorkoutLogHistory({ logs }: { logs: WorkoutLog[] }) {
  const todayKey = getIstDateString();
  const groups = groupByDay(logs);
  const [showAll, setShowAll] = useState(false);
  const visibleGroups = showAll ? groups : groups.slice(0, DAYS_SHOWN_COLLAPSED);
  const hiddenCount = groups.length - visibleGroups.length;

  return (
    <div className="flex flex-col gap-3">
      {visibleGroups.map((group, i) => (
        <DayDrawer key={group.dateKey} dateKey={group.dateKey} logs={group.logs} todayKey={todayKey} defaultOpen={i === 0} />
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="font-label text-xs uppercase font-bold px-4 py-3 rounded-2xl bg-surface-container-low border border-surface-variant/40 text-primary-container hover:bg-surface-container transition-colors"
        >
          View All — {hiddenCount} More Day{hiddenCount === 1 ? "" : "s"}
        </button>
      )}
    </div>
  );
}
