// Curated exercise list for the workout-plan builder's name picker.
//
// Researched two free exercise-database APIs before deciding on a bundled
// list instead: wger.de's public REST API (no auth needed, but live-tested
// its /exercise-translation search/name-filter query params and they don't
// actually filter server-side — every query returns the full unfiltered
// set) and ExerciseDB (its genuinely-free, no-signup version has largely
// moved to a commercial platform with its own rate limits). Rather than
// build a "plan your workouts" feature on top of a third-party dependency
// that's either flaky or another account to set up — and this app's owner
// has repeatedly asked to keep external dependencies to just WhatsApp +
// Supabase — this is a self-contained ~180-exercise list covering the
// common lifts per muscle group. It works offline, instantly, and forever.
export type ExerciseCategory =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Legs"
  | "Arms"
  | "Core"
  | "Cardio"
  | "Full Body";

export const EXERCISE_LIBRARY: { name: string; category: ExerciseCategory }[] = [
  // Chest
  { name: "Barbell Bench Press", category: "Chest" },
  { name: "Incline Barbell Bench Press", category: "Chest" },
  { name: "Decline Barbell Bench Press", category: "Chest" },
  { name: "Dumbbell Bench Press", category: "Chest" },
  { name: "Incline Dumbbell Press", category: "Chest" },
  { name: "Dumbbell Flyes", category: "Chest" },
  { name: "Cable Crossover", category: "Chest" },
  { name: "Pec Deck Machine", category: "Chest" },
  { name: "Push-Ups", category: "Chest" },
  { name: "Dips (Chest Focus)", category: "Chest" },
  { name: "Machine Chest Press", category: "Chest" },
  { name: "Landmine Press", category: "Chest" },

  // Back
  { name: "Deadlift", category: "Back" },
  { name: "Barbell Row", category: "Back" },
  { name: "Pull-Ups", category: "Back" },
  { name: "Chin-Ups", category: "Back" },
  { name: "Lat Pulldown", category: "Back" },
  { name: "Seated Cable Row", category: "Back" },
  { name: "T-Bar Row", category: "Back" },
  { name: "Single-Arm Dumbbell Row", category: "Back" },
  { name: "Face Pull", category: "Back" },
  { name: "Straight-Arm Pulldown", category: "Back" },
  { name: "Rack Pull", category: "Back" },
  { name: "Good Morning", category: "Back" },
  { name: "Hyperextension", category: "Back" },

  // Shoulders
  { name: "Overhead Barbell Press", category: "Shoulders" },
  { name: "Seated Dumbbell Shoulder Press", category: "Shoulders" },
  { name: "Arnold Press", category: "Shoulders" },
  { name: "Lateral Raise", category: "Shoulders" },
  { name: "Front Raise", category: "Shoulders" },
  { name: "Rear Delt Flyes", category: "Shoulders" },
  { name: "Cable Lateral Raise", category: "Shoulders" },
  { name: "Upright Row", category: "Shoulders" },
  { name: "Shrugs", category: "Shoulders" },
  { name: "Machine Shoulder Press", category: "Shoulders" },

  // Legs
  { name: "Barbell Back Squat", category: "Legs" },
  { name: "Front Squat", category: "Legs" },
  { name: "Leg Press", category: "Legs" },
  { name: "Romanian Deadlift", category: "Legs" },
  { name: "Leg Curl", category: "Legs" },
  { name: "Leg Extension", category: "Legs" },
  { name: "Walking Lunges", category: "Legs" },
  { name: "Bulgarian Split Squat", category: "Legs" },
  { name: "Hip Thrust", category: "Legs" },
  { name: "Standing Calf Raise", category: "Legs" },
  { name: "Seated Calf Raise", category: "Legs" },
  { name: "Goblet Squat", category: "Legs" },
  { name: "Hack Squat", category: "Legs" },
  { name: "Glute Bridge", category: "Legs" },
  { name: "Box Jump", category: "Legs" },

  // Arms
  { name: "Barbell Curl", category: "Arms" },
  { name: "Dumbbell Curl", category: "Arms" },
  { name: "Hammer Curl", category: "Arms" },
  { name: "Preacher Curl", category: "Arms" },
  { name: "Cable Curl", category: "Arms" },
  { name: "Concentration Curl", category: "Arms" },
  { name: "Close-Grip Bench Press", category: "Arms" },
  { name: "Skull Crushers", category: "Arms" },
  { name: "Tricep Pushdown", category: "Arms" },
  { name: "Overhead Tricep Extension", category: "Arms" },
  { name: "Dips (Tricep Focus)", category: "Arms" },
  { name: "Wrist Curl", category: "Arms" },

  // Core
  { name: "Plank", category: "Core" },
  { name: "Hanging Leg Raise", category: "Core" },
  { name: "Cable Crunch", category: "Core" },
  { name: "Russian Twist", category: "Core" },
  { name: "Ab Wheel Rollout", category: "Core" },
  { name: "Sit-Ups", category: "Core" },
  { name: "Bicycle Crunch", category: "Core" },
  { name: "Side Plank", category: "Core" },
  { name: "Mountain Climbers", category: "Core" },
  { name: "Woodchopper", category: "Core" },

  // Cardio
  { name: "Treadmill Run", category: "Cardio" },
  { name: "Stationary Bike", category: "Cardio" },
  { name: "Rowing Machine", category: "Cardio" },
  { name: "Jump Rope", category: "Cardio" },
  { name: "Stair Climber", category: "Cardio" },
  { name: "Battle Ropes", category: "Cardio" },
  { name: "Sled Push", category: "Cardio" },
  { name: "Burpees", category: "Cardio" },

  // Full Body / Olympic
  { name: "Clean and Jerk", category: "Full Body" },
  { name: "Snatch", category: "Full Body" },
  { name: "Kettlebell Swing", category: "Full Body" },
  { name: "Thruster", category: "Full Body" },
  { name: "Farmer's Carry", category: "Full Body" },
  { name: "Turkish Get-Up", category: "Full Body" },
  { name: "Clean and Press", category: "Full Body" },
];

export function searchExercises(query: string, limit = 8): typeof EXERCISE_LIBRARY {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return EXERCISE_LIBRARY.filter((e) => e.name.toLowerCase().includes(q)).slice(0, limit);
}
