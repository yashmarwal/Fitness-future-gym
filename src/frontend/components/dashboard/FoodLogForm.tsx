"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FrequentFood } from "@/backend/services/nutrition";
import { useFoodSearch } from "@/frontend/lib/useFoodSearch";

export default function FoodLogForm({ frequentFoods = [] }: { frequentFoods?: FrequentFood[] }) {
  const router = useRouter();
  const [loggingAgain, setLoggingAgain] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const search = useFoodSearch();

  async function logAgain(item: FrequentFood) {
    setLoggingAgain(item.description);
    try {
      await fetch("/api/dashboard/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: item.description,
          calories: item.calories,
          proteinG: item.proteinG ?? undefined,
          carbsG: item.carbsG ?? undefined,
          fatG: item.fatG ?? undefined,
        }),
      });
      router.refresh();
    } finally {
      setLoggingAgain(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Quantity isn't its own database column (see food_logs schema) — it's
      // baked into the saved description instead, so the log history still
      // shows how much was eaten without needing a migration.
      const finalDescription = search.baseValues ? `${search.description} (${search.quantity}g)` : search.description;

      await fetch("/api/dashboard/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: finalDescription,
          calories: search.calories,
          proteinG: search.proteinG || undefined,
          carbsG: search.carbsG || undefined,
          fatG: search.fatG || undefined,
        }),
      });
      search.reset();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden card-corner-glow card-glow-border bg-surface-container-low p-5 shadow-soft rounded-2xl border flex flex-col gap-3 mb-6"
    >
      <span className="flex items-center gap-2 font-label text-xs uppercase tracking-widest text-primary-container">
        <span className="w-1 h-4 rounded-full bg-primary-container shrink-0" aria-hidden="true" />
        <span className="material-symbols-outlined text-base leading-none">restaurant</span>
        Log A Meal
      </span>

      {frequentFoods.length > 0 && (
        <div className="flex flex-col gap-1.5 -mt-1">
          <span className="font-label text-[9px] uppercase tracking-wider text-outline">Log Again</span>
          <div className="flex flex-wrap gap-2">
            {frequentFoods.map((item) => (
              <button
                type="button"
                key={item.description}
                onClick={() => logAgain(item)}
                disabled={loggingAgain !== null}
                className="flex items-center gap-1.5 font-body text-xs px-3 py-2 rounded-xl bg-surface-container border border-surface-variant hover:border-primary-container text-on-surface disabled:opacity-60 transition-colors"
              >
                <span className="material-symbols-outlined text-sm leading-none text-primary-container">
                  {loggingAgain === item.description ? "hourglass_top" : "add_circle"}
                </span>
                <span className="capitalize">{item.description.toLowerCase()}</span>
                <span className="text-tertiary">· {item.calories} kcal</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <input
          value={search.description}
          onChange={(e) => search.setDescription(e.target.value)}
          onFocus={() => search.results.length > 0 && search.setShowResults(true)}
          onBlur={() => setTimeout(() => search.setShowResults(false), 150)}
          required
          placeholder="e.g. Banana — start typing to look up calories"
          className="w-full rounded-xl bg-surface-container border border-primary-container/40 text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container"
        />
        {search.searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-label text-[9px] uppercase text-tertiary">
            Searching…
          </span>
        )}
        {search.showResults && search.results.length > 0 && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-surface-container-high shadow-soft-lg rounded-xl max-h-60 overflow-y-auto">
            {search.results.map((r) => (
              <button
                type="button"
                key={r.fdcId}
                onMouseDown={() => search.pickResult(r)}
                className="w-full text-left px-4 py-2.5 hover:bg-surface-container-highest transition-colors border-b border-surface-variant/30 last:border-b-0"
              >
                <span className="block font-body text-sm text-on-surface capitalize">
                  {r.description.toLowerCase()}
                </span>
                <span className="block font-label text-[9px] uppercase text-tertiary mt-0.5">
                  {r.calories != null ? `${r.calories} kcal` : "No calorie data"} · {r.servingInfo}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {search.autofilledFrom && (
        <p className="font-body text-xs text-tertiary -mt-1">
          Auto-filled from{" "}
          {search.autofilledFrom.source === "local" ? "the Indian food reference" : "USDA FoodData Central"} (
          {search.autofilledFrom.servingInfo}) — edit any value below before saving.
        </p>
      )}
      {search.lookupError && <p className="font-body text-xs text-error -mt-1">{search.lookupError}</p>}

      {search.baseValues && (
        <label className="flex flex-col gap-1">
          <span className="font-label text-[9px] uppercase tracking-wider text-primary-container">
            Quantity (g) — values scale automatically
          </span>
          <input
            type="number"
            value={search.quantity}
            onChange={(e) => search.handleQuantityChange(e.target.value)}
            min={1}
            placeholder="100"
            className="w-full rounded-xl bg-surface-container border border-primary-container text-on-surface font-body px-3 py-3 outline-none"
          />
        </label>
      )}

      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1">
          <span className="font-label text-[9px] uppercase tracking-wider text-outline">Calories</span>
          <input
            type="number"
            value={search.calories}
            onChange={(e) => search.handleMacroFieldChange(search.setCalories, e.target.value)}
            required
            placeholder="Calories"
            className="w-full rounded-xl bg-surface-container border border-primary-container/40 text-on-surface font-body px-3 py-3 outline-none focus:border-primary-container"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-label text-[9px] uppercase tracking-wider text-outline">Protein (g)</span>
          <input
            type="number"
            value={search.proteinG}
            onChange={(e) => search.handleMacroFieldChange(search.setProteinG, e.target.value)}
            placeholder="Protein"
            className="w-full rounded-xl bg-surface-container border border-primary-container/40 text-on-surface font-body px-3 py-3 outline-none focus:border-primary-container"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-label text-[9px] uppercase tracking-wider text-outline">Carbs (g)</span>
          <input
            type="number"
            value={search.carbsG}
            onChange={(e) => search.handleMacroFieldChange(search.setCarbsG, e.target.value)}
            placeholder="Carbs"
            className="w-full rounded-xl bg-surface-container border border-primary-container/40 text-on-surface font-body px-3 py-3 outline-none focus:border-primary-container"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="font-label text-[9px] uppercase tracking-wider text-outline">Fat (g)</span>
        <input
          type="number"
          value={search.fatG}
          onChange={(e) => search.handleMacroFieldChange(search.setFatG, e.target.value)}
          placeholder="Fat"
          className="w-full rounded-xl bg-surface-container border border-primary-container/40 text-on-surface font-body px-3 py-3 outline-none focus:border-primary-container"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 rounded-xl shadow-soft disabled:opacity-60 transition-colors"
      >
        {submitting ? "Saving..." : "Log Meal"}
      </button>
    </form>
  );
}
