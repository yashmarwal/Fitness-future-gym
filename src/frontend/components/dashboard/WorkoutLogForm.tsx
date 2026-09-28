"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkoutLog } from "@/backend/services/workouts";
import type { TodaysWorkout, WorkoutPlanExercise } from "@/backend/services/workoutPlans";
import type { PrCheckResult } from "@/backend/services/personalRecords";
import RestTimerBar from "@/frontend/components/dashboard/RestTimerBar";
import PrCelebration from "@/frontend/components/dashboard/PrCelebration";
import ExerciseSearchField from "@/frontend/components/dashboard/ExerciseSearchField";

function firstNumber(text: string): number | null {
  const match = text.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function normalizeExerciseName(name: string): string {
  return name.trim().toLowerCase();
}

type LastEntry = { exerciseName: string; sets: number; reps: number; weightKg: number | null };

// A light, conservative progressive-overload nudge — single-variable, never
// both at once, and never touching sets: a weighted exercise suggests +2.5kg
// (the smallest standard plate jump, matching WeightStepper's own +/-
// increment) at the same reps; a bodyweight exercise (no weight logged)
// suggests +1 rep instead, since there's nothing to add weight to. This is
// deliberately NOT a prescriptive program (no target rep ranges, no
// deload logic) — just "you did this before, here's a small next step,"
// offered as a plain optional choice next to (not instead of) an exact repeat.
function progressiveSuggestion(entry: LastEntry): { sets: number; reps: number; weightKg: number | null } {
  if (entry.weightKg != null && entry.weightKg > 0) {
    return { sets: entry.sets, reps: entry.reps, weightKg: Math.round((entry.weightKg + 2.5) * 2) / 2 };
  }
  return { sets: entry.sets, reps: entry.reps + 1, weightKg: null };
}

export default function WorkoutLogForm({
  logs,
  todaysPlan,
}: {
  logs: WorkoutLog[];
  todaysPlan: TodaysWorkout | null;
}) {
  const router = useRouter();
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [weightKg, setWeightKg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [suggestion, setSuggestion] = useState<LastEntry | null>(null);
  const [prCelebration, setPrCelebration] = useState<PrCheckResult | null>(null);

  // Logs already arrive most-recent-first (listWorkoutLogs), so the last
  // logged set overall is simply the first row, and the first occurrence
  // per exercise name is that exercise's most recent set — no extra query
  // needed for either "Repeat Last Set" or the per-exercise suggestions.
  const lastLog = logs[0] ?? null;
  const lastByExercise = useMemo(() => {
    const map = new Map<string, LastEntry>();
    for (const log of logs) {
      const key = normalizeExerciseName(log.exerciseName);
      if (!map.has(key)) {
        map.set(key, { exerciseName: log.exerciseName, sets: log.sets, reps: log.reps, weightKg: log.weightKg });
      }
    }
    return map;
  }, [logs]);
  // Map preserves insertion order, so this is one entry per exercise, most
  // recently logged first — what the search field offers before anything is typed.
  const recentExercises = useMemo(() => Array.from(lastByExercise.values()), [lastByExercise]);

  function applyEntry(entry: LastEntry) {
    setExerciseName(entry.exerciseName);
    setSets(String(entry.sets));
    setReps(String(entry.reps));
    setWeightKg(entry.weightKg != null ? String(entry.weightKg) : "");
    setSuggestion(null);
  }

  function handlePickPlanExercise(ex: WorkoutPlanExercise) {
    setExerciseName(ex.name);
    setSets(String(ex.sets));
    const parsedReps = firstNumber(ex.reps);
    if (parsedReps != null) setReps(String(parsedReps));
    setWeightKg("");
    setSuggestion(null);
  }

  function handleExerciseNameBlur() {
    const key = normalizeExerciseName(exerciseName);
    setSuggestion(key ? (lastByExercise.get(key) ?? null) : null);
  }

  function handlePickExerciseMatch(name: string) {
    setExerciseName(name);
    setSuggestion(lastByExercise.get(normalizeExerciseName(name)) ?? null);
  }

  function handleUseSuggestion() {
    if (!suggestion) return;
    setSets(String(suggestion.sets));
    setReps(String(suggestion.reps));
    setWeightKg(suggestion.weightKg != null ? String(suggestion.weightKg) : "");
    setSuggestion(null);
  }

  function handleUseProgressive() {
    if (!suggestion) return;
    const next = progressiveSuggestion(suggestion);
    setSets(String(next.sets));
    setReps(String(next.reps));
    setWeightKg(next.weightKg != null ? String(next.weightKg) : "");
    setSuggestion(null);
  }

  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Sets/Reps are free-typed strings now (NumberStepper, matching
    // WeightStepper) — they can be empty or 0 mid-edit, so this is the one
    // place that actually enforces "a real set has at least 1 of each."
    const setsNum = Math.trunc(Number(sets));
    const repsNum = Math.trunc(Number(reps));
    if (!exerciseName.trim() || !sets.trim() || !reps.trim() || !Number.isFinite(setsNum) || setsNum < 1 || !Number.isFinite(repsNum) || repsNum < 1) {
      setSubmitError("Exercise, sets, and reps are required.");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseName, sets: setsNum, reps: repsNum, weightKg: weightKg || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (data?.status !== "ok") {
        setSubmitError(data?.message ?? "Couldn't log that set — try again.");
        return;
      }
      // Only a genuine improvement over a past attempt gets the big
      // celebration — a first-ever log of an exercise has nothing to
      // compare against yet, so checkAndRecordPr still records it as a
      // baseline silently, without interrupting the flow.
      if (data?.pr?.isPr && !data.pr.isFirstTime) {
        setPrCelebration(data.pr as PrCheckResult);
      }
      setExerciseName("");
      setWeightKg("");
      setSuggestion(null);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 mb-6">
      {prCelebration && <PrCelebration pr={prCelebration} onDismiss={() => setPrCelebration(null)} />}

      <RestTimerBar />

      {todaysPlan && (
        <div className="bg-surface-container-low p-4 shadow-soft rounded-2xl flex flex-col gap-2">
          <span className="flex items-center gap-1.5 font-label text-xs uppercase tracking-widest text-primary-container">
            <span className="material-symbols-outlined text-base leading-none">event_note</span>
            Today&apos;s Plan — {todaysPlan.day}
            {todaysPlan.focus ? ` (${todaysPlan.focus})` : ""}
          </span>
          <p className="font-body text-xs text-tertiary -mt-1">Tap an exercise to fill in the form below.</p>
          <div className="flex flex-wrap gap-2">
            {todaysPlan.exercises.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handlePickPlanExercise(ex)}
                className="font-body text-xs px-3 py-2 rounded-xl bg-surface-container border border-surface-variant hover:border-primary-container text-on-surface transition-colors"
              >
                {ex.name} <span className="text-tertiary">— {ex.sets}×{ex.reps}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {lastLog && (
        <button
          type="button"
          onClick={() => applyEntry(lastLog)}
          className="flex items-center gap-2 font-label text-xs uppercase font-bold px-4 py-3 rounded-xl bg-surface-container-low border border-primary-container/50 text-primary-container hover:bg-surface-container transition-colors w-fit"
        >
          <span className="material-symbols-outlined text-base leading-none">repeat</span>
          Repeat Last Set — {lastLog.exerciseName} {lastLog.sets}×{lastLog.reps}
          {lastLog.weightKg ? ` @ ${lastLog.weightKg}kg` : ""}
        </button>
      )}

      <form onSubmit={handleSubmit} className="bg-surface-container-low p-5 shadow-soft rounded-2xl flex flex-col gap-3">
        <span className="flex items-center gap-1.5 font-label text-xs uppercase tracking-widest text-primary-container">
          <span className="material-symbols-outlined text-base leading-none">fitness_center</span>
          Log A Set
        </span>

        <ExerciseSearchField
          value={exerciseName}
          onChange={(value) => {
            setExerciseName(value);
            setSuggestion(null);
          }}
          onPick={handlePickExerciseMatch}
          onPickRecent={applyEntry}
          onBlur={handleExerciseNameBlur}
          history={recentExercises}
          required
        />

        {suggestion && (
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={handleUseSuggestion}
              className="flex items-center justify-between gap-2 font-body text-xs px-3 py-2.5 rounded-xl bg-surface-container border border-primary-container/40 text-on-surface hover:border-primary-container transition-colors text-left"
            >
              <span>
                Last time:{" "}
                <span className="text-primary-container font-semibold">
                  {suggestion.weightKg ? `${suggestion.weightKg}kg × ` : ""}
                  {suggestion.reps} reps
                </span>
              </span>
              <span className="font-label text-[9px] uppercase text-primary-container shrink-0">Use these</span>
            </button>
            {/* A small, optional next step beyond an exact repeat — never
                required, never both weight and reps at once. See
                progressiveSuggestion. */}
            <button
              type="button"
              onClick={handleUseProgressive}
              className="flex items-center justify-between gap-2 font-body text-xs px-3 py-2.5 rounded-xl bg-surface-container border border-dashed border-primary-container/30 text-on-surface hover:border-primary-container transition-colors text-left"
            >
              <span>
                Progressive:{" "}
                <span className="text-primary-container font-semibold">
                  {(() => {
                    const next = progressiveSuggestion(suggestion);
                    return next.weightKg != null ? `${next.weightKg}kg × ${next.reps} reps` : `${next.sets}×${next.reps} (+1 rep)`;
                  })()}
                </span>
              </span>
              <span className="font-label text-[9px] uppercase text-primary-container shrink-0">Try This</span>
            </button>
          </div>
        )}

        {/* Weight gets noticeably more width than Sets/Reps (1.3fr vs 1fr) —
            a 3-digit weight (100kg+, common on leg press/machines) was
            getting visually clipped behind the flanking +/- buttons in an
            equal 3-column split, tight enough on mobile to look like the
            digits vanished rather than just being close to the edge. */}
        <div className="grid grid-cols-[1fr_1fr_1.3fr] gap-2">
          <NumberStepper label="Sets" value={sets} min={0} onChange={setSets} />
          <NumberStepper label="Reps" value={reps} min={0} onChange={setReps} />
          <WeightStepper value={weightKg} onChange={setWeightKg} />
        </div>

        {submitError && <p className="font-body text-xs text-error">{submitError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 rounded-xl shadow-soft disabled:opacity-60 transition-colors"
        >
          {submitting ? "Saving..." : "Log Set"}
        </button>
      </form>
    </div>
  );
}

// Exported for reuse by WorkoutLogHistory.tsx's inline edit row, so both
// the log form and the edit-a-past-set flow share one implementation.
//
// String state, not number — the same shape as WeightStepper below, on
// purpose. The old version held `value` as a live-clamped number and reset
// the field to a real digit ("1", the min) the instant it was cleared —
// which meant the next keystroke landed AFTER that leftover digit instead
// of replacing it: typing "25" over a snapped-back "1" produced "125". A
// plain string with no onChange clamping never has this problem: clearing
// the field really empties it (nothing to type "after"), and 0 only ever
// shows as a greyed `placeholder`, never a real character sitting in the
// field. min still governs the +/- buttons (a deliberate, discrete action,
// not free typing) and 0/empty is still rejected at submit time — this only
// changes what's allowed to pass through while typing, never what gets saved.
export function NumberStepper({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  onChange: (v: string) => void;
}) {
  function step(delta: number) {
    onChange(String(Math.max(min, Math.trunc(Number(value) || 0) + delta)));
  }
  return (
    <label className="flex flex-col gap-1">
      <span className="font-label text-[9px] uppercase tracking-wider text-outline">{label}</span>
      <div className="flex items-stretch rounded-xl overflow-hidden border border-surface-variant">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label={`Decrease ${label}`}
          className="w-8 shrink-0 flex items-center justify-center bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-base leading-none">remove</span>
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="w-full min-w-0 bg-surface-container text-on-surface font-body text-sm tabular-nums text-center px-0.5 py-3 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => step(1)}
          aria-label={`Increase ${label}`}
          className="w-8 shrink-0 flex items-center justify-center bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-base leading-none">add</span>
        </button>
      </div>
    </label>
  );
}

export function WeightStepper({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  function step(delta: number) {
    const next = Math.max(0, Math.round(((Number(value) || 0) + delta) * 2) / 2);
    onChange(String(next));
  }
  return (
    <label className="flex flex-col gap-1">
      <span className="font-label text-[9px] uppercase tracking-wider text-outline">Weight (kg)</span>
      <div className="flex items-stretch rounded-xl overflow-hidden border border-surface-variant">
        <button
          type="button"
          onClick={() => step(-2.5)}
          aria-label="Decrease weight"
          className="w-8 shrink-0 flex items-center justify-center bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-base leading-none">remove</span>
        </button>
        <input
          type="number"
          value={value}
          step="0.5"
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="w-full min-w-0 bg-surface-container text-on-surface font-body text-sm tabular-nums text-center px-0.5 py-3 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => step(2.5)}
          aria-label="Increase weight"
          className="w-8 shrink-0 flex items-center justify-center bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-base leading-none">add</span>
        </button>
      </div>
    </label>
  );
}
