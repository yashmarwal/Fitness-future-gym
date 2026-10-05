// A raw number ("300kg") doesn't mean much to someone scrolling past a
// shared card who doesn't lift — a relatable comparison is what actually
// makes a stranger stop and read it. Thresholds are each entry's actual
// real-world weight (checked against real sources, not invented) — this
// table used to have several genuinely wrong ones (an "adult panda" at
// 50kg, a "baby grand piano" at 100kg when real ones are ~300kg, an
// "adult hippo" at 5000kg when the real figure is ~1500kg, a blue whale's
// tongue at 40,000kg when it's really ~3,000kg) that happened to go
// unnoticed because this card is shared publicly under the gym's name —
// "approximate for fun" is fine, "wrong" isn't, same as every other piece
// of public-facing copy on this site. Sorted ascending; picks the largest
// entry at or below the given weight. Covers both a single lift (5-500kg)
// and a week's total volume (500-50,000kg) in one table since both card
// types use this.
const COMPARISONS: [thresholdKg: number, label: string][] = [
  [5, "a bowling ball"],
  [15, "a car tyre"],
  [30, "a mid-size dog"],
  [70, "an average adult human"],
  [100, "an adult panda"],
  [250, "a baby elephant"],
  [300, "a pony"],
  [350, "a baby grand piano"],
  [400, "a grand piano"],
  [420, "a large motorcycle"],
  [1000, "a small car"],
  [1500, "an adult hippo"],
  [2000, "a large SUV"],
  [3000, "a blue whale's tongue"],
  [10000, "a school bus"],
  [20000, "a shipping container"],
  [40000, "an adult sperm whale"],
];

export function weightComparison(weightKg: number): string | null {
  let match: string | null = null;
  for (const [threshold, label] of COMPARISONS) {
    if (weightKg >= threshold) match = label;
    else break;
  }
  return match;
}
