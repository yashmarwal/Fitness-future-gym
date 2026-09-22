import type { TemplateDay, TemplateExercise } from "@/frontend/lib/workoutTemplates";
import type { FitnessGoalKey } from "@/frontend/lib/bmiMacro";
import type { ExperienceLevel } from "@/frontend/lib/workoutTemplates";

// Builds a real day-by-day plan from this app's own exercise library
// (exerciseLibrary.ts) rather than picking the closest of a fixed set of
// hand-built templates — every exercise name below is copied verbatim from
// that file, so anything generated here is fully searchable/loggable and
// stays in sync with the same library the workout logger uses.
//
// The split (how many days, what each day trains, set/rep scheme) follows
// current strength-training research rather than guesswork:
//   - 2-3 days/week: full body each session — a muscle trained once a week
//     is well below the frequency that grows it fastest.
//   - 4 days/week: Upper/Lower — the standard evidence-based split at this
//     frequency (each muscle trained twice).
//   - 5 days/week: Push/Pull/Legs + Upper/Lower for beginner/intermediate
//     (still ~2x/muscle/week); a classic one-muscle-per-day split
//     (Chest/Back/Shoulders/Legs/Arms) for advanced lifters, who have the
//     per-session work capacity to make that frequency worthwhile.
//   - 6 days/week: Push/Pull/Legs run twice.
//   - Weekly volume: ~6-10 hard sets/muscle for beginners, ~10-16 for
//     intermediate, ~16-20 for advanced (per-session counts below are
//     scaled down from these weekly targets by how many times each split
//     hits a muscle per week).
//   - Reps: heavier/lower-rep for a bulk goal, moderate for maintain,
//     higher-rep/shorter-rest for a cut, per the standard strength (3-6),
//     hypertrophy (6-15, sweet spot 8-12), and fat-loss (12-15+) ranges.
// Sources (checked 2026-09): a systematic review on training frequency
// (~12-20 weekly hard sets/muscle in trained lifters), set-volume guidance
// by experience level (beginner 6-10, intermediate 10-16, advanced 16-20+),
// and the standard strength/hypertrophy/endurance rep-range continuum.

type Subgroup = "chest" | "backWidth" | "backThickness" | "shoulderPress" | "shoulderLateral" | "biceps" | "triceps" | "quads" | "hamsGlutes" | "calves" | "core";

type PoolExercise = { name: string; tier: "compound" | "isolation" };

// Hand-picked, not the full library — excludes catch-all "(General)"
// entries, pure grip/forearm/neck isolation, and near-duplicate variants,
// the same curation bar the hand-built templates already use. Every name
// is a real, exact entry in exerciseLibrary.ts.
const POOL: Record<Subgroup, PoolExercise[]> = {
  chest: [
    { name: "Barbell Bench Press", tier: "compound" },
    { name: "Incline Dumbbell Press", tier: "compound" },
    { name: "Dumbbell Bench Press", tier: "compound" },
    { name: "Machine Chest Press", tier: "compound" },
    { name: "Dumbbell Flyes", tier: "isolation" },
    { name: "Cable Crossover", tier: "isolation" },
    { name: "Pec Deck Machine", tier: "isolation" },
    { name: "Push-Ups", tier: "compound" },
  ],
  backWidth: [
    { name: "Pull-Ups", tier: "compound" },
    { name: "Lat Pulldown", tier: "compound" },
    { name: "Chin-Ups", tier: "compound" },
    { name: "Close-Grip Lat Pulldown", tier: "compound" },
    { name: "Straight-Arm Pulldown", tier: "isolation" },
  ],
  backThickness: [
    { name: "Barbell Row", tier: "compound" },
    { name: "Seated Cable Row", tier: "compound" },
    { name: "T-Bar Row", tier: "compound" },
    { name: "Single-Arm Dumbbell Row", tier: "compound" },
    { name: "Chest-Supported Row", tier: "compound" },
    { name: "Face Pull", tier: "isolation" },
  ],
  shoulderPress: [
    { name: "Overhead Barbell Press", tier: "compound" },
    { name: "Seated Dumbbell Shoulder Press", tier: "compound" },
    { name: "Arnold Press", tier: "compound" },
    { name: "Machine Shoulder Press", tier: "compound" },
  ],
  shoulderLateral: [
    { name: "Lateral Raise", tier: "isolation" },
    { name: "Cable Lateral Raise", tier: "isolation" },
    { name: "Rear Delt Flyes", tier: "isolation" },
    { name: "Cable Rear Delt Fly", tier: "isolation" },
  ],
  biceps: [
    { name: "Barbell Curl", tier: "compound" },
    { name: "Dumbbell Curl", tier: "isolation" },
    { name: "Hammer Curl", tier: "isolation" },
    { name: "Preacher Curl", tier: "isolation" },
    { name: "Cable Curl", tier: "isolation" },
    { name: "Incline Dumbbell Curl", tier: "isolation" },
  ],
  triceps: [
    { name: "Close-Grip Bench Press", tier: "compound" },
    { name: "Tricep Pushdown", tier: "isolation" },
    { name: "Skull Crushers", tier: "isolation" },
    { name: "Overhead Tricep Extension", tier: "isolation" },
    { name: "Dips (Tricep Focus)", tier: "compound" },
    { name: "Tricep Kickback", tier: "isolation" },
  ],
  quads: [
    { name: "Barbell Back Squat", tier: "compound" },
    { name: "Leg Press", tier: "compound" },
    { name: "Front Squat", tier: "compound" },
    { name: "Goblet Squat", tier: "compound" },
    { name: "Bulgarian Split Squat", tier: "compound" },
    { name: "Leg Extension", tier: "isolation" },
    { name: "Walking Lunges", tier: "compound" },
  ],
  hamsGlutes: [
    { name: "Romanian Deadlift", tier: "compound" },
    { name: "Hip Thrust", tier: "compound" },
    { name: "Leg Curl", tier: "isolation" },
    { name: "Glute Bridge", tier: "isolation" },
    { name: "Single-Leg Romanian Deadlift", tier: "compound" },
  ],
  calves: [
    { name: "Standing Calf Raise", tier: "isolation" },
    { name: "Seated Calf Raise", tier: "isolation" },
  ],
  core: [
    { name: "Plank", tier: "compound" },
    { name: "Hanging Leg Raise", tier: "isolation" },
    { name: "Cable Crunch", tier: "isolation" },
    { name: "Russian Twist", tier: "isolation" },
    { name: "Ab Wheel Rollout", tier: "isolation" },
    { name: "Dead Bug", tier: "isolation" },
  ],
};

