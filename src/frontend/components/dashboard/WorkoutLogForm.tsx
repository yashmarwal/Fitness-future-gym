"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkoutLog } from "@/backend/services/workouts";
import type { TodaysWorkout, WorkoutPlanExercise } from "@/backend/services/workoutPlans";
import type { PrCheckResult } from "@/backend/services/personalRecords";
import RestTimerBar from "@/frontend/components/dashboard/RestTimerBar";
import PrCelebration from "@/frontend/components/dashboard/PrCelebration";
import { matchExerciseCategory, searchExercises } from "@/frontend/lib/exerciseLibrary";

function firstNumber(text: string): number | null {
  const match = text.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function normalizeExerciseName(name: string): string {
  return name.trim().toLowerCase();
}

type LastEntry = { exerciseName: string; sets: number; reps: number; weightKg: number | null };

export default function WorkoutLogForm({
  logs,
  todaysPlan,
}: {
  logs: WorkoutLog[];
  todaysPlan: TodaysWorkout | null;
}) {
  const router = useRouter();
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weightKg, setWeightKg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [suggestion, setSuggestion] = useState<LastEntry | null>(null);
  const [prCelebration, setPrCelebration] = useState<PrCheckResult | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  // The fuzzy search (Fuse.js) is deferred so a slow phone keeps typing
  // smoothly — the dropdown just trails the input by a beat if it has to.
  const deferredName = useDeferredValue(exerciseName);
  const trimmedName = deferredName.trim();
  const exerciseMatches = useMemo(
    () => (suggestionsOpen && trimmedName.length >= 2 ? searchExercises(trimmedName, 6) : []),
    [suggestionsOpen, trimmedName]
  );
  // A dropdown that only echoes back exactly what was typed is just noise.
  const showDropdown =
    exerciseMatches.length > 0 &&
    !(exerciseMatches.length === 1 && exerciseMatches[0].name.toLowerCase() === trimmedName.toLowerCase());
  // Whether this exercise will earn Muscle Progress XP — the same matcher the
  // server uses when the set is saved (awardWorkoutXp), so the hint can't lie.
  const countedCategory = useMemo(
    () => (trimmedName.length >= 3 ? matchExerciseCategory(trimmedName) : null),
    [trimmedName]
  );

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

  function applyEntry(entry: LastEntry) {
    setExerciseName(entry.exerciseName);
    setSets(entry.sets);
    setReps(entry.reps);
    setWeightKg(entry.weightKg != null ? String(entry.weightKg) : "");
    setSuggestion(null);
  }

  function handlePickPlanExercise(ex: WorkoutPlanExercise) {
    setExerciseName(ex.name);
    setSets(ex.sets);
    const parsedReps = firstNumber(ex.reps);
    if (parsedReps != null) setReps(parsedReps);
    setWeightKg("");
    setSuggestion(null);
  }

  function handleExerciseNameBlur() {
    setSuggestionsOpen(false);
    const key = normalizeExerciseName(exerciseName);
    setSuggestion(key ? (lastByExercise.get(key) ?? null) : null);
  }

  function handlePickExerciseMatch(name: string) {
    setExerciseName(name);
    setSuggestionsOpen(false);
    setSuggestion(lastByExercise.get(normalizeExerciseName(name)) ?? null);
  }

  function handleUseSuggestion() {
    if (!suggestion) return;
    setSets(suggestion.sets);
    setReps(suggestion.reps);
    setWeightKg(suggestion.weightKg != null ? String(suggestion.weightKg) : "");
    setSuggestion(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseName, sets, reps, weightKg: weightKg || undefined }),
      });
      const data = await res.json().catch(() => null);
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
        <div className="bg-surface-container-low p-4 shadow-hard flex flex-col gap-2">
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
                className="font-body text-xs px-3 py-2 bg-surface-container border border-surface-variant hover:border-primary-container text-on-surface transition-colors"
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
          className="flex items-center gap-2 font-label text-xs uppercase font-bold px-4 py-3 bg-surface-container-low border border-primary-container/50 text-primary-container hover:bg-surface-container transition-colors w-fit"
        >
          <span className="material-symbols-outlined text-base leading-none">repeat</span>
          Repeat Last Set — {lastLog.exerciseName} {lastLog.sets}×{lastLog.reps}
          {lastLog.weightKg ? ` @ ${lastLog.weightKg}kg` : ""}
        </button>
      )}

      <form onSubmit={handleSubmit} className="bg-surface-container-low p-5 shadow-hard flex flex-col gap-3">
        <span className="flex items-center gap-1.5 font-label text-xs uppercase tracking-widest text-primary-container">
          <span className="material-symbols-outlined text-base leading-none">fitness_center</span>
          Log A Set
        </span>

        <div className="relative flex flex-col gap-1">
          <label htmlFor="log-exercise" className="font-label text-[9px] uppercase tracking-wider text-outline">
            Exercise
          </label>
          <input
            id="log-exercise"
            value={exerciseName}
            onChange={(e) => {
              setExerciseName(e.target.value);
              setSuggestion(null);
              setSuggestionsOpen(true);
            }}
            onFocus={() => setSuggestionsOpen(true)}
            onBlur={handleExerciseNameBlur}
            required
            autoComplete="off"
            placeholder="e.g. Bench Press"
            className="w-full bg-surface-container border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container"
          />

          {showDropdown && (
            <ul
              role="listbox"
              aria-label="Matching exercises"
              className="absolute left-0 right-0 top-full z-20 mt-1 bg-surface-container-high border border-primary-container/50 shadow-hard max-h-64 overflow-y-auto"
            >
              {exerciseMatches.map((match) => (
                <li key={match.name} role="option" aria-selected={false}>
                  {/* preventDefault on mousedown keeps the input focused, so the
                      blur handler doesn't close the list before the click lands. */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handlePickExerciseMatch(match.name)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface-container-highest active:bg-surface-container-highest transition-colors"
                  >
                    <span className="font-body text-sm text-on-surface">{match.name}</span>
                    <span className="font-label text-[9px] uppercase tracking-wider text-primary-container shrink-0">
                      {match.category}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {trimmedName.length >= 3 && (
            <p className={`font-body text-[11px] ${countedCategory ? "text-tertiary" : "text-outline"}`}>
              {countedCategory
                ? `Counts toward your ${countedCategory} progress.`
                : "Not in our exercise list yet — it will still be logged, but won't earn Muscle Progress XP."}
            </p>
          )}
        </div>

        {suggestion && (
          <button
            type="button"
            onClick={handleUseSuggestion}
            className="flex items-center justify-between gap-2 font-body text-xs px-3 py-2.5 bg-surface-container border border-primary-container/40 text-on-surface hover:border-primary-container transition-colors text-left"
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
        )}

        <div className="grid grid-cols-3 gap-2">
          <NumberStepper label="Sets" value={sets} min={1} onChange={setSets} />
          <NumberStepper label="Reps" value={reps} min={1} onChange={setReps} />
          <WeightStepper value={weightKg} onChange={setWeightKg} />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 shadow-hard disabled:opacity-60 transition-colors"
        >
          {submitting ? "Saving..." : "Log Set"}
        </button>
      </form>
    </div>
  );
}

function NumberStepper({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-label text-[9px] uppercase tracking-wider text-outline">{label}</span>
      <div className="flex items-stretch border border-surface-variant">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Decrease ${label}`}
          className="w-9 shrink-0 flex items-center justify-center bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-base leading-none">remove</span>
        </button>
        <input
          type="number"
          value={value}
          min={min}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value) || min))}
          className="w-full min-w-0 bg-surface-container text-on-surface font-body text-center px-1 py-3 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          aria-label={`Increase ${label}`}
          className="w-9 shrink-0 flex items-center justify-center bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-base leading-none">add</span>
        </button>
      </div>
    </label>
  );
}

function WeightStepper({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  function step(delta: number) {
    const next = Math.max(0, Math.round(((Number(value) || 0) + delta) * 2) / 2);
    onChange(String(next));
  }
  return (
    <label className="flex flex-col gap-1">
      <span className="font-label text-[9px] uppercase tracking-wider text-outline">Weight (kg)</span>
      <div className="flex items-stretch border border-surface-variant">
        <button
          type="button"
          onClick={() => step(-2.5)}
          aria-label="Decrease weight"
          className="w-9 shrink-0 flex items-center justify-center bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-base leading-none">remove</span>
        </button>
        <input
          type="number"
          value={value}
          step="0.5"
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="w-full min-w-0 bg-surface-container text-on-surface font-body text-center px-1 py-3 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => step(2.5)}
          aria-label="Increase weight"
          className="w-9 shrink-0 flex items-center justify-center bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-base leading-none">add</span>
        </button>
      </div>
    </label>
  );
}
