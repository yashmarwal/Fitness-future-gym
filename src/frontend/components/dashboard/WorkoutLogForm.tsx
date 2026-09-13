"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WorkoutLogForm() {
  const router = useRouter();
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weightKg, setWeightKg] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface-container-low p-5 shadow-hard flex flex-col gap-3 mb-6">
      <span className="flex items-center gap-1.5 font-label text-xs uppercase tracking-widest text-primary-container">
        <span className="material-symbols-outlined text-base leading-none">fitness_center</span>
        Log A Set
      </span>
      <input
        value={exerciseName}
        onChange={(e) => setExerciseName(e.target.value)}
        required
        placeholder="Exercise (e.g. Barbell Squat)"
        className="bg-surface-container border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container"
      />
      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1">
          <span className="font-label text-[9px] uppercase tracking-wider text-outline">Sets</span>
          <input
            type="number"
            value={sets}
            onChange={(e) => setSets(Number(e.target.value))}
            min={1}
            placeholder="Sets"
            className="w-full bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-3 outline-none focus:border-primary-container"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-label text-[9px] uppercase tracking-wider text-outline">Reps</span>
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(Number(e.target.value))}
            min={1}
            placeholder="Reps"
            className="w-full bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-3 outline-none focus:border-primary-container"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-label text-[9px] uppercase tracking-wider text-outline">Kg</span>
          <input
            type="number"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="Kg"
            className="w-full bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-3 outline-none focus:border-primary-container"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 shadow-hard disabled:opacity-60 transition-colors"
      >
        {submitting ? "Saving..." : "Log Set"}
      </button>
    </form>
  );
}
