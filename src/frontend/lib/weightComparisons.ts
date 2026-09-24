// A raw number ("300kg") doesn't mean much to someone scrolling past a
// shared card who doesn't lift — a relatable comparison is what actually
// makes a stranger stop and read it. Approximate on purpose (this is a fun
// aside, not a claim of scientific accuracy), sorted ascending; picks the
// largest entry at or below the given weight. Covers both a single lift
// (5-500kg) and a week's total volume (500-50,000kg) in one table since
// both card types use this.
const COMPARISONS: [thresholdKg: number, label: string][] = [
  [5, "a bowling ball"],
  [15, "a car tyre"],
  [30, "a mid-size dog"],
  [50, "an adult panda"],
  [70, "an average adult human"],
  [100, "a baby grand piano"],
  [150, "a large motorcycle"],
  [250, "a baby elephant"],
  [400, "a grand piano"],
  [700, "a small horse"],
  [1000, "a small car"],
  [2000, "a large SUV"],
  [5000, "an adult hippo"],
  [10000, "a school bus"],
  [20000, "a shipping container"],
  [40000, "a blue whale's tongue"],
];

export function weightComparison(weightKg: number): string | null {
  let match: string | null = null;
  for (const [threshold, label] of COMPARISONS) {
    if (weightKg >= threshold) match = label;
    else break;
  }
  return match;
}
