import type { FitnessGoalKey } from "@/frontend/lib/bmiMacro";

export type TemplateExercise = { name: string; sets: number; reps: string; notes?: string };
export type TemplateDay = { day: string; focus?: string; exercises: TemplateExercise[] };
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type WorkoutTemplate = {
  id: string;
  name: string;
  tagline: string;
  schedule: string;
  days: TemplateDay[];
  // Metadata used only by the fitness-onboarding wizard's recommendation
  // matching (workoutRecommendation.ts) — every template still works exactly
  // as before when dropped straight into the planner by hand, this is purely
  // additive. goal mirrors bmiMacro.ts's cut/maintain/bulk so one goal
  // answer drives both the calorie target and the plan match.
  goal: FitnessGoalKey;
  level: ExperienceLevel;
  daysPerWeek: number;
};

// Pre-built, research-backed starting points a member can drop straight
// into the planner and customize — not a substitute for the exercise
// autocomplete, just a faster starting point than a blank plan.
export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: "beginner-full-body",
    name: "Beginner — Full Body",
    tagline: "Learn the fundamental lifts fast by repeating them 3x/week instead of waiting a full week between attempts.",
    schedule: "3 days/week, non-consecutive (e.g. Mon/Wed/Fri)",
    goal: "maintain",
    level: "beginner",
    daysPerWeek: 3,
    days: [
      {
        day: "Day A",
        exercises: [
          { name: "Goblet Squat", sets: 3, reps: "10-12" },
          { name: "Barbell Bench Press", sets: 3, reps: "10-12", notes: "Dumbbell also fine" },
          { name: "Seated Cable Row", sets: 3, reps: "10-12" },
          { name: "Plank", sets: 3, reps: "30-45s" },
        ],
      },
      {
        day: "Day B",
        exercises: [
          { name: "Leg Press", sets: 3, reps: "10-12" },
          { name: "Incline Dumbbell Press", sets: 3, reps: "10-12" },
          { name: "Lat Pulldown", sets: 3, reps: "10-12" },
          { name: "Dead Bug", sets: 3, reps: "10-12" },
        ],
      },
      {
        day: "Day C",
        exercises: [
          { name: "Romanian Deadlift", sets: 3, reps: "10-12" },
          { name: "Overhead Barbell Press", sets: 3, reps: "10-12" },
          { name: "Pull-Ups", sets: 3, reps: "10-12", notes: "Use an assisted machine or band if needed" },
          { name: "Side Plank", sets: 3, reps: "30-45s per side" },
        ],
      },
    ],
  },
  {
    id: "cardio-conditioning",
    name: "Cardio / Conditioning",
    tagline: "Heart-rate-zone training, not random treadmill time — steady-state and intervals mixed for real cardiovascular gains.",
    schedule: "2-3 days/week, standalone or after strength days",
    goal: "cut",
    level: "beginner",
    daysPerWeek: 3,
    days: [
      {
        day: "Steady-State",
        exercises: [
          {
            name: "Treadmill Run",
            sets: 1,
            reps: "25-30 min",
            notes: "Zone 2 pace — bike/elliptical/rower all work too, rotate weekly. You should still be able to hold a conversation.",
          },
        ],
      },
      {
        day: "Intervals",
        exercises: [
          {
            name: "Jump Rope",
            sets: 1,
            reps: "8-10 rounds",
            notes: "5 min warm-up walk, then rounds of 30s hard effort + 90s walk recovery, then 5 min cool-down.",
          },
        ],
      },
      {
        day: "Incline Walk",
        exercises: [
          {
            name: "Incline Treadmill Walk",
            sets: 1,
            reps: "20-25 min",
            notes: "8-12% incline, moderate pace — low-impact, high calorie burn.",
          },
        ],
      },
    ],
  },
  {
    id: "weight-loss-circuit",
    name: "Weight Loss / Fat Loss",
    tagline: "Strength moves with minimal rest — burns more during the session and keeps burning after, while preserving muscle better than cardio alone.",
    schedule: "3-4 days/week, circuit format",
    goal: "cut",
    level: "beginner",
    daysPerWeek: 4,
    days: [
      {
        day: "Full-Body Circuit",
        focus: "Repeat 3-4 rounds, 1-2 min rest between rounds — about 25-30 min total",
        exercises: [
          { name: "Goblet Squat", sets: 4, reps: "40s work / 20s rest" },
          { name: "Push-Ups", sets: 4, reps: "40s work / 20s rest", notes: "Incline push-ups if needed" },
          { name: "Romanian Deadlift", sets: 4, reps: "40s work / 20s rest", notes: "Dumbbell" },
          { name: "Mountain Climbers", sets: 4, reps: "40s work / 20s rest" },
          { name: "Single-Arm Dumbbell Row", sets: 4, reps: "40s work / 20s rest" },
          { name: "Jump Rope", sets: 4, reps: "40s work / 20s rest", notes: "Jumping jacks also fine" },
        ],
      },
    ],
  },
  {
    id: "body-recomposition",
    name: "Body Recomposition",
    tagline: "Build muscle and lose fat at once — upper/lower split hits each muscle group twice a week, paired with strategic cardio.",
    schedule: "4 days/week, Upper/Lower split",
    goal: "maintain",
    level: "intermediate",
    daysPerWeek: 4,
    days: [
      {
        day: "Day 1",
        focus: "Upper (Strength)",
        exercises: [
          { name: "Barbell Bench Press", sets: 3, reps: "8-10" },
          { name: "Barbell Row", sets: 3, reps: "8-10" },
          { name: "Overhead Barbell Press", sets: 3, reps: "8-10" },
          { name: "Lat Pulldown", sets: 3, reps: "8-10" },
          { name: "Barbell Curl", sets: 3, reps: "8-10" },
          { name: "Tricep Pushdown", sets: 3, reps: "8-10" },
        ],
      },
      {
        day: "Day 2",
        focus: "Lower (Strength)",
        exercises: [
          { name: "Barbell Back Squat", sets: 3, reps: "8-10" },
          { name: "Romanian Deadlift", sets: 3, reps: "8-10" },
          { name: "Leg Press", sets: 3, reps: "8-10" },
          { name: "Leg Curl", sets: 3, reps: "8-10" },
          { name: "Standing Calf Raise", sets: 3, reps: "8-10" },
        ],
      },
      {
        day: "Day 3",
        focus: "Upper (Hypertrophy) + 15 min HIIT",
        exercises: [
          { name: "Incline Dumbbell Press", sets: 3, reps: "12-15" },
          { name: "Seated Cable Row", sets: 3, reps: "12-15" },
          { name: "Lateral Raise", sets: 3, reps: "12-15" },
          { name: "Face Pull", sets: 3, reps: "12-15" },
        ],
      },
      {
        day: "Day 4",
        focus: "Lower (Hypertrophy) + 20 min LISS",
        exercises: [
          { name: "Bulgarian Split Squat", sets: 3, reps: "12-15" },
          { name: "Leg Extension", sets: 3, reps: "12-15" },
          { name: "Hip Thrust", sets: 3, reps: "12-15" },
          { name: "Standing Calf Raise", sets: 3, reps: "12-15" },
        ],
      },
    ],
  },
  {
    id: "ppl-3day",
    name: "Push / Pull / Legs (3-Day)",
    tagline: "The classic hypertrophy split, organized by movement role — one full cycle per week.",
    schedule: "3 days/week",
    goal: "bulk",
    level: "intermediate",
    daysPerWeek: 3,
    days: [
      {
        day: "Push",
        focus: "Chest / Shoulders / Triceps",
        exercises: [
          { name: "Barbell Bench Press", sets: 4, reps: "8-12" },
          { name: "Overhead Barbell Press", sets: 3, reps: "8-12" },
          { name: "Incline Dumbbell Press", sets: 3, reps: "8-12" },
          { name: "Lateral Raise", sets: 3, reps: "8-12" },
          { name: "Tricep Pushdown", sets: 3, reps: "8-12" },
        ],
      },
      {
        day: "Pull",
        focus: "Back / Biceps",
        exercises: [
          { name: "Deadlift", sets: 4, reps: "8-12" },
          { name: "Lat Pulldown", sets: 3, reps: "8-12", notes: "Pull-ups also fine" },
          { name: "Barbell Row", sets: 3, reps: "8-12" },
          { name: "Face Pull", sets: 3, reps: "8-12" },
          { name: "Barbell Curl", sets: 3, reps: "8-12" },
        ],
      },
      {
        day: "Legs",
        exercises: [
          { name: "Barbell Back Squat", sets: 4, reps: "8-12" },
          { name: "Romanian Deadlift", sets: 3, reps: "8-12" },
          { name: "Leg Press", sets: 3, reps: "8-12" },
          { name: "Leg Curl", sets: 3, reps: "8-12" },
          { name: "Standing Calf Raise", sets: 3, reps: "8-12" },
        ],
      },
    ],
  },
  {
    id: "ppl-6day",
    name: "Push / Pull / Legs (6-Day)",
    tagline: "Same split, run twice a week — for advanced or regular lifters who can handle the extra frequency and volume.",
    schedule: "6 days/week (Push/Pull/Legs x2)",
    goal: "bulk",
    level: "advanced",
    daysPerWeek: 6,
    days: [
      {
        day: "Push A",
        focus: "Chest / Shoulders / Triceps",
        exercises: [
          { name: "Barbell Bench Press", sets: 4, reps: "8-12" },
          { name: "Overhead Barbell Press", sets: 3, reps: "8-12" },
          { name: "Incline Dumbbell Press", sets: 3, reps: "8-12" },
          { name: "Lateral Raise", sets: 3, reps: "8-12" },
          { name: "Tricep Pushdown", sets: 3, reps: "8-12" },
        ],
      },
      {
        day: "Pull A",
        focus: "Back / Biceps",
        exercises: [
          { name: "Deadlift", sets: 4, reps: "8-12" },
          { name: "Lat Pulldown", sets: 3, reps: "8-12" },
          { name: "Barbell Row", sets: 3, reps: "8-12" },
          { name: "Face Pull", sets: 3, reps: "8-12" },
          { name: "Barbell Curl", sets: 3, reps: "8-12" },
        ],
      },
      {
        day: "Legs A",
        exercises: [
          { name: "Barbell Back Squat", sets: 4, reps: "8-12" },
          { name: "Romanian Deadlift", sets: 3, reps: "8-12" },
          { name: "Leg Press", sets: 3, reps: "8-12" },
          { name: "Leg Curl", sets: 3, reps: "8-12" },
          { name: "Standing Calf Raise", sets: 3, reps: "8-12" },
        ],
      },
      {
        day: "Push B",
        focus: "Chest / Shoulders / Triceps",
        exercises: [
          { name: "Barbell Bench Press", sets: 4, reps: "8-12" },
          { name: "Overhead Barbell Press", sets: 3, reps: "8-12" },
          { name: "Incline Dumbbell Press", sets: 3, reps: "8-12" },
          { name: "Lateral Raise", sets: 3, reps: "8-12" },
          { name: "Tricep Pushdown", sets: 3, reps: "8-12" },
        ],
      },
      {
        day: "Pull B",
        focus: "Back / Biceps",
        exercises: [
          { name: "Deadlift", sets: 4, reps: "8-12" },
          { name: "Lat Pulldown", sets: 3, reps: "8-12" },
          { name: "Barbell Row", sets: 3, reps: "8-12" },
          { name: "Face Pull", sets: 3, reps: "8-12" },
          { name: "Barbell Curl", sets: 3, reps: "8-12" },
        ],
      },
      {
        day: "Legs B",
        exercises: [
          { name: "Barbell Back Squat", sets: 4, reps: "8-12" },
          { name: "Romanian Deadlift", sets: 3, reps: "8-12" },
          { name: "Leg Press", sets: 3, reps: "8-12" },
          { name: "Leg Curl", sets: 3, reps: "8-12" },
          { name: "Standing Calf Raise", sets: 3, reps: "8-12" },
        ],
      },
    ],
  },
  {
    id: "5x5-strength",
    name: "5x5 Strength (StrongLifts-Style)",
    tagline: "A simple barbell program built around five main lifts — add a little weight each session for steady strength gains.",
    schedule: "3 days/week, alternating Workout A / B (never the same session twice in a row)",
    goal: "bulk",
    level: "beginner",
    daysPerWeek: 3,
    days: [
      {
        day: "Workout A",
        exercises: [
          { name: "Barbell Back Squat", sets: 5, reps: "5" },
          { name: "Barbell Bench Press", sets: 5, reps: "5" },
          { name: "Barbell Row", sets: 5, reps: "5" },
        ],
      },
      {
        day: "Workout B",
        exercises: [
          { name: "Barbell Back Squat", sets: 5, reps: "5" },
          { name: "Overhead Barbell Press", sets: 5, reps: "5" },
          { name: "Deadlift", sets: 1, reps: "5", notes: "Just one heavy work set after warming up" },
        ],
      },
    ],
  },
  {
    id: "bro-split",
    name: "Bro Split",
    tagline: "One muscle group per day, high volume per session — popular with advanced bodybuilders who train each muscle once a week.",
    schedule: "5 days/week, one body part per day",
    goal: "bulk",
    level: "advanced",
    daysPerWeek: 5,
    days: [
      {
        day: "Monday",
        focus: "Chest",
        exercises: [
          { name: "Barbell Bench Press", sets: 4, reps: "8-12" },
          { name: "Incline Dumbbell Press", sets: 3, reps: "8-12" },
          { name: "Dumbbell Flyes", sets: 3, reps: "10-15" },
          { name: "Cable Crossover", sets: 3, reps: "10-15" },
        ],
      },
      {
        day: "Tuesday",
        focus: "Back",
        exercises: [
          { name: "Deadlift", sets: 4, reps: "6-10" },
          { name: "Pull-Ups", sets: 3, reps: "8-12" },
          { name: "Barbell Row", sets: 3, reps: "8-12" },
          { name: "Seated Cable Row", sets: 3, reps: "10-15" },
        ],
      },
      {
        day: "Wednesday",
        focus: "Shoulders",
        exercises: [
          { name: "Overhead Barbell Press", sets: 4, reps: "8-12" },
          { name: "Lateral Raise", sets: 3, reps: "12-15" },
          { name: "Rear Delt Flyes", sets: 3, reps: "12-15" },
          { name: "Shrugs", sets: 3, reps: "10-15" },
        ],
      },
      {
        day: "Thursday",
        focus: "Legs",
        exercises: [
          { name: "Barbell Back Squat", sets: 4, reps: "8-12" },
          { name: "Leg Press", sets: 3, reps: "10-15" },
          { name: "Romanian Deadlift", sets: 3, reps: "8-12" },
          { name: "Leg Curl", sets: 3, reps: "10-15" },
          { name: "Standing Calf Raise", sets: 4, reps: "12-15" },
        ],
      },
      {
        day: "Friday",
        focus: "Arms",
        exercises: [
          { name: "Barbell Curl", sets: 3, reps: "8-12" },
          { name: "Hammer Curl", sets: 3, reps: "10-15" },
          { name: "Close-Grip Bench Press", sets: 3, reps: "8-12" },
          { name: "Tricep Pushdown", sets: 3, reps: "10-15" },
        ],
      },
    ],
  },
  {
    id: "full-body-2day",
    name: "Full Body — 2 Day",
    tagline: "Only two days to spare a week? Two full-body sessions still hit every major muscle twice as often as a once-a-week split — a genuinely research-backed minimum-effective-dose option, not a compromise.",
    schedule: "2 days/week, non-consecutive (e.g. Tue/Fri)",
    goal: "maintain",
    level: "beginner",
    daysPerWeek: 2,
    days: [
      {
        day: "Day A",
        exercises: [
          { name: "Barbell Back Squat", sets: 3, reps: "8-10" },
          { name: "Barbell Bench Press", sets: 3, reps: "8-10" },
          { name: "Lat Pulldown", sets: 3, reps: "10-12" },
          { name: "Romanian Deadlift", sets: 2, reps: "10-12" },
          { name: "Plank", sets: 3, reps: "30-45s" },
        ],
      },
      {
        day: "Day B",
        exercises: [
          { name: "Leg Press", sets: 3, reps: "10-12" },
          { name: "Incline Dumbbell Press", sets: 3, reps: "8-12" },
          { name: "Seated Cable Row", sets: 3, reps: "10-12" },
          { name: "Overhead Barbell Press", sets: 2, reps: "8-10" },
          { name: "Dead Bug", sets: 3, reps: "10-12" },
        ],
      },
    ],
  },
  {
    id: "upper-lower-4day",
    name: "Upper / Lower (4-Day)",
    tagline: "Straight hypertrophy volume, no cardio prescribed — each muscle group trained twice a week across four sessions, for anyone whose only goal is to add size.",
    schedule: "4 days/week, Upper/Lower split (e.g. Mon/Tue rest Thu/Fri)",
    goal: "bulk",
    level: "intermediate",
    daysPerWeek: 4,
    days: [
      {
        day: "Day 1",
        focus: "Upper",
        exercises: [
          { name: "Barbell Bench Press", sets: 4, reps: "6-10" },
          { name: "Barbell Row", sets: 4, reps: "6-10" },
          { name: "Overhead Barbell Press", sets: 3, reps: "8-12" },
          { name: "Lat Pulldown", sets: 3, reps: "8-12" },
          { name: "Barbell Curl", sets: 3, reps: "10-12" },
          { name: "Tricep Pushdown", sets: 3, reps: "10-12" },
        ],
      },
      {
        day: "Day 2",
        focus: "Lower",
        exercises: [
          { name: "Barbell Back Squat", sets: 4, reps: "6-10" },
          { name: "Romanian Deadlift", sets: 3, reps: "8-12" },
          { name: "Leg Press", sets: 3, reps: "10-12" },
          { name: "Leg Curl", sets: 3, reps: "10-12" },
          { name: "Standing Calf Raise", sets: 4, reps: "12-15" },
        ],
      },
      {
        day: "Day 3",
        focus: "Upper",
        exercises: [
          { name: "Incline Dumbbell Press", sets: 4, reps: "8-12" },
          { name: "Seated Cable Row", sets: 4, reps: "8-12" },
          { name: "Lateral Raise", sets: 3, reps: "12-15" },
          { name: "Face Pull", sets: 3, reps: "12-15" },
          { name: "Hammer Curl", sets: 3, reps: "10-15" },
          { name: "Close-Grip Bench Press", sets: 3, reps: "10-12" },
        ],
      },
      {
        day: "Day 4",
        focus: "Lower",
        exercises: [
          { name: "Bulgarian Split Squat", sets: 3, reps: "10-12" },
          { name: "Hip Thrust", sets: 3, reps: "10-12" },
          { name: "Leg Extension", sets: 3, reps: "12-15" },
          { name: "Leg Curl", sets: 3, reps: "12-15" },
          { name: "Standing Calf Raise", sets: 4, reps: "12-15" },
        ],
      },
    ],
  },
];
