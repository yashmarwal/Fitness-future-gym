// Shared between StreakMilestoneCelebration.tsx (which decides whether to
// even show the celebration) and the achievement-card route (which decides
// what badge to draw) — one definition of "what counts as a tier/milestone"
// instead of two that could drift apart.
export type StreakTier = "bronze" | "silver" | "gold" | "platinum";

export function streakTier(days: number): StreakTier | null {
  if (days >= 100) return "platinum";
  if (days >= 60) return "gold";
  if (days >= 30) return "silver";
  if (days >= 7) return "bronze";
  return null;
}

// Round numbers worth a celebration popup — every one of these is a
// deliberate "worth telling someone" moment, not just "the streak went up
// by one" (which happens every single day and would get old fast as a
// popup). Every 100 beyond 300 keeps working for a long-term member without
// needing this list extended by hand.
const NAMED_MILESTONES = [7, 14, 21, 30, 50, 60, 90, 100, 150, 200, 250, 300];

export function isStreakMilestone(days: number): boolean {
  if (NAMED_MILESTONES.includes(days)) return true;
  return days > 300 && days % 100 === 0;
}
