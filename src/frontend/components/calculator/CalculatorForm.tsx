"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import gsap from "gsap";

export default function CalculatorForm() {
  const [weight, setWeight] = useState<number | "">(74);
  const [heightFt, setHeightFt] = useState<number | "">(5);
  const [heightIn, setHeightIn] = useState<number | "">(9);
  const [age, setAge] = useState<number | "">(26);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [activity, setActivity] = useState(1.65);
  const [goal, setGoal] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(
        formRef.current.children,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: "power2.out" }
      );
    }
  }, []);

  const results = useMemo(() => {
    const w = weight === "" ? 74 : weight;
    const ft = heightFt === "" ? 5 : heightFt;
    const inches = heightIn === "" ? 9 : heightIn;
    const a = age === "" ? 26 : age;

    const height = ft * 30.48 + inches * 2.54; // ft/in -> cm, for the formulas below
    const heightInMeters = height / 100;
    const bmi = w / (heightInMeters * heightInMeters);

    let bmiTag = "NORMAL / OPTIMAL";
    if (bmi < 18.5) bmiTag = "UNDERWEIGHT";
    else if (bmi >= 25 && bmi < 29.9) bmiTag = "OVERWEIGHT";
    else if (bmi >= 30) bmiTag = "OBESE";

    const bmr =
      gender === "male"
        ? 10 * w + 6.25 * height - 5 * a + 5
        : 10 * w + 6.25 * height - 5 * a - 161;

    const tdee = Math.round(bmr * activity);
    const targetCalories = tdee + Number(goal);
    const restCalories = Math.round(tdee * 0.9);

    const proteinGrams = Math.round(w * 2.15);
    const proteinCalories = proteinGrams * 4;

    const fatCalories = targetCalories * 0.25;
    const fatsGrams = Math.round(fatCalories / 9);

    const carbCalories = Math.max(0, targetCalories - (proteinCalories + fatCalories));
    const carbsGrams = Math.round(carbCalories / 4);

    return {
      bmi: bmi.toFixed(1),
      bmiTag,
      tdee: targetCalories.toLocaleString("en-IN"),
      restCalories: restCalories.toLocaleString("en-IN"),
      proteinGrams,
      carbsGrams,
      fatsGrams,
    };
  }, [weight, heightFt, heightIn, age, gender, activity, goal]);

  return (
    <div ref={formRef} className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
      {/* Parameters Panel */}
      <div className="lg:col-span-5 bg-surface-container-low p-space-xl shadow-hard border border-surface-variant/40">
        <div className="flex items-center justify-between pb-space-sm mb-space-lg border-b border-surface-variant/40">
          <span className="font-title-md text-title-md uppercase text-on-surface">
            01 / Athlete Parameters
          </span>
          <span className="font-label-sm text-label-sm uppercase px-space-xs py-space-2xs bg-surface text-tertiary">
            ISO UNITS (KG / FT-IN)
          </span>
        </div>

        <div className="flex flex-col gap-space-md">
          {/* Weight & Height */}
          <div className="grid grid-cols-2 gap-space-md">
            <div>
              <label className="block font-label-md text-label-md uppercase text-tertiary mb-space-2xs">
                Body Weight (kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={35}
                  max={220}
                  step={0.5}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-surface-container-lowest text-on-surface font-headline-sm text-headline-sm px-space-md py-space-sm outline-none focus:bg-surface-variant transition-colors border border-surface-variant/40"
                />
                <span className="absolute right-space-md top-1/2 -translate-y-1/2 font-label-md text-label-md text-outline">
                  KG
                </span>
              </div>
            </div>

            <div>
              <label className="block font-label-md text-label-md uppercase text-tertiary mb-space-2xs">
                Height (ft / in)
              </label>
              <div className="flex gap-space-2xs">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={3}
                    max={8}
                    value={heightFt}
                    onChange={(e) => setHeightFt(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-surface-container-lowest text-on-surface font-headline-sm text-headline-sm pl-space-md pr-space-lg py-space-sm outline-none focus:bg-surface-variant transition-colors border border-surface-variant/40"
                  />
                  <span className="absolute right-space-sm top-1/2 -translate-y-1/2 font-label-md text-label-md text-outline">
                    FT
                  </span>
                </div>
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={0}
                    max={11}
                    value={heightIn}
                    onChange={(e) => setHeightIn(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-surface-container-lowest text-on-surface font-headline-sm text-headline-sm pl-space-md pr-space-lg py-space-sm outline-none focus:bg-surface-variant transition-colors border border-surface-variant/40"
                  />
                  <span className="absolute right-space-sm top-1/2 -translate-y-1/2 font-label-md text-label-md text-outline">
                    IN
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Age & Gender */}
          <div className="grid grid-cols-2 gap-space-md">
            <div>
              <label className="block font-label-md text-label-md uppercase text-tertiary mb-space-2xs">
                Age
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={14}
                  max={90}
                  value={age}
                  onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-surface-container-lowest text-on-surface font-headline-sm text-headline-sm px-space-md py-space-sm outline-none focus:bg-surface-variant transition-colors border border-surface-variant/40"
                />
                <span className="absolute right-space-md top-1/2 -translate-y-1/2 font-label-md text-label-md text-outline">
                  YRS
                </span>
              </div>
            </div>

            <div>
              <label className="block font-label-md text-label-md uppercase text-tertiary mb-space-2xs">
                Gender
              </label>
              <div className="grid grid-cols-2 gap-space-2xs">
                <button
                  type="button"
                  onClick={() => setGender("male")}
                  className={`py-space-sm font-label-md text-label-md uppercase text-center transition-all cursor-pointer ${
                    gender === "male"
                      ? "bg-primary-container text-on-primary-container font-bold"
                      : "bg-surface-container-lowest text-tertiary hover:text-on-surface border border-surface-variant/40"
                  }`}
                >
                  MALE
                </button>
                <button
                  type="button"
                  onClick={() => setGender("female")}
                  className={`py-space-sm font-label-md text-label-md uppercase text-center transition-all cursor-pointer ${
                    gender === "female"
                      ? "bg-primary-container text-on-primary-container font-bold"
                      : "bg-surface-container-lowest text-tertiary hover:text-on-surface border border-surface-variant/40"
                  }`}
                >
                  FEMALE
                </button>
              </div>
            </div>
          </div>

          {/* Activity Multiplier */}
          <div className="pt-space-xs">
            <label className="block font-label-md text-label-md uppercase text-tertiary mb-space-2xs">
              Weekly Activity Multiplier
            </label>
            <div className="flex flex-col gap-space-xs">
              <button
                type="button"
                onClick={() => setActivity(1.2)}
                className={`text-left p-space-sm flex items-center justify-between transition-colors border ${
                  activity === 1.2
                    ? "bg-surface-container border-primary-container"
                    : "bg-surface-container-lowest border-surface-variant/40 hover:bg-surface-container"
                }`}
              >
                <div>
                  <span
                    className={`block font-title-sm text-title-sm uppercase ${
                      activity === 1.2 ? "text-primary-container font-bold" : "text-on-surface"
                    }`}
                  >
                    Sedentary / Desk Work
                  </span>
                  <span className="block font-body-sm text-body-sm text-tertiary">Little to no movement</span>
                </div>
                <span
                  className={`font-label-md text-label-md ${
                    activity === 1.2 ? "text-primary-container font-bold" : "text-outline"
                  }`}
                >
                  1.2x
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActivity(1.45)}
                className={`text-left p-space-sm flex items-center justify-between transition-colors border ${
                  activity === 1.45
                    ? "bg-surface-container border-primary-container"
                    : "bg-surface-container-lowest border-surface-variant/40 hover:bg-surface-container"
                }`}
              >
                <div>
                  <span
                    className={`block font-title-sm text-title-sm uppercase ${
                      activity === 1.45 ? "text-primary-container font-bold" : "text-on-surface"
                    }`}
                  >
                    Moderate Lifter
                  </span>
                  <span className="block font-body-sm text-body-sm text-tertiary">3–4 Training Sessions</span>
                </div>
                <span
                  className={`font-label-md text-label-md ${
                    activity === 1.45 ? "text-primary-container font-bold" : "text-outline"
                  }`}
                >
                  1.45x
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActivity(1.65)}
                className={`text-left p-space-sm flex items-center justify-between transition-colors border ${
                  activity === 1.65
                    ? "bg-surface-container border-primary-container"
                    : "bg-surface-container-lowest border-surface-variant/40 hover:bg-surface-container"
                }`}
              >
                <div>
                  <span
                    className={`block font-title-sm text-title-sm uppercase ${
                      activity === 1.65 ? "text-primary-container font-bold" : "text-on-surface"
                    }`}
                  >
                    Heavy Iron Lifter
                  </span>
                  <span className="block font-body-sm text-body-sm text-tertiary">
                    5–6 Days Resistance &amp; Compounds
                  </span>
                </div>
                <span
                  className={`font-label-md text-label-md ${
                    activity === 1.65 ? "text-primary-container font-bold" : "text-outline"
                  }`}
                >
                  1.65x
                </span>
              </button>
            </div>
          </div>

          {/* Goal Selector */}
          <div className="pt-space-xs">
            <label className="block font-label-md text-label-md uppercase text-tertiary mb-space-2xs">
              Primary Training Goal
            </label>
            <div className="flex flex-col gap-space-xs">
              <label
                className={`cursor-pointer p-space-sm flex items-center justify-between border transition-colors ${
                  goal === -500
                    ? "bg-surface-container border-primary-container"
                    : "bg-surface-container-lowest border-surface-variant/40 hover:bg-surface-container"
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <input
                    type="radio"
                    name="goal"
                    value={-500}
                    checked={goal === -500}
                    onChange={() => setGoal(-500)}
                    className="accent-primary-container"
                  />
                  <div>
                    <span
                      className={`font-title-sm text-title-sm uppercase block ${
                        goal === -500 ? "text-primary-container font-bold" : "text-on-surface"
                      }`}
                    >
                      Fat Loss / Aggressive Cut
                    </span>
                    <span className="font-body-sm text-body-sm text-tertiary">Deficit preserving lean mass</span>
                  </div>
                </div>
                <span className="font-label-md text-label-md text-error-container font-bold">-500 KCAL</span>
              </label>

              <label
                className={`cursor-pointer p-space-sm flex items-center justify-between border transition-colors ${
                  goal === 0
                    ? "bg-surface-container border-primary-container"
                    : "bg-surface-container-lowest border-surface-variant/40 hover:bg-surface-container"
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <input
                    type="radio"
                    name="goal"
                    value={0}
                    checked={goal === 0}
                    onChange={() => setGoal(0)}
                    className="accent-primary-container"
                  />
                  <div>
                    <span
                      className={`font-title-sm text-title-sm uppercase block ${
                        goal === 0 ? "text-primary-container font-bold" : "text-on-surface"
                      }`}
                    >
                      Strength Maintenance / Recomp
                    </span>
                    <span className="font-body-sm text-body-sm text-tertiary">Fuel compound progress</span>
                  </div>
                </div>
                <span className="font-label-md text-label-md text-on-surface">MAINTAIN</span>
              </label>

              <label
                className={`cursor-pointer p-space-sm flex items-center justify-between border transition-colors ${
                  goal === 350
                    ? "bg-surface-container border-primary-container"
                    : "bg-surface-container-lowest border-surface-variant/40 hover:bg-surface-container"
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <input
                    type="radio"
                    name="goal"
                    value={350}
                    checked={goal === 350}
                    onChange={() => setGoal(350)}
                    className="accent-primary-container"
                  />
                  <div>
                    <span
                      className={`font-title-sm text-title-sm uppercase block ${
                        goal === 350 ? "text-primary-container font-bold" : "text-on-surface"
                      }`}
                    >
                      Lean Muscle Hypertrophy / Bulk
                    </span>
                    <span className="font-body-sm text-body-sm text-tertiary">Surplus for power growth</span>
                  </div>
                </div>
                <span className="font-label-md text-label-md text-primary-container font-bold">+350 KCAL</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Calculated Results Display */}
      <div className="lg:col-span-7 flex flex-col gap-space-lg">
        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          {/* BMI */}
          <div className="bg-surface-container-low p-space-xl flex flex-col justify-between shadow-hard border border-surface-variant/40">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md uppercase text-outline">Metric 01 // Body Index</span>
                <span className="px-space-xs py-space-2xs bg-surface-container-highest text-primary-container font-label-sm text-label-sm uppercase font-bold tracking-widest">
                  {results.bmiTag}
                </span>
              </div>
              <div className="mt-space-md flex items-baseline gap-space-xs">
                <span className="font-display-xl text-display-xl text-primary-container leading-none">
                  {results.bmi}
                </span>
                <span className="font-headline-sm text-headline-sm text-tertiary">BMI</span>
              </div>
            </div>
            <div className="mt-space-lg pt-space-md">
              <div className="grid grid-cols-[25%_40%_35%] text-label-sm font-label-sm uppercase text-outline mb-space-2xs">
                <span className="text-left">Under (18.5)</span>
                <span className="text-center text-primary-container font-bold">Optimal (18.5-24.9)</span>
                <span className="text-right">Over (25.0+)</span>
              </div>
              <div className="w-full h-2 bg-surface-container-lowest overflow-hidden grid grid-cols-[25%_40%_35%]">
                <div className="h-full bg-surface-container-highest"></div>
                <div className="h-full bg-primary-container"></div>
                <div className="h-full bg-surface-container-highest"></div>
              </div>
            </div>
          </div>

          {/* Calories */}
          <div className="bg-surface-container p-space-xl flex flex-col justify-between shadow-hard border border-surface-variant/40">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md uppercase text-outline">Metric 02 // Energy Budget</span>
                <span className="flex items-center gap-space-2xs text-primary-container font-label-sm text-label-sm uppercase font-bold">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
                  ACTIVE RECOVERY
                </span>
              </div>
              <div className="mt-space-md">
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-display-xl text-display-xl text-on-surface font-bold leading-none">
                    {results.tdee}
                  </span>
                  <span className="font-headline-sm text-headline-sm text-primary-container">KCAL</span>
                </div>
                <p className="font-label-sm text-label-sm uppercase tracking-wider text-outline mt-space-2xs">
                  DAILY TARGET ALLOCATION
                </p>
              </div>
            </div>
            <div className="mt-space-lg pt-space-md flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm border-t border-surface-variant/30">
              <span>Rest Day Budget: <strong className="text-on-surface">{results.restCalories} kcal</strong></span>
              <span className="material-symbols-outlined text-title-sm text-outline">info</span>
            </div>
          </div>
        </div>

        {/* Macro Distribution Cards */}
        <div className="bg-surface-container-low p-space-xl shadow-hard border border-surface-variant/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs pb-space-sm mb-space-lg border-b border-surface-variant/40">
            <span className="font-title-md text-title-md uppercase text-on-surface">
              02 / Daily Macro Target Distribution
            </span>
            <span className="font-label-sm text-label-sm uppercase text-tertiary">
              Progressive Overload Calibrated
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            <div className="bg-surface-container p-space-md flex flex-col justify-between border border-surface-variant/30">
              <div>
                <div className="flex justify-between items-center mb-space-xs">
                  <span className="font-label-md text-label-md uppercase tracking-wider text-primary-container font-bold">
                    PROTEIN
                  </span>
                  <span className="font-label-sm text-label-sm uppercase text-outline">4 kcal/g</span>
                </div>
                <div className="flex items-baseline gap-space-2xs">
                  <span className="font-display-lg text-display-lg text-on-surface leading-none">
                    {results.proteinGrams}
                  </span>
                  <span className="font-headline-sm text-headline-sm text-primary-container">G</span>
                </div>
                <p className="font-label-sm text-label-sm text-tertiary uppercase mt-space-xs">
                  ~2.15g / kg Body Weight
                </p>
              </div>
              <div className="mt-space-md pt-space-sm bg-surface-container-lowest p-space-xs text-body-sm font-body-sm text-on-surface-variant border border-surface-variant/30">
                <span className="block font-label-sm text-label-sm text-outline uppercase font-semibold">Sources</span>
                Eggs, Paneer, Chicken, Soya Chunks, Whey Isolate.
              </div>
            </div>

            <div className="bg-surface-container p-space-md flex flex-col justify-between border border-surface-variant/30">
              <div>
                <div className="flex justify-between items-center mb-space-xs">
                  <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface font-bold">
                    CARBS
                  </span>
                  <span className="font-label-sm text-label-sm uppercase text-outline">4 kcal/g</span>
                </div>
                <div className="flex items-baseline gap-space-2xs">
                  <span className="font-display-lg text-display-lg text-on-surface leading-none">
                    {results.carbsGrams}
                  </span>
                  <span className="font-headline-sm text-headline-sm text-outline">G</span>
                </div>
                <p className="font-label-sm text-label-sm text-tertiary uppercase mt-space-xs">
                  Glycogen Re-load
                </p>
              </div>
              <div className="mt-space-md pt-space-sm bg-surface-container-lowest p-space-xs text-body-sm font-body-sm text-on-surface-variant border border-surface-variant/30">
                <span className="block font-label-sm text-label-sm text-outline uppercase font-semibold">Sources</span>
                Oats, Brown Rice, Roti, Sweet Potato, Bananas.
              </div>
            </div>

            <div className="bg-surface-container p-space-md flex flex-col justify-between border border-surface-variant/30">
              <div>
                <div className="flex justify-between items-center mb-space-xs">
                  <span className="font-label-md text-label-md uppercase tracking-wider text-tertiary font-bold">
                    FATS
                  </span>
                  <span className="font-label-sm text-label-sm uppercase text-outline">9 kcal/g</span>
                </div>
                <div className="flex items-baseline gap-space-2xs">
                  <span className="font-display-lg text-display-lg text-on-surface leading-none">
                    {results.fatsGrams}
                  </span>
                  <span className="font-headline-sm text-headline-sm text-outline">G</span>
                </div>
                <p className="font-label-sm text-label-sm text-tertiary uppercase mt-space-xs">
                  Hormonal Function
                </p>
              </div>
              <div className="mt-space-md pt-space-sm bg-surface-container-lowest p-space-xs text-body-sm font-body-sm text-on-surface-variant border border-surface-variant/30">
                <span className="block font-label-sm text-label-sm text-outline uppercase font-semibold">Sources</span>
                Almonds, Desi Ghee, Peanut Butter, Whole Eggs.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
