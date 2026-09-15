// Shared visual language for muscle-group rank tiers — used by both the
// server-rendered Overview teaser and the interactive client progress
// board, so the two never drift into different color schemes for the same
// rank.
export const CATEGORY_ICON: Record<string, string> = {
  Chest: "fitness_center",
  Back: "rowing",
  Shoulders: "accessibility_new",
  Legs: "directions_run",
  Arms: "sports_martial_arts",
  Core: "self_improvement",
  Cardio: "monitor_heart",
  "Full Body": "bolt",
};

export function tierClasses(rankIndex: number): { badge: string; bar: string } {
  if (rankIndex >= 5) {
    return { badge: "bg-primary-container text-on-primary-container border-primary-container", bar: "bg-primary-container" };
  }
  if (rankIndex >= 4) {
    return { badge: "bg-primary-container/40 text-on-surface border-primary-container", bar: "bg-primary-container" };
  }
  if (rankIndex >= 3) {
    return { badge: "bg-secondary-container/35 text-on-surface border-secondary-container/70", bar: "bg-secondary-container" };
  }
  if (rankIndex >= 2) {
    return { badge: "bg-primary-container/15 text-primary-container border-primary-container/50", bar: "bg-primary-container/80" };
  }
  if (rankIndex >= 1) {
    return { badge: "bg-surface-container-high text-on-surface-variant border-outline/40", bar: "bg-on-surface-variant" };
  }
  return { badge: "bg-surface-container-high text-tertiary border-outline/25", bar: "bg-outline" };
}
