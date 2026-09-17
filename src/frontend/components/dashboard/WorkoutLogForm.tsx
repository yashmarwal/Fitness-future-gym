"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkoutLog } from "@/backend/services/workouts";
import type { TodaysWorkout, WorkoutPlanExercise } from "@/backend/services/workoutPlans";
import RestTimerBar from "@/frontend/components/dashboard/RestTimerBar";

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
    const key = normalizeExerciseName(exerciseName);
    setSuggestion(key ? (lastByExercise.get(key) ?? null) : null);
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
      await fetch("/api/dashboard/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseName, sets, reps, weightKg: weightKg || undefined }),
      });
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

        <label className="flex flex-col gap-1">
          <span className="font-label text-[9px] uppercase tracking-wider text-outline">Exercise</span>
          <input
            value={exerciseName}
            onChange={(e) => {
              setExerciseName(e.target.value);
              setSuggestion(null);
            }}
            onBlur={handleExerciseNameBlur}
            required
            placeholder="e.g. Bench Press"
            className="w-full bg-surface-container border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container"
          />
        </label>

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
