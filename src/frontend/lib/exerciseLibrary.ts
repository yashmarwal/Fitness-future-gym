// Curated exercise list for the workout-plan builder's name picker AND the
// Muscle Progress XP system's exercise→muscle-group matching.
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
// Supabase — this is a self-contained exercise list covering the common
// lifts per muscle group. It works offline, instantly, and forever.
//
// `aliases` covers the common shorthand/slang a member is likely to actually
// type into the free-text workout logger (WorkoutLogForm.tsx has no
// autocomplete/validation — "Bench Press", "Flat Bench", "BB Bench" are all
// valid, different strings for the same lift) so matchExerciseCategory below
// can still resolve a muscle group for XP purposes, same alias-list pattern
// already used in indianFoodLibrary.ts for food-name spelling variants.
export type ExerciseCategory =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Legs"
  | "Arms"
  | "Core"
  | "Cardio"
  | "Full Body";

export type ExerciseEntry = {
  name: string;
  category: ExerciseCategory;
  aliases?: string[];
};

export const EXERCISE_LIBRARY: ExerciseEntry[] = [
  // Chest
  { name: "Barbell Bench Press", category: "Chest", aliases: ["bench press", "bench", "barbell bench", "bb bench", "flat bench", "flat bench press"] },
  { name: "Incline Barbell Bench Press", category: "Chest", aliases: ["incline bench", "incline bench press", "incline barbell bench", "incline bb bench"] },
  { name: "Decline Barbell Bench Press", category: "Chest", aliases: ["decline bench", "decline bench press", "decline barbell bench"] },
  { name: "Dumbbell Bench Press", category: "Chest", aliases: ["db bench", "dumbbell bench", "dumbbell bench press", "db chest press"] },
  { name: "Incline Dumbbell Press", category: "Chest", aliases: ["incline db press", "incline dumbbell bench", "incline dumbbell press"] },
  { name: "Dumbbell Flyes", category: "Chest", aliases: ["db flyes", "dumbbell fly", "chest fly", "flyes", "db fly"] },
  { name: "Cable Crossover", category: "Chest", aliases: ["cable fly", "cable crossover", "crossover", "cable chest fly"] },
  { name: "Pec Deck Machine", category: "Chest", aliases: ["pec deck", "pec fly machine", "machine fly"] },
  { name: "Push-Ups", category: "Chest", aliases: ["pushups", "push ups", "push-up"] },
  { name: "Dips (Chest Focus)", category: "Chest", aliases: ["chest dips", "dips chest"] },
  { name: "Machine Chest Press", category: "Chest", aliases: ["chest press machine", "machine press chest"] },
  { name: "Landmine Press", category: "Chest", aliases: ["landmine chest press"] },

  // Back
  { name: "Deadlift", category: "Back", aliases: ["conventional deadlift", "dl", "barbell deadlift", "deadlifts"] },
  { name: "Barbell Row", category: "Back", aliases: ["bent over row", "bb row", "barbell bent over row", "bent-over row"] },
  { name: "Pull-Ups", category: "Back", aliases: ["pullups", "pull ups", "pull-up", "wide grip pullup"] },
  { name: "Chin-Ups", category: "Back", aliases: ["chinups", "chin ups", "chin-up"] },
  { name: "Lat Pulldown", category: "Back", aliases: ["pulldown", "lat pull down", "cable pulldown"] },
  { name: "Seated Cable Row", category: "Back", aliases: ["cable row", "seated row", "seated cable row machine"] },
  { name: "T-Bar Row", category: "Back", aliases: ["tbar row", "t bar row"] },
  { name: "Single-Arm Dumbbell Row", category: "Back", aliases: ["db row", "one arm row", "single arm row", "dumbbell row"] },
  { name: "Face Pull", category: "Back", aliases: ["face pulls", "cable face pull"] },
  { name: "Straight-Arm Pulldown", category: "Back", aliases: ["straight arm pulldown", "rope pulldown back"] },
  { name: "Rack Pull", category: "Back", aliases: ["rack pulls"] },
  { name: "Good Morning", category: "Back", aliases: ["good mornings", "gm"] },
  { name: "Hyperextension", category: "Back", aliases: ["hyperextensions", "back extension", "back extensions"] },

  // Shoulders
  { name: "Overhead Barbell Press", category: "Shoulders", aliases: ["ohp", "overhead press", "military press", "barbell shoulder press", "standing press", "shoulder press"] },
  { name: "Seated Dumbbell Shoulder Press", category: "Shoulders", aliases: ["db shoulder press", "seated db press", "dumbbell shoulder press"] },
  { name: "Arnold Press", category: "Shoulders", aliases: ["arnold presses"] },
  { name: "Lateral Raise", category: "Shoulders", aliases: ["side raise", "lateral raises", "db lateral raise", "side lateral raise"] },
  { name: "Front Raise", category: "Shoulders", aliases: ["front raises", "db front raise"] },
  { name: "Rear Delt Flyes", category: "Shoulders", aliases: ["rear delt fly", "reverse fly", "rear delt raise"] },
  { name: "Cable Lateral Raise", category: "Shoulders", aliases: ["cable side raise", "cable lateral"] },
  { name: "Upright Row", category: "Shoulders", aliases: ["upright rows"] },
  { name: "Shrugs", category: "Shoulders", aliases: ["shrug", "barbell shrug", "dumbbell shrug", "trap shrug"] },
  { name: "Machine Shoulder Press", category: "Shoulders", aliases: ["shoulder press machine"] },

  // Legs
  { name: "Barbell Back Squat", category: "Legs", aliases: ["squat", "squats", "back squat", "bb squat", "barbell squat"] },
  { name: "Front Squat", category: "Legs", aliases: ["front squats"] },
  { name: "Leg Press", category: "Legs", aliases: ["leg press machine"] },
  { name: "Romanian Deadlift", category: "Legs", aliases: ["rdl", "romanian deadlifts", "stiff leg deadlift"] },
  { name: "Leg Curl", category: "Legs", aliases: ["hamstring curl", "lying leg curl", "seated leg curl"] },
  { name: "Leg Extension", category: "Legs", aliases: ["quad extension", "leg extensions"] },
  { name: "Walking Lunges", category: "Legs", aliases: ["lunges", "walking lunge", "db lunges"] },
  { name: "Bulgarian Split Squat", category: "Legs", aliases: ["split squat", "bulgarian squat"] },
  { name: "Hip Thrust", category: "Legs", aliases: ["hip thrusts", "barbell hip thrust"] },
  { name: "Standing Calf Raise", category: "Legs", aliases: ["calf raise", "standing calf raises", "calf raises"] },
  { name: "Seated Calf Raise", category: "Legs", aliases: ["seated calf raises"] },
  { name: "Goblet Squat", category: "Legs", aliases: ["goblet squats"] },
  { name: "Hack Squat", category: "Legs", aliases: ["hack squat machine"] },
  { name: "Glute Bridge", category: "Legs", aliases: ["glute bridges", "bodyweight hip thrust"] },
  { name: "Box Jump", category: "Legs", aliases: ["box jumps"] },

  // Arms
  { name: "Barbell Curl", category: "Arms", aliases: ["bb curl", "barbell bicep curl", "bicep curl barbell"] },
  { name: "Dumbbell Curl", category: "Arms", aliases: ["db curl", "dumbbell bicep curl", "bicep curl", "biceps curl", "curls"] },
  { name: "Hammer Curl", category: "Arms", aliases: ["hammer curls", "db hammer curl"] },
  { name: "Preacher Curl", category: "Arms", aliases: ["preacher curls"] },
  { name: "Cable Curl", category: "Arms", aliases: ["cable bicep curl"] },
  { name: "Concentration Curl", category: "Arms", aliases: ["concentration curls"] },
  { name: "Close-Grip Bench Press", category: "Arms", aliases: ["close grip bench", "cgbp", "close grip bench press"] },
  { name: "Skull Crushers", category: "Arms", aliases: ["skullcrushers", "lying tricep extension", "french press"] },
  { name: "Tricep Pushdown", category: "Arms", aliases: ["pushdown", "tricep pressdown", "rope pushdown", "cable pushdown", "triceps pushdown"] },
  { name: "Overhead Tricep Extension", category: "Arms", aliases: ["overhead extension", "tricep extension overhead", "db overhead extension"] },
  { name: "Dips (Tricep Focus)", category: "Arms", aliases: ["tricep dips", "dips triceps", "dips"] },
  { name: "Wrist Curl", category: "Arms", aliases: ["wrist curls", "forearm curl"] },

  // Core
  { name: "Plank", category: "Core", aliases: ["planks", "plank hold"] },
  { name: "Hanging Leg Raise", category: "Core", aliases: ["leg raises", "hanging leg raises", "knee raise"] },
  { name: "Cable Crunch", category: "Core", aliases: ["cable crunches", "kneeling cable crunch"] },
  { name: "Russian Twist", category: "Core", aliases: ["russian twists"] },
  { name: "Ab Wheel Rollout", category: "Core", aliases: ["ab rollout", "ab wheel", "wheel rollout"] },
  { name: "Sit-Ups", category: "Core", aliases: ["situps", "sit ups", "sit-up", "crunches", "crunch"] },
  { name: "Bicycle Crunch", category: "Core", aliases: ["bicycle crunches"] },
  { name: "Side Plank", category: "Core", aliases: ["side planks"] },
  { name: "Mountain Climbers", category: "Core", aliases: ["mountain climber"] },
  { name: "Woodchopper", category: "Core", aliases: ["wood chopper", "cable woodchopper", "woodchoppers"] },
  { name: "Dead Bug", category: "Core", aliases: ["dead bugs"] },

  // Cardio
  { name: "Treadmill Run", category: "Cardio", aliases: ["treadmill", "running", "run", "jogging"] },
  { name: "Stationary Bike", category: "Cardio", aliases: ["cycling", "cycle", "spin bike", "exercise bike"] },
  { name: "Rowing Machine", category: "Cardio", aliases: ["rowing", "row machine", "erg"] },
  { name: "Jump Rope", category: "Cardio", aliases: ["skipping", "rope skipping", "skipping rope"] },
  { name: "Jumping Jacks", category: "Cardio", aliases: ["jumping jack"] },
  { name: "Stair Climber", category: "Cardio", aliases: ["stairmaster", "stair master", "stepper"] },
  { name: "Elliptical Trainer", category: "Cardio", aliases: ["elliptical", "cross trainer"] },
  { name: "Incline Treadmill Walk", category: "Cardio", aliases: ["incline walk", "treadmill walk", "incline walking"] },
  { name: "Battle Ropes", category: "Cardio", aliases: ["battle rope", "rope slams"] },
  { name: "Sled Push", category: "Cardio", aliases: ["sled pushes", "prowler push", "prowler"] },
  { name: "Burpees", category: "Cardio", aliases: ["burpee"] },

  // Full Body / Olympic
  { name: "Clean and Jerk", category: "Full Body", aliases: ["clean & jerk", "clean and jerks"] },
  { name: "Snatch", category: "Full Body", aliases: ["snatches"] },
  { name: "Kettlebell Swing", category: "Full Body", aliases: ["kb swing", "kettlebell swings"] },
  { name: "Thruster", category: "Full Body", aliases: ["thrusters"] },
  { name: "Farmer's Carry", category: "Full Body", aliases: ["farmers carry", "farmer carry", "farmers walk"] },
  { name: "Turkish Get-Up", category: "Full Body", aliases: ["turkish getup", "tgu"] },
  { name: "Clean and Press", category: "Full Body", aliases: ["clean & press"] },
];

