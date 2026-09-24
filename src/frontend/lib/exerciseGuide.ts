// Read-only reference library — "tell me about this exercise, let me
// search/browse by category" — a different job from exerciseLibrary.ts,
// which is the hand-tuned (desi aliases, typo tolerance) list that powers
// the workout logger's autocomplete and the Muscle Progress XP matcher.
// That file is deliberately untouched by this one: it's been carefully
// built up over real usage, and this browse feature doesn't need any of
// its matching sophistication — just filtering a fixed list.
//
// Source: https://github.com/hasaneyldrm/exercises-dataset (MIT-licensed
// code/data). Trimmed from the original ~17MB multilingual + media dataset
// down to ~850KB: English instructions only (dropped the other 9
// languages), and no image/gif fields at all — that media is (c) Gym
// visual and NOT included here; reuse of it requires a separate license
// from Gym visual, which this app doesn't have.
import data from "@/frontend/lib/data/exerciseGuideData.json";

export type ExerciseGuideEntry = {
  id: string;
  name: string;
  category: string;
  equipment: string;
  target: string;
  secondaryMuscles: string[];
  steps: string[];
};

const ENTRIES = data as ExerciseGuideEntry[];

// Display label for each of the dataset's 10 raw category values — kept as
// a fixed, ordered list (not derived by scanning the data) so the filter
// row's order is stable and deliberate, not whatever order categories
// happen to first appear in the JSON.
export const EXERCISE_GUIDE_CATEGORIES: { value: string; label: string }[] = [
  { value: "chest", label: "Chest" },
  { value: "back", label: "Back" },
  { value: "shoulders", label: "Shoulders" },
  { value: "upper arms", label: "Upper Arms" },
  { value: "lower arms", label: "Lower Arms" },
  { value: "upper legs", label: "Upper Legs" },
  { value: "lower legs", label: "Lower Legs" },
  { value: "waist", label: "Waist / Abs" },
  { value: "neck", label: "Neck" },
  { value: "cardio", label: "Cardio" },
];

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

// Server-side filtering (called from the page's Server Component, not a
// client component) — the full ~850KB dataset never needs to reach the
// browser at all; only whatever subset actually matches the current
// category/search gets sent down as props.
export function filterExerciseGuide({ category, query }: { category?: string; query?: string }): ExerciseGuideEntry[] {
  let results = ENTRIES;
  if (category) results = results.filter((e) => e.category === category);
  const q = query ? normalize(query) : "";
  if (q) {
    // Also matches category/equipment, not just name/target — someone
    // typing "back" or "dumbbell" is reasonably searching for that group,
    // even though most exercise names in this dataset don't literally
    // contain the word ("lat pulldown" has no "back" in it at all), and
    // `target` holds a specific muscle ("lats") rather than the category
    // name itself.
    results = results.filter(
      (e) =>
        normalize(e.name).includes(q) ||
        normalize(e.target).includes(q) ||
        normalize(e.category).includes(q) ||
        normalize(e.equipment).includes(q) ||
        e.secondaryMuscles.some((m) => normalize(m).includes(q))
    );
  }
  return results;
}

export function getExerciseGuideEntry(id: string): ExerciseGuideEntry | null {
  return ENTRIES.find((e) => e.id === id) ?? null;
}
