"use client";

import { useEffect, useRef, useState } from "react";

export type NutritionResult = {
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

// The description+calories/protein/carbs/fat search-and-autofill behavior
// behind "Log A Meal" — shared with SavedMealsSection's add-item mini-form
// so building a saved meal looks up the exact same way logging one directly
// does, instead of two copies of this debounce/scaling logic drifting apart.
export function useFoodSearch() {
  const [description, setDescriptionRaw] = useState("");
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const [quantity, setQuantity] = useState("100");
  // Non-null only while the four macro fields are still "live" against a
  // picked result — cleared the moment any of the four is hand-edited or the
  // description changes, same reasoning as FoodLogForm originally had it.
  const [baseValues, setBaseValues] = useState<BaseValues | null>(null);

  const [results, setResults] = useState<NutritionResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [autofilledFrom, setAutofilledFrom] = useState<{ servingInfo: string; source: "local" | "usda" } | null>(
    null
  );
  const [lookupError, setLookupError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Picking a result sets `description` programmatically, which would
  // otherwise re-trigger this same search 500ms later and pop the dropdown
  // back open over the value just chosen — this flag skips that one
  // round-trip without a synchronous setState call.
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

  function setDescription(value: string) {
    setDescriptionRaw(value);
    // Editing the name after picking a result means something new is being
    // described — stop treating the old numbers as auto-filled.
    setAutofilledFrom(null);
    setLookupError(null);
    setBaseValues(null);
    setQuantity("100");
  }

  function pickResult(result: NutritionResult) {
    skipNextSearchRef.current = true;
    setDescriptionRaw(result.description);
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

  function reset() {
    setDescriptionRaw("");
    setCalories("");
    setProteinG("");
    setCarbsG("");
    setFatG("");
    setQuantity("100");
    setBaseValues(null);
    setAutofilledFrom(null);
    setLookupError(null);
    setResults([]);
    setShowResults(false);
  }

  return {
    description,
    setDescription,
    calories,
    setCalories,
    proteinG,
    setProteinG,
    carbsG,
    setCarbsG,
    fatG,
    setFatG,
    quantity,
    baseValues,
    results,
    searching,
    showResults,
    setShowResults,
    autofilledFrom,
    lookupError,
    pickResult,
    handleQuantityChange,
    handleMacroFieldChange,
    reset,
  };
}
