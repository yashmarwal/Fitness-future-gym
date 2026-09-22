import { WORKOUT_TEMPLATES, type WorkoutTemplate, type ExperienceLevel } from "@/frontend/lib/workoutTemplates";
import type { FitnessGoalKey } from "@/frontend/lib/bmiMacro";

export type RecommendationInput = {
  goal: FitnessGoalKey;
  experienceLevel: ExperienceLevel;
  daysPerWeek: number;
};

const LEVEL_ORDER: Record<ExperienceLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 };

// Pure, offline, local scoring — no AI, no network call, matching this
// project's established "bundled library, not a live API" approach to
// workout content (see exerciseLibrary.ts). Every answer nudges the score;
// nothing is a hard filter, so there is always a best match, even for an
// unusual combination (e.g. "cut" + "advanced" + 6 days, which nothing here
// exactly is) rather than the wizard ever coming up empty.
function score(t: WorkoutTemplate, input: RecommendationInput): number {
  let s = 0;
  s += t.goal === input.goal ? 4 : 0;
  const levelGap = Math.abs(LEVEL_ORDER[t.level] - LEVEL_ORDER[input.experienceLevel]);
  s += levelGap === 0 ? 3 : levelGap === 1 ? 1 : 0;
  // Closer day count is worth more, tapering off — a 1-day mismatch barely
  // matters, a 4-day mismatch should meaningfully lose to a closer option.
  s += Math.max(0, 3 - Math.abs(t.daysPerWeek - input.daysPerWeek));
  return s;
}

// Best match first. Ties keep WORKOUT_TEMPLATES' original order (Array.sort
// is stable), so results are deterministic across calls with the same input.
export function rankTemplates(input: RecommendationInput): WorkoutTemplate[] {
  return [...WORKOUT_TEMPLATES].sort((a, b) => score(b, input) - score(a, input));
}

export function recommendTemplate(input: RecommendationInput): { primary: WorkoutTemplate; alternates: WorkoutTemplate[] } {
  const ranked = rankTemplates(input);
  return { primary: ranked[0], alternates: ranked.slice(1, 3) };
}
