// Single source of truth for the BMI/BMR/TDEE/macro math — previously lived
// only inline inside CalculatorForm.tsx's `results` useMemo. Pulled out so
// the dashboard BMI tile and the fitness-onboarding wizard's results screen
// compute the exact same numbers from the exact same formula instead of a
// second hand-rolled copy silently drifting from the first.
export type Gender = "male" | "female";

export type BmiMacroInput = {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
  /** TDEE multiplier, e.g. 1.2 / 1.45 / 1.65 — see ACTIVITY_LEVELS. */
  activityMultiplier: number;
  /** kcal/day offset from TDEE — negative for a cut, positive for a bulk. */
  goalOffset: number;
};

export type BmiMacroResult = {
  bmi: number;
  bmiTag: "UNDERWEIGHT" | "NORMAL / OPTIMAL" | "OVERWEIGHT" | "OBESE";
  bmr: number;
  tdee: number;
  targetCalories: number;
  restCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
};

export function bmiTagFor(bmi: number): BmiMacroResult["bmiTag"] {
  if (bmi < 18.5) return "UNDERWEIGHT";
  if (bmi >= 30) return "OBESE";
  if (bmi >= 25) return "OVERWEIGHT";
  return "NORMAL / OPTIMAL";
}

// Mifflin-St Jeor (see project notes — chosen over Katch-McArdle since the
// app collects no body-fat %, which Katch-McArdle needs to actually beat
// Mifflin-St Jeor's accuracy).
export function calculateBmiMacro(input: BmiMacroInput): BmiMacroResult {
  const { weightKg: w, heightCm: height, age: a, gender, activityMultiplier, goalOffset } = input;
  const heightInMeters = height / 100;
  const bmi = w / (heightInMeters * heightInMeters);

  const bmr = gender === "male" ? 10 * w + 6.25 * height - 5 * a + 5 : 10 * w + 6.25 * height - 5 * a - 161;

  const tdee = Math.round(bmr * activityMultiplier);
  const targetCalories = tdee + goalOffset;
  const restCalories = Math.round(tdee * 0.9);

  const proteinGrams = Math.round(w * 2.15);
  const proteinCalories = proteinGrams * 4;

  const fatCalories = targetCalories * 0.25;
  const fatsGrams = Math.round(fatCalories / 9);

  const carbCalories = Math.max(0, targetCalories - (proteinCalories + fatCalories));
  const carbsGrams = Math.round(carbCalories / 4);

  return {
    bmi: Math.round(bmi * 10) / 10,
    bmiTag: bmiTagFor(bmi),
    bmr: Math.round(bmr),
    tdee,
    targetCalories,
    restCalories,
    proteinGrams,
    carbsGrams,
    fatsGrams,
  };
}

export function ftInToCm(feet: number, inches: number): number {
  return feet * 30.48 + inches * 2.54;
}

export type ActivityLevel = { value: number; label: string; hint: string };
export const ACTIVITY_LEVELS: ActivityLevel[] = [
  { value: 1.2, label: "Sedentary / Desk Work", hint: "Little to no movement" },
  { value: 1.45, label: "Moderate Lifter", hint: "3-4 training sessions" },
  { value: 1.65, label: "Heavy Iron Lifter", hint: "5-6 days resistance & compounds" },
];

export type FitnessGoalKey = "cut" | "maintain" | "bulk";
export type GoalOption = { value: number; key: FitnessGoalKey; label: string; hint: string; kcalLabel: string };
export const GOAL_OPTIONS: GoalOption[] = [
  { value: -500, key: "cut", label: "Fat Loss / Aggressive Cut", hint: "Deficit preserving lean mass", kcalLabel: "-500 KCAL" },
  { value: 0, key: "maintain", label: "Strength Maintenance / Recomp", hint: "Fuel compound progress", kcalLabel: "MAINTAIN" },
  { value: 350, key: "bulk", label: "Lean Muscle Hypertrophy / Bulk", hint: "Surplus for power growth", kcalLabel: "+350 KCAL" },
];
