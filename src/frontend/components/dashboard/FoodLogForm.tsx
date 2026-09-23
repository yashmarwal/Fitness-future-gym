"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { FrequentFood } from "@/backend/services/nutrition";

type NutritionResult = {
  fdcId: number;
  description: string;
  servingInfo: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  source: "local" | "usda";
};

type BaseValues = {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
};

// USDA's Foundation/SR Legacy/Survey data (the only types this app queries —
// see nutritionLookup.ts) always reports nutrients per 100g, so scaling by
// quantity/100 is exact, not an approximation.
function scalePer100g(base: number | null, quantityG: string): string {
  if (base == null) return "";
  const qty = Number(quantityG);
  if (!qty || qty <= 0) return "";
  return String(Math.round(((base * qty) / 100) * 10) / 10);
}

export default function FoodLogForm({ frequentFoods = [] }: { frequentFoods?: FrequentFood[] }) {
  const router = useRouter();
  const [loggingAgain, setLoggingAgain] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [results, setResults] = useState<NutritionResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [autofilledFrom, setAutofilledFrom] = useState<{ servingInfo: string; source: "local" | "usda" } | null>(
    null
  );
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("100");
  // Non-null only while the four macro fields are still "live" against a
  // picked USDA result — set on pick, cleared the moment the member edits
  // any of the four fields by hand (a manual override should stick, not get
  // silently overwritten the next time quantity changes) or types a new
  // food name.
  const [baseValues, setBaseValues] = useState<BaseValues | null>(null);
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
    setBaseValues(null);
    setQuantity("100");
  }

  function pickResult(result: NutritionResult) {
    skipNextSearchRef.current = true;
    setDescription(result.description);
    setQuantity("100");
    const base: BaseValues = {
      calories: result.calories,
      proteinG: result.proteinG,
      carbsG: result.carbsG,
      fatG: result.fatG,
    };
    setBaseValues(base);
    setCalories(scalePer100g(base.calories, "100"));
    setProteinG(scalePer100g(base.proteinG, "100"));
    setCarbsG(scalePer100g(base.carbsG, "100"));
    setFatG(scalePer100g(base.fatG, "100"));
    setAutofilledFrom({ servingInfo: result.servingInfo, source: result.source });
    setLookupError(null);
    setResults([]);
    setShowResults(false);
  }

  function handleQuantityChange(value: string) {
    setQuantity(value);
    if (baseValues) {
      setCalories(scalePer100g(baseValues.calories, value));
      setProteinG(scalePer100g(baseValues.proteinG, value));
      setCarbsG(scalePer100g(baseValues.carbsG, value));
      setFatG(scalePer100g(baseValues.fatG, value));
    }
  }

  // A direct edit to any of the four macro fields breaks the live link to
  // quantity for all four at once — simpler and more predictable than
  // tracking per-field overrides, which could otherwise leave some fields
  // silently still tied to quantity while others aren't.
  function handleMacroFieldChange(setter: (v: string) => void, value: string) {
    setBaseValues(null);
    setter(value);
  }

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
      const finalDescription = baseValues ? `${description} (${quantity}g)` : description;

      await fetch("/api/dashboard/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: finalDescription,
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
      setBaseValues(null);
      setQuantity("100");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface-container-low p-5 shadow-soft rounded-2xl flex flex-col gap-3 mb-6">
      <span className="flex items-center gap-1.5 font-label text-xs uppercase tracking-widest text-primary-container">
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
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 150)}
          required
          placeholder="e.g. Banana — start typing to look up calories"
          className="w-full rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container"
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-label text-[9px] uppercase text-tertiary">
            Searching…
          </span>
        )}
        {showResults && results.length > 0 && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-surface-container-high shadow-soft-lg rounded-xl max-h-60 overflow-y-auto">
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
          Auto-filled from {autofilledFrom.source === "local" ? "the Indian food reference" : "USDA FoodData Central"}{" "}
          ({autofilledFrom.servingInfo}) — edit any value below before saving.
        </p>
      )}
      {lookupError && <p className="font-body text-xs text-error -mt-1">{lookupError}</p>}

      {baseValues && (
        <label className="flex flex-col gap-1">
          <span className="font-label text-[9px] uppercase tracking-wider text-primary-container">
            Quantity (g) — values scale automatically
          </span>
          <input
            type="number"
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
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
            value={calories}
            onChange={(e) => handleMacroFieldChange(setCalories, e.target.value)}
            required
            placeholder="Calories"
            className="w-full rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-3 outline-none focus:border-primary-container"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-label text-[9px] uppercase tracking-wider text-outline">Protein (g)</span>
          <input
            type="number"
            value={proteinG}
            onChange={(e) => handleMacroFieldChange(setProteinG, e.target.value)}
            placeholder="Protein"
            className="w-full rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-3 outline-none focus:border-primary-container"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-label text-[9px] uppercase tracking-wider text-outline">Carbs (g)</span>
          <input
            type="number"
            value={carbsG}
            onChange={(e) => handleMacroFieldChange(setCarbsG, e.target.value)}
            placeholder="Carbs"
            className="w-full rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-3 outline-none focus:border-primary-container"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="font-label text-[9px] uppercase tracking-wider text-outline">Fat (g)</span>
        <input
          type="number"
          value={fatG}
          onChange={(e) => handleMacroFieldChange(setFatG, e.target.value)}
          placeholder="Fat"
          className="w-full bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-3 outline-none focus:border-primary-container"
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