// Picks `count` items from a subgroup's pool, offset by `rotation` so
// consecutive days pulling from the same subgroup (e.g. Day A and Day B of
// a full-body split) don't repeat identical exercises, wrapping once the
// pool is exhausted rather than erroring.
function pick(subgroup: Subgroup, count: number, rotation = 0): PoolExercise[] {
  const pool = POOL[subgroup];
  const out: PoolExercise[] = [];
  for (let i = 0; i < count; i++) out.push(pool[(rotation + i) % pool.length]);
  return out;
}

type SetRepScheme = { compoundSets: number; compoundReps: string; isolationSets: number; isolationReps: string };

function schemeFor(goal: FitnessGoalKey): SetRepScheme {
  if (goal === "cut") return { compoundSets: 3, compoundReps: "10-12", isolationSets: 3, isolationReps: "12-15" };
  if (goal === "bulk") return { compoundSets: 4, compoundReps: "6-8", isolationSets: 3, isolationReps: "8-10" };
  return { compoundSets: 3, compoundReps: "8-10", isolationSets: 3, isolationReps: "10-12" };
}

function toExercises(picks: PoolExercise[], scheme: SetRepScheme): TemplateExercise[] {
  return picks.map((p) => ({
    name: p.name,
    sets: p.tier === "compound" ? scheme.compoundSets : scheme.isolationSets,
    reps: p.tier === "compound" ? scheme.compoundReps : scheme.isolationReps,
  }));
}

// How many exercises a single session spends on one subgroup, scaled by
// experience — beginners get fewer total working sets per session so a
// first-timer isn't handed 25 sets on day one.
function volumeFor(level: ExperienceLevel) {
  return level === "beginner" ? { big: 1, small: 1 } : level === "intermediate" ? { big: 2, small: 1 } : { big: 2, small: 2 };
}

function fullBodyDay(label: string, rotation: number, scheme: SetRepScheme, level: ExperienceLevel): TemplateDay {
  const v = volumeFor(level);
  const picks = [
    ...pick("quads", 1, rotation),
    ...pick("hamsGlutes", 1, rotation),
    ...pick("chest", 1, rotation),
    ...pick("backThickness", 1, rotation),
    ...pick("shoulderPress", v.small, rotation),
    ...pick("core", 1, rotation),
  ];
  return { day: label, exercises: toExercises(picks, scheme) };
}

function pushDay(label: string, rotation: number, scheme: SetRepScheme, level: ExperienceLevel): TemplateDay {
  const v = volumeFor(level);
  const picks = [...pick("chest", v.big, rotation), ...pick("shoulderPress", 1, rotation), ...pick("shoulderLateral", v.small, rotation), ...pick("triceps", v.big, rotation)];
  return { day: label, focus: "Chest / Shoulders / Triceps", exercises: toExercises(picks, scheme) };
}

function pullDay(label: string, rotation: number, scheme: SetRepScheme, level: ExperienceLevel): TemplateDay {
  const v = volumeFor(level);
  const picks = [...pick("backWidth", v.big, rotation), ...pick("backThickness", v.big, rotation), ...pick("biceps", v.big, rotation)];
  return { day: label, focus: "Back / Biceps", exercises: toExercises(picks, scheme) };
}

function legsDay(label: string, rotation: number, scheme: SetRepScheme, level: ExperienceLevel): TemplateDay {
  const v = volumeFor(level);
  const picks = [...pick("quads", v.big, rotation), ...pick("hamsGlutes", v.big, rotation), ...pick("calves", v.small, rotation)];
  return { day: label, exercises: toExercises(picks, scheme) };
}