export function searchExercises(query: string, limit = 8): { name: string; category: ExerciseCategory }[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return EXERCISE_LIBRARY.filter((e) => e.name.toLowerCase().includes(q)).slice(0, limit);
}

// Resolves any free-text exercise name (whatever a member actually typed
// into WorkoutLogForm.tsx, which has no autocomplete) to a muscle-group
// category for XP purposes — same exact/starts-with/contains ranking used
// by nutritionLookup.ts's searchLocalFoods for the food-name alias list.
// Returns null on no match at all (a genuine typo or a custom exercise
// name), which callers treat as "don't award XP for this entry" rather than
// guessing wrong.
export function matchExerciseCategory(query: string): ExerciseCategory | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  let best: { rank: number; category: ExerciseCategory } | null = null;
  for (const exercise of EXERCISE_LIBRARY) {
    const candidates = [exercise.name, ...(exercise.aliases ?? [])];
    for (const candidate of candidates) {
      const lower = candidate.toLowerCase();
      const rank =
        lower === q ? 0 : lower.startsWith(q) || q.startsWith(lower) ? 1 : lower.includes(q) || q.includes(lower) ? 2 : -1;
      if (rank === -1) continue;
      if (!best || rank < best.rank) best = { rank, category: exercise.category };
    }
  }
  return best?.category ?? null;
}
