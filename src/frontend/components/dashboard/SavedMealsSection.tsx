"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SavedMeal, SavedMealItem } from "@/backend/services/savedMeals";
import type { FoodLog } from "@/backend/services/nutrition";
import { useFoodSearch } from "@/frontend/lib/useFoodSearch";

const DEFAULT_CATEGORIES = ["Breakfast", "Lunch", "Dinner"];

function sumCalories(items: SavedMealItem[]): number {
  return items.reduce((sum, item) => sum + item.calories, 0);
}

export default function SavedMealsSection({
  savedMeals,
  todaysLogs,
}: {
  savedMeals: SavedMeal[];
  todaysLogs: FoodLog[];
}) {
  const router = useRouter();

  const categories = Array.from(new Set([...DEFAULT_CATEGORIES, ...savedMeals.map((m) => m.category)]));
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  // Which saved meal's checklist is open, and which of its item indexes are
  // still checked — reset fresh (every item included) each time a meal is
  // expanded, so a previous session's unchecks never silently carry over.
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [includedIndexes, setIncludedIndexes] = useState<Set<number>>(new Set());
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [usingCustomCategory, setUsingCustomCategory] = useState(false);
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());
  // Items typed directly into the mini add-item form below — lets a meal be
  // built from scratch, same as `selectedLogIds` lets one be built from
  // what's already logged today. Either source (or both together) is fine;
  // submitCreate just concatenates whatever ended up in each. Backed by the
  // same search-and-autofill hook "Log A Meal" uses, so adding an item here
  // looks up calories/macros exactly like logging one directly does.
  const [customItems, setCustomItems] = useState<SavedMealItem[]>([]);
  const itemSearch = useFoodSearch();
  const [itemError, setItemError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function toggleExpand(meal: SavedMeal) {
    if (expandedMealId === meal.id) {
      setExpandedMealId(null);
      return;
    }
    setExpandedMealId(meal.id);
    setIncludedIndexes(new Set(meal.items.map((_, i) => i)));
    setAddError(null);
  }

  function toggleItem(index: number) {
    setIncludedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function addToLog(meal: SavedMeal) {
    const items = meal.items.filter((_, i) => includedIndexes.has(i));
    if (!items.length) return;
    setAdding(true);
    setAddError(null);
    try {
      // Same single-item endpoint every manual entry and the "Log Again"
      // strip already use — a saved meal is just several of those fired in
      // one go, so daily totals/history/retention behave identically either way.
      // fetch() only rejects on a real network failure, never on a 4xx/5xx or
      // a { status: "error" } body, so each result is checked individually —
      // otherwise a partial failure would close the panel as if everything
      // logged fine while something silently didn't.
      const results = await Promise.all(
        items.map((item) =>
          fetch("/api/dashboard/food", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              description: item.description,
              calories: item.calories,
              proteinG: item.proteinG ?? undefined,
              carbsG: item.carbsG ?? undefined,
              fatG: item.fatG ?? undefined,
            }),
          })
            .then((res) => res.json())
            .catch(() => ({ status: "error" }))
        )
      );
      const failedCount = results.filter((r) => r.status !== "ok").length;
      if (failedCount > 0) {
        setAddError(
          failedCount === items.length
            ? "Couldn't log those items — try again."
            : `${failedCount} of ${items.length} items couldn't be logged — try again.`
        );
      } else {
        setExpandedMealId(null);
      }
      router.refresh();
    } catch {
      setAddError("Network error — nothing was logged. Try again.");
    } finally {
      setAdding(false);
    }
  }

  async function deleteMeal(meal: SavedMeal) {
    if (!confirm(`Delete "${meal.name}"?`)) return;
    setDeletingId(meal.id);
    try {
      await fetch(`/api/dashboard/saved-meals/${meal.id}`, { method: "DELETE" });
      if (expandedMealId === meal.id) setExpandedMealId(null);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  function toggleLogSelection(logId: string) {
    setSelectedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) next.delete(logId);
      else next.add(logId);
      return next;
    });
  }

  function addCustomItem() {
    const description = itemSearch.description.trim();
    const calories = Number(itemSearch.calories);
    if (!description) {
      setItemError("Give the item a name.");
      return;
    }
    if (!itemSearch.calories || !Number.isFinite(calories)) {
      setItemError("Calories is required.");
      return;
    }
    // Same "bake the quantity into the saved description" convention as
    // logging directly (see FoodLogForm) — food_logs has no separate
    // quantity column, so this keeps a meal's items self-describing however
    // they end up getting logged later.
    const finalDescription = itemSearch.baseValues ? `${description} (${itemSearch.quantity}g)` : description;
    setCustomItems((prev) => [
      ...prev,
      {
        description: finalDescription,
        calories,
        proteinG: itemSearch.proteinG ? Number(itemSearch.proteinG) : null,
        carbsG: itemSearch.carbsG ? Number(itemSearch.carbsG) : null,
        fatG: itemSearch.fatG ? Number(itemSearch.fatG) : null,
      },
    ]);
    itemSearch.reset();
    setItemError(null);
  }

  function removeCustomItem(index: number) {
    setCustomItems((prev) => prev.filter((_, i) => i !== index));
  }

  function resetCreateForm() {
    setCreating(false);
    setNewName("");
    setNewCategory(DEFAULT_CATEGORIES[0]);
    setCustomCategory("");
    setUsingCustomCategory(false);
    setSelectedLogIds(new Set());
    setCustomItems([]);
    itemSearch.reset();
    setItemError(null);
    setSaveError(null);
  }

  async function submitCreate() {
    const name = newName.trim();
    const category = (usingCustomCategory ? customCategory : newCategory).trim();
    const fromTodaysLog: SavedMealItem[] = todaysLogs
      .filter((log) => selectedLogIds.has(log.id))
      .map((log) => ({
        description: log.description,
        calories: log.calories,
        proteinG: log.proteinG,
        carbsG: log.carbsG,
        fatG: log.fatG,
      }));
    const items: SavedMealItem[] = [...fromTodaysLog, ...customItems];

    if (!name) {
      setSaveError("Give the meal a name.");
      return;
    }
    if (!category) {
      setSaveError("Pick or type a category.");
      return;
    }
    if (!items.length) {
      setSaveError("Add at least one item — pick from today's log or add one below.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/dashboard/saved-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, items }),
      });
      const data = await res.json();
      if (data.status !== "ok") {
        setSaveError(data.message ?? "Couldn't save that meal.");
        return;
      }
      resetCreateForm();
      setActiveCategory(category);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const mealsInCategory = savedMeals.filter((m) => m.category === activeCategory);

  return (
    <div className="bg-surface-container-low p-5 shadow-soft rounded-2xl flex flex-col gap-3 mb-6">
      <span className="flex items-center gap-1.5 font-label text-xs uppercase tracking-widest text-primary-container">
        <span className="material-symbols-outlined text-base leading-none">bookmark</span>
        Saved Meals
      </span>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`font-label text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${
              activeCategory === category
                ? "bg-primary-container text-on-primary-container border-primary-container"
                : "bg-surface-container border-surface-variant text-tertiary hover:border-primary-container"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {mealsInCategory.length === 0 ? (
        <p className="font-body text-xs text-tertiary">
          Nothing saved under {activeCategory} yet — log a few items below, then save them as a meal.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {mealsInCategory.map((meal) => {
            const expanded = expandedMealId === meal.id;
            return (
              <div
                key={meal.id}
                className="bg-surface-container border border-surface-variant rounded-xl overflow-hidden"
              >
                <div className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container-high transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleExpand(meal)}
                    className="flex-1 min-w-0 flex items-center gap-3 text-left"
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block font-label text-sm uppercase tracking-wide text-on-surface truncate">
                        {meal.name}
                      </span>
                      <span className="block font-body text-xs text-tertiary">
                        {meal.items.length} item{meal.items.length === 1 ? "" : "s"} · {sumCalories(meal.items)} kcal
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-lg leading-none text-tertiary shrink-0">
                      {expanded ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${meal.name}`}
                    onClick={() => deleteMeal(meal)}
                    disabled={deletingId === meal.id}
                    className="shrink-0 p-1.5 rounded-lg text-tertiary hover:text-error hover:bg-error-container/15 transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base leading-none">delete</span>
                  </button>
                </div>

                {expanded && (
                  <div className="px-4 pb-4 flex flex-col gap-2 border-t border-surface-variant/40 pt-3">
                    <p className="font-body text-[11px] text-tertiary -mt-1">
                      Uncheck anything you skipped today.
                    </p>
                    {meal.items.map((item, i) => (
                      <label key={i} className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={includedIndexes.has(i)}
                          onChange={() => toggleItem(i)}
                          className="w-4 h-4 rounded accent-primary-container cursor-pointer"
                        />
                        <span className="flex-1 min-w-0 font-body text-sm text-on-surface capitalize truncate">
                          {item.description.toLowerCase()}
                        </span>
                        <span className="font-body text-xs text-tertiary shrink-0">{item.calories} kcal</span>
                      </label>
                    ))}
                    <button
                      type="button"
                      onClick={() => addToLog(meal)}
                      disabled={adding || includedIndexes.size === 0}
                      className="mt-1 w-full flex items-center justify-center font-label text-xs uppercase font-bold px-4 py-2.5 rounded-xl bg-primary-container hover:bg-secondary-container text-on-primary-container shadow-soft disabled:opacity-50 transition-colors"
                    >
                      {adding ? "Adding…" : "Add Meal"}
                    </button>
                    {addError && <p className="font-body text-xs text-error">{addError}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {creating ? (
        <div className="bg-surface-container border border-primary-container/50 rounded-xl p-4 flex flex-col gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Meal name, e.g. My Usual Breakfast"
            className="w-full rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body px-4 py-2.5 outline-none focus:border-primary-container"
          />

          <div className="flex flex-wrap gap-2">
            {DEFAULT_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setNewCategory(category);
                  setUsingCustomCategory(false);
                }}
                className={`font-label text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${
                  !usingCustomCategory && newCategory === category
                    ? "bg-primary-container text-on-primary-container border-primary-container"
                    : "bg-surface-container-low border-surface-variant text-tertiary hover:border-primary-container"
                }`}
              >
                {category}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setUsingCustomCategory(true)}
              className={`flex items-center gap-1 font-label text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${
                usingCustomCategory
                  ? "bg-primary-container text-on-primary-container border-primary-container"
                  : "bg-surface-container-low border-surface-variant text-tertiary hover:border-primary-container"
              }`}
            >
              <span className="material-symbols-outlined text-xs leading-none">add</span>
              Custom
            </button>
          </div>
          {usingCustomCategory && (
            <input
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Category name, e.g. Pre-Workout"
              className="w-full rounded-xl bg-surface-container-low border border-primary-container text-on-surface font-body px-4 py-2.5 outline-none"
            />
          )}

          {todaysLogs.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="font-label text-[9px] uppercase tracking-wider text-outline">
                Pick from today&apos;s log
              </span>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {todaysLogs.map((log) => (
                  <label key={log.id} className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={selectedLogIds.has(log.id)}
                      onChange={() => toggleLogSelection(log.id)}
                      className="w-4 h-4 rounded accent-primary-container cursor-pointer"
                    />
                    <span className="flex-1 min-w-0 font-body text-sm text-on-surface capitalize truncate">
                      {log.description.toLowerCase()}
                    </span>
                    <span className="font-body text-xs text-tertiary shrink-0">{log.calories} kcal</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="font-label text-[9px] uppercase tracking-wider text-outline">
              {todaysLogs.length > 0 ? "Or add a new item" : "Add items to this meal"}
            </span>

            {customItems.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {customItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 bg-surface-container-low rounded-lg px-3 py-2">
                    <span className="flex-1 min-w-0 font-body text-sm text-on-surface capitalize truncate">
                      {item.description.toLowerCase()}
                    </span>
                    <span className="font-body text-xs text-tertiary shrink-0">{item.calories} kcal</span>
                    <button
                      type="button"
                      aria-label={`Remove ${item.description}`}
                      onClick={() => removeCustomItem(i)}
                      className="shrink-0 text-tertiary hover:text-error transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm leading-none">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              <input
                value={itemSearch.description}
                onChange={(e) => itemSearch.setDescription(e.target.value)}
                onFocus={() => itemSearch.results.length > 0 && itemSearch.setShowResults(true)}
                onBlur={() => setTimeout(() => itemSearch.setShowResults(false), 150)}
                placeholder="e.g. Banana — start typing to look up calories"
                className="w-full rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body px-4 py-2.5 outline-none focus:border-primary-container"
              />
              {itemSearch.searching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-label text-[9px] uppercase text-tertiary">
                  Searching…
                </span>
              )}
              {itemSearch.showResults && itemSearch.results.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-surface-container-high shadow-soft-lg rounded-xl max-h-60 overflow-y-auto">
                  {itemSearch.results.map((r) => (
                    <button
                      type="button"
                      key={r.fdcId}
                      onMouseDown={() => itemSearch.pickResult(r)}
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

            {itemSearch.autofilledFrom && (
              <p className="font-body text-xs text-tertiary -mt-1">
                Auto-filled from{" "}
                {itemSearch.autofilledFrom.source === "local" ? "the Indian food reference" : "USDA FoodData Central"}{" "}
                ({itemSearch.autofilledFrom.servingInfo}) — edit any value below before adding.
              </p>
            )}
            {itemSearch.lookupError && <p className="font-body text-xs text-error -mt-1">{itemSearch.lookupError}</p>}

            {itemSearch.baseValues && (
              <label className="flex flex-col gap-1">
                <span className="font-label text-[9px] uppercase tracking-wider text-primary-container">
                  Quantity (g) — values scale automatically
                </span>
                <input
                  type="number"
                  value={itemSearch.quantity}
                  onChange={(e) => itemSearch.handleQuantityChange(e.target.value)}
                  min={1}
                  placeholder="100"
                  className="w-full rounded-xl bg-surface-container-low border border-primary-container text-on-surface font-body px-3 py-2.5 outline-none"
                />
              </label>
            )}

            <div className="grid grid-cols-4 gap-2">
              <input
                type="number"
                value={itemSearch.calories}
                onChange={(e) => itemSearch.handleMacroFieldChange(itemSearch.setCalories, e.target.value)}
                placeholder="Kcal"
                className="w-full rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body px-2 py-2.5 text-sm outline-none focus:border-primary-container"
              />
              <input
                type="number"
                value={itemSearch.proteinG}
                onChange={(e) => itemSearch.handleMacroFieldChange(itemSearch.setProteinG, e.target.value)}
                placeholder="Protein"
                className="w-full rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body px-2 py-2.5 text-sm outline-none focus:border-primary-container"
              />
              <input
                type="number"
                value={itemSearch.carbsG}
                onChange={(e) => itemSearch.handleMacroFieldChange(itemSearch.setCarbsG, e.target.value)}
                placeholder="Carbs"
                className="w-full rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body px-2 py-2.5 text-sm outline-none focus:border-primary-container"
              />
              <input
                type="number"
                value={itemSearch.fatG}
                onChange={(e) => itemSearch.handleMacroFieldChange(itemSearch.setFatG, e.target.value)}
                placeholder="Fat"
                className="w-full rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body px-2 py-2.5 text-sm outline-none focus:border-primary-container"
              />
            </div>
            {itemError && <p className="font-body text-xs text-error">{itemError}</p>}
            <button
              type="button"
              onClick={addCustomItem}
              className="self-start flex items-center gap-1.5 font-label text-xs uppercase font-bold px-3 py-2 rounded-xl bg-surface-container-low border border-surface-variant hover:border-primary-container text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-sm leading-none">add</span>
              Add Item
            </button>
          </div>

          {saveError && <p className="font-body text-xs text-error">{saveError}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={submitCreate}
              disabled={saving}
              className="flex-1 font-label text-xs uppercase font-bold px-4 py-2.5 rounded-xl bg-primary-container hover:bg-secondary-container text-on-primary-container shadow-soft disabled:opacity-60 transition-colors"
            >
              {saving ? "Saving…" : "Save Meal"}
            </button>
            <button
              type="button"
              onClick={resetCreateForm}
              className="font-label text-xs uppercase font-bold px-4 py-2.5 rounded-xl bg-surface-container-low border border-surface-variant text-tertiary hover:text-on-surface transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center justify-center gap-1.5 font-label text-xs uppercase font-bold px-4 py-2.5 rounded-xl bg-surface-container border border-dashed border-surface-variant hover:border-primary-container text-tertiary hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-sm leading-none">add</span>
          Save A New Meal
        </button>
      )}
    </div>
  );
}
