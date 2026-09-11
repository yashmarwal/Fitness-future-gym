export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "moderate" | "heavy";
export type Goal = "cut" | "maintain" | "bulk";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  moderate: 1.45,
  heavy: 1.65,
};

const GOAL_CALORIE_ADJUSTMENT: Record<Goal, number> = {
  cut: -500,
  maintain: 0,
  bulk: 350,
};

export function calculateBmi(weightKg: number, heightCm: number) {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  let category: "Underweight" | "Normal" | "Overweight" | "Obese";
  if (bmi < 18.5) category = "Underweight";
  else if (bmi < 25) category = "Normal";
  else if (bmi < 30) category = "Overweight";
  else category = "Obese";

  return { bmi: Math.round(bmi * 10) / 10, category };
}

// Mifflin-St Jeor basal metabolic rate.
function calculateBmr(weightKg: number, heightCm: number, age: number, gender: Gender) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

export function calculateMacros(params: {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: Goal;
}) {
  const { weightKg, heightCm, age, gender, activityLevel, goal } = params;

  const bmr = calculateBmr(weightKg, heightCm, age, gender);
  const maintenanceCalories = bmr * ACTIVITY_MULTIPLIERS[activityLevel];
  const targetCalories = Math.round(maintenanceCalories + GOAL_CALORIE_ADJUSTMENT[goal]);

  const proteinG = Math.round(weightKg * 2.2);
  const fatG = Math.round(weightKg * 0.8);
  const remainingCalories = targetCalories - proteinG * 4 - fatG * 9;
  const carbsG = Math.max(0, Math.round(remainingCalories / 4));

  return { targetCalories, proteinG, carbsG, fatG };
}