function upperDay(label: string, rotation: number, scheme: SetRepScheme, level: ExperienceLevel): TemplateDay {
  const v = volumeFor(level);
  const picks = [
    ...pick("chest", 1, rotation),
    ...pick("backWidth", 1, rotation),
    ...pick("backThickness", 1, rotation),
    ...pick("shoulderPress", 1, rotation),
    ...pick("biceps", v.small, rotation),
    ...pick("triceps", v.small, rotation),
  ];
  return { day: label, focus: "Upper Body", exercises: toExercises(picks, scheme) };
}

function lowerDay(label: string, rotation: number, scheme: SetRepScheme, level: ExperienceLevel): TemplateDay {
  const v = volumeFor(level);
  const picks = [...pick("quads", v.big, rotation), ...pick("hamsGlutes", v.big, rotation), ...pick("calves", 1, rotation), ...pick("core", 1, rotation)];
  return { day: label, focus: "Lower Body", exercises: toExercises(picks, scheme) };
}

function bodyPartDay(label: string, subgroups: Subgroup[], countEach: number, scheme: SetRepScheme): TemplateDay {
  const picks = subgroups.flatMap((s) => pick(s, countEach));
  return { day: label, exercises: toExercises(picks, scheme) };
}

export type GeneratedPlan = { name: string; scheduleLabel: string; days: TemplateDay[] };

export function generatePlan(input: { goal: FitnessGoalKey; experienceLevel: ExperienceLevel; daysPerWeek: number }): GeneratedPlan {
  const { goal, experienceLevel, daysPerWeek } = input;
  const scheme = schemeFor(goal);
  const d = Math.max(2, Math.min(6, Math.round(daysPerWeek)));

  if (d === 2) {
    return {
      name: "Your Full-Body Plan",
      scheduleLabel: "2 days/week, non-consecutive",
      days: [fullBodyDay("Day A", 0, scheme, experienceLevel), fullBodyDay("Day B", 1, scheme, experienceLevel)],
    };
  }

  if (d === 3 && experienceLevel === "beginner") {
    return {
      name: "Your Full-Body Plan",
      scheduleLabel: "3 days/week, non-consecutive",
      days: [
        fullBodyDay("Day A", 0, scheme, experienceLevel),
        fullBodyDay("Day B", 1, scheme, experienceLevel),
        fullBodyDay("Day C", 2, scheme, experienceLevel),
      ],
    };
  }

  if (d === 3) {
    return {
      name: "Your Push / Pull / Legs Plan",
      scheduleLabel: "3 days/week",
      days: [pushDay("Push", 0, scheme, experienceLevel), pullDay("Pull", 0, scheme, experienceLevel), legsDay("Legs", 0, scheme, experienceLevel)],
    };
  }

  if (d === 4) {
    return {
      name: "Your Upper / Lower Plan",
      scheduleLabel: "4 days/week, Upper/Lower split",
      days: [
        upperDay("Upper A", 0, scheme, experienceLevel),
        lowerDay("Lower A", 0, scheme, experienceLevel),
        upperDay("Upper B", 1, scheme, experienceLevel),
        lowerDay("Lower B", 1, scheme, experienceLevel),
      ],
    };
  }

  if (d === 5 && experienceLevel === "advanced") {
    return {
      name: "Your Body-Part Split",
      scheduleLabel: "5 days/week, one body part per day",
      days: [
        bodyPartDay("Chest", ["chest"], 4, scheme),
        bodyPartDay("Back", ["backWidth", "backThickness"], 2, scheme),
        bodyPartDay("Shoulders", ["shoulderPress", "shoulderLateral"], 2, scheme),
        bodyPartDay("Legs", ["quads", "hamsGlutes", "calves"], 2, scheme),
        bodyPartDay("Arms", ["biceps", "triceps"], 3, scheme),
      ],
    };
  }

  if (d === 5) {
    return {
      name: "Your Push / Pull / Legs + Upper / Lower Plan",
      scheduleLabel: "5 days/week (PPL + Upper/Lower)",
      days: [
        pushDay("Push", 0, scheme, experienceLevel),
        pullDay("Pull", 0, scheme, experienceLevel),
        legsDay("Legs", 0, scheme, experienceLevel),
        upperDay("Upper", 1, scheme, experienceLevel),
        lowerDay("Lower", 1, scheme, experienceLevel),
      ],
    };
  }

  // 6 days
  return {
    name: "Your Push / Pull / Legs Plan (6-Day)",
    scheduleLabel: "6 days/week (Push/Pull/Legs x2)",
    days: [
      pushDay("Push A", 0, scheme, experienceLevel),
      pullDay("Pull A", 0, scheme, experienceLevel),
      legsDay("Legs A", 0, scheme, experienceLevel),
      pushDay("Push B", 1, scheme, experienceLevel),
      pullDay("Pull B", 1, scheme, experienceLevel),
      legsDay("Legs B", 1, scheme, experienceLevel),
    ],
  };
}
