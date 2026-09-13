"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type NutritionResult = {
  fdcId: number;
  description: string;
  servingInfo: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
};

export default function FoodLogForm() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [results, setResults] = useState<NutritionResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [autofilledFrom, setAutofilledFrom] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Picking a result sets `description` programmatically, which would
  // otherwise re-trigger this same search 500ms later and pop the dropdown
  // back open over the value the user just chose — this flag lets the
  // effect skip that one round-trip without a synchronous setState call.
  const skipNextSearchRef = useRef(false);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const query = description.trim();
      if (query.length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      setLookupError(null);
      try {
        const res = await fetch(`/api/nutrition/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.status === "error") {
          setResults([]);
          setLookupError(data.message ?? "Lookup unavailable — enter values manually.");
        } else {
          setResults(data.results ?? []);
          setShowResults(true);
          if ((data.results ?? []).length === 0) {
            setLookupError("No matches found — enter values manually.");
          }
        }
      } catch {
        setResults([]);
        setLookupError("Lookup unavailable — enter values manually.");
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [description]);

  function handleDescriptionChange(value: string) {
    setDescription(value);
    // Editing the name after picking a result means they're describing
    // something new — stop treating the old numbers as auto-filled.
    setAutofilledFrom(null);
    setLookupError(null);
  }

  function pickResult(result: NutritionResult) {
    skipNextSearchRef.current = true;
    setDescription(result.description);
    setCalories(result.calories != null ? String(result.calories) : "");
    setProteinG(result.proteinG != null ? String(result.proteinG) : "");
    setCarbsG(result.carbsG != null ? String(result.carbsG) : "");
    setFatG(result.fatG != null ? String(result.fatG) : "");
    setAutofilledFrom(result.servingInfo);
    setLookupError(null);
    setResults([]);
    setShowResults(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/dashboard/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          calories,
          proteinG: proteinG || undefined,
          carbsG: carbsG || undefined,
          fatG: fatG || undefined,
        }),
      });
      setDescription("");
      setCalories("");
      setProteinG("");
      setCarbsG("");
      setFatG("");
      setAutofilledFrom(null);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface-container-low p-5 shadow-hard flex flex-col gap-3 mb-6">
      <span className="flex items-center gap-1.5 font-label text-xs uppercase tracking-widest text-primary-container">
        <span className="material-symbols-outlined text-base leading-none">restaurant</span>
        Log A Meal
      </span>

      <div className="relative">
        <input
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 150)}
          required
          placeholder="e.g. Banana — start typing to look up calories"
          className="w-full bg-surface-container border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container"
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-label text-[9px] uppercase text-tertiary">
            Searching…
          </span>
        )}
        {showResults && results.length > 0 && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-surface-container-high shadow-hard-lg max-h-60 overflow-y-auto">
            {results.map((r) => (
              <button
                type="button"
                key={r.fdcId}
                onMouseDown={() => pickResult(r)}
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

      {autofilledFrom && (
        <p className="font-body text-xs text-tertiary -mt-1">
          Auto-filled from USDA FoodData Central ({autofilledFrom}) — edit any value below before saving.
        </p>
      )}
      {lookupError && <p className="font-body text-xs text-error -mt-1">{lookupError}</p>}

      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1">
          <span className="font-label text-[9px] uppercase tracking-wider text-outline">Calories</span>
          <input
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            required
            placeholder="Calories"
            className="w-full bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-3 outline-none focus:border-primary-container"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-label text-[9px] uppercase tracking-wider text-outline">Protein (g)</span>
          <input
            type="number"
            value={proteinG}
            onChange={(e) => setProteinG(e.target.value)}
            placeholder="Protein"
            className="w-full bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-3 outline-none focus:border-primary-container"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-label text-[9px] uppercase tracking-wider text-outline">Carbs (g)</span>
          <input
            type="number"
            value={carbsG}
            onChange={(e) => setCarbsG(e.target.value)}
            placeholder="Carbs"
            className="w-full bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-3 outline-none focus:border-primary-container"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="font-label text-[9px] uppercase tracking-wider text-outline">Fat (g)</span>
        <input
          type="number"
          value={fatG}
          onChange={(e) => setFatG(e.target.value)}
          placeholder="Fat"
          className="w-full bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-3 outline-none focus:border-primary-container"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 shadow-hard disabled:opacity-60 transition-colors"
      >
        {submitting ? "Saving..." : "Log Meal"}
      </button>
    </form>
  );
}
