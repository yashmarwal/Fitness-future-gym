"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  calculateBmiMacro,
  ftInToCm,
  ACTIVITY_LEVELS,
  GOAL_OPTIONS,
  type Gender,
  type BmiMacroResult,
} from "@/frontend/lib/bmiMacro";
import { recommendTemplate } from "@/frontend/lib/workoutRecommendation";
import { generatePlan, type GeneratedPlan } from "@/frontend/lib/exerciseSplits";
import type { ExperienceLevel, WorkoutTemplate } from "@/frontend/lib/workoutTemplates";
import type { FitnessProfile } from "@/backend/services/fitnessProfile";

// Handoff key for a freshly generated plan (see generatePlan) — the planner
// page (WorkoutPlanner.tsx) reads this once on mount when it sees
// ?generated=1, then clears it. sessionStorage rather than a query param
// because a full plan's JSON is too large to comfortably round-trip through
// a URL, and rather than a database write because this is still a preview
// the member hasn't confirmed saving yet (see feedback: preview, then one
// tap to confirm, same as picking a hand-built template).
const GENERATED_PLAN_KEY = "ff_generated_plan";

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string; hint: string }[] = [
  { value: "beginner", label: "New To Training", hint: "Never followed a structured program" },
  { value: "intermediate", label: "Some Experience", hint: "6+ months of regular training" },
  { value: "advanced", label: "Advanced", hint: "2+ years, comfortable with the main barbell lifts" },
];

const DAYS_OPTIONS = [2, 3, 4, 5, 6];

const TOTAL_STEPS = 6; // welcome, body, activity, goal, experience, days — results is step 6 (index 6), not counted in the bar

type StepId = 0 | 1 | 2 | 3 | 4 | 5 | 6;

function isValidHeightWeight(weight: number | "", ft: number | "", inches: number | "", age: number | ""): boolean {
  return weight !== "" && weight >= 35 && weight <= 220 && ft !== "" && ft >= 3 && ft <= 8 && inches !== "" && inches >= 0 && inches <= 11 && age !== "" && age >= 14 && age <= 90;
}

// A full-screen, step-by-step wizard — deliberately NOT under the dashboard
// chrome (see /onboarding/page.tsx, a top-level route like /login and
// /signup, not /dashboard/onboarding) so it reads as its own guided flow
// rather than a form squeezed under the usual header/tab bar. Every number
// it produces comes from the same pure, offline calculateBmiMacro() the
// public calculator and the dashboard BMI tile use, and the plan match
// comes from the bundled template library (workoutRecommendation.ts) — no
// AI, no network call for the actual recommendation, only the final save.
export default function FitnessOnboardingWizard({ initialProfile }: { initialProfile: FitnessProfile | null }) {
  const router = useRouter();
  const [step, setStep] = useState<StepId>(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const [weightKg, setWeightKg] = useState<number | "">(initialProfile?.weightKg ?? "");
  const [heightFt, setHeightFt] = useState<number | "">(initialProfile ? Math.floor(initialProfile.heightCm / 30.48) : "");
  const [heightIn, setHeightIn] = useState<number | "">(
    initialProfile ? Math.round((initialProfile.heightCm / 2.54) % 12) : ""
  );
  const [age, setAge] = useState<number | "">(initialProfile?.age ?? "");
  const [gender, setGender] = useState<Gender>(initialProfile?.gender ?? "male");
  const [activityMultiplier, setActivityMultiplier] = useState<number>(initialProfile?.activityMultiplier ?? 1.45);
  const [goalOffset, setGoalOffset] = useState<number | null>(initialProfile?.goalOffset ?? null);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(initialProfile?.experienceLevel ?? null);
  const [daysPerWeek, setDaysPerWeek] = useState<number>(initialProfile?.daysPerWeek ?? 3);

  const [results, setResults] = useState<BmiMacroResult | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [templateAlternates, setTemplateAlternates] = useState<WorkoutTemplate[]>([]);
  const [showAlternates, setShowAlternates] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const savedOnceRef = useRef(false);

  function go(next: StepId) {
    setDirection(next > step ? "forward" : "back");
    setStep(next);
  }

  function skipToDashboard() {
    router.push("/dashboard");
  }

  // Fires the moment the member reaches the results step — every input
  // needed is already collected by then, so there's no reason to make them
  // tap a separate "Save" button on top of "Next" (see feedback: this step
  // auto-saves, best-effort, and shows the results regardless of whether
  // the save actually succeeds). savedOnceRef guards against React
  // re-invoking this effect twice for the same arrival (dev-mode Strict
  // Mode) without recomputing/re-POSTing twice — it's reset by the "Back"
  // button below specifically so tapping Back, changing an earlier answer
  // (e.g. days/week), and returning here recomputes fresh instead of
  // silently showing the first pass's now-stale plan and BMI.
  useEffect(() => {
    if (step !== 6 || savedOnceRef.current) return;
    savedOnceRef.current = true;

    const goal = GOAL_OPTIONS.find((g) => g.value === goalOffset) ?? GOAL_OPTIONS[1];
    const heightCm = ftInToCm(Number(heightFt), Number(heightIn));
    const r = calculateBmiMacro({
      weightKg: Number(weightKg),
      heightCm,
      age: Number(age),
      gender,
      activityMultiplier,
      goalOffset: goal.value,
    });
    setResults(r);
    const level = experienceLevel ?? "beginner";
    setGeneratedPlan(generatePlan({ goal: goal.key, experienceLevel: level, daysPerWeek }));
    // The hand-built template library, offered as an alternative to the
    // generated plan rather than the main event now — its top 2 matches.
    const templateMatch = recommendTemplate({ goal: goal.key, experienceLevel: level, daysPerWeek });
    setTemplateAlternates([templateMatch.primary, ...templateMatch.alternates].slice(0, 2));

    const profile: FitnessProfile = {
      heightCm,
      weightKg: Number(weightKg),
      age: Number(age),
      gender,
      activityMultiplier,
      goalOffset: goal.value,
      goalKey: goal.key,
      experienceLevel: experienceLevel ?? "beginner",
      daysPerWeek,
      completedAt: new Date().toISOString(),
    };

    setSaveState("saving");
    fetch("/api/dashboard/fitness-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    })
      .then((res) => setSaveState(res.ok ? "saved" : "error"))
      .catch(() => setSaveState("error"));
    // Deliberately only depends on `step` — every value it reads is already
    // final by the time step 6 is reached, and re-running this on every
    // keystroke of an earlier step (which changing the dependency array
    // would do) is not what "fires once, on arrival" means.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <div className="px-gutter-mobile lg:px-gutter-desktop pt-[max(1rem,env(safe-area-inset-top))] pb-3 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-1" aria-hidden={step === 6}>
          {step < 6 &&
            Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <span key={i} className={`h-1 flex-1 transition-colors ${i <= step ? "bg-primary-container" : "bg-surface-container-high"}`} />
            ))}
        </div>
        {step < 6 && (
          <button
            type="button"
            onClick={skipToDashboard}
            className="shrink-0 font-label text-[10px] uppercase tracking-wider text-tertiary hover:text-on-surface transition-colors"
          >
            Skip
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col px-gutter-mobile lg:px-gutter-desktop pb-8 max-w-md mx-auto w-full">
        {step === 0 && <WelcomeStep key={0} onStart={() => go(1)} onSkip={skipToDashboard} direction={direction} />}

        {step === 1 && (
          <BodyStep
            key={1}
            weightKg={weightKg}
            setWeightKg={setWeightKg}
            heightFt={heightFt}
            setHeightFt={setHeightFt}
            heightIn={heightIn}
            setHeightIn={setHeightIn}
            age={age}
            setAge={setAge}
            gender={gender}
            setGender={setGender}
            onBack={() => go(0)}
            onNext={() => go(2)}
            direction={direction}
          />
        )}

        {step === 2 && (
          <ActivityStep
            key={2}
            activityMultiplier={activityMultiplier}
            setActivityMultiplier={setActivityMultiplier}
            onBack={() => go(1)}
            onNext={() => go(3)}
            direction={direction}
          />
        )}

        {step === 3 && (
          <GoalStep key={3} goalOffset={goalOffset} setGoalOffset={setGoalOffset} onBack={() => go(2)} onNext={() => go(4)} direction={direction} />
        )}

        {step === 4 && (
          <ExperienceStep
            key={4}
            experienceLevel={experienceLevel}
            setExperienceLevel={setExperienceLevel}
            onBack={() => go(3)}
            onNext={() => go(5)}
            direction={direction}
          />
        )}

        {step === 5 && (
          <DaysStep key={5} daysPerWeek={daysPerWeek} setDaysPerWeek={setDaysPerWeek} onBack={() => go(4)} onNext={() => go(6)} direction={direction} />
        )}

        {step === 6 && results && generatedPlan && (
          <ResultsStep
            results={results}
            generatedPlan={generatedPlan}
            templateAlternates={templateAlternates}
            showAlternates={showAlternates}
            setShowAlternates={setShowAlternates}
            saveState={saveState}
            onBack={() => {
              // Allow the results effect to recompute + re-save on the next
              // arrival, in case the member changes an earlier answer
              // before coming back (see the effect's own comment).
              savedOnceRef.current = false;
              go(5);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ---- Shared step chrome ----------------------------------------------

function StepShell({
  icon,
  eyebrow,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
  direction,
}: {
  icon: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  direction: "forward" | "back";
}) {
  return (
    <div className={`flex-1 flex flex-col ${direction === "forward" ? "animate-suggest-in-up" : "animate-suggest-in"}`}>
      <span className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary-container text-on-primary-container shadow-soft mb-5 shrink-0">
        <span className="material-symbols-outlined text-2xl leading-none">{icon}</span>
      </span>
      <p className="font-label text-[11px] uppercase tracking-[0.2em] text-primary-container font-bold mb-1">{eyebrow}</p>
      <h1 className="font-display text-3xl text-on-surface uppercase tracking-wide leading-tight mb-2">{title}</h1>
      <p className="font-body text-sm text-tertiary mb-6">{subtitle}</p>

      <div className="flex-1 flex flex-col gap-2.5">{children}</div>

      <div className="flex items-center gap-3 mt-8 pt-4 border-t border-surface-variant/30">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-xl leading-none">chevron_left</span>
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="flex-1 flex items-center justify-center gap-2 bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3.5 rounded-xl shadow-soft transition-colors active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
        >
          {nextLabel}
          <span className="material-symbols-outlined text-lg leading-none">chevron_right</span>
        </button>
      </div>
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  title,
  hint,
  trailing,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  hint: string;
  trailing?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-4 rounded-xl flex items-center justify-between gap-3 border transition-colors ${
        selected ? "bg-surface-container border-primary-container" : "bg-surface-container-lowest border-surface-variant/40 hover:bg-surface-container"
      }`}
    >
      <div>
        <span className={`block font-label text-sm uppercase tracking-wide ${selected ? "text-primary-container font-bold" : "text-on-surface"}`}>
          {title}
        </span>
        <span className="block font-body text-xs text-tertiary mt-0.5">{hint}</span>
      </div>
      {trailing && (
        <span className={`shrink-0 font-label text-xs ${selected ? "text-primary-container font-bold" : "text-outline"}`}>{trailing}</span>
      )}
    </button>
  );
}

// ---- Steps --------------------------------------------------------------

function WelcomeStep({ onStart, onSkip, direction }: { onStart: () => void; onSkip: () => void; direction: "forward" | "back" }) {
  return (
    <div className={`flex-1 flex flex-col ${direction === "forward" ? "animate-suggest-in-up" : "animate-suggest-in"}`}>
      <span className="w-16 h-16 rounded-2xl flex items-center justify-center bg-primary-container text-on-primary-container shadow-soft mb-6 animate-snap-pop">
        <span className="material-symbols-outlined text-3xl leading-none">auto_awesome</span>
      </span>
      <p className="font-label text-[11px] uppercase tracking-[0.2em] text-primary-container font-bold mb-1">Welcome</p>
      <h1 className="font-display text-4xl text-on-surface uppercase tracking-wide leading-none mb-3">Let&apos;s Build Your Plan</h1>
      <p className="font-body text-sm text-tertiary mb-8">
        Answer a few quick questions about your body and your goal — about a minute — and we&apos;ll work out your daily calorie target and
        match you to a real workout plan from our library.
      </p>

      <div className="flex flex-col gap-2 mb-8">
        {[
          { icon: "accessibility_new", label: "Your body stats" },
          { icon: "stars", label: "Your goal" },
          { icon: "workspace_premium", label: "Your personalized plan" },
        ].map((s, i) => (
          <div key={s.label} className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3">
            <span className="w-7 h-7 rounded-full flex items-center justify-center bg-surface-container-high text-primary-container shrink-0 font-label text-xs font-bold">
              {i + 1}
            </span>
            <span className="material-symbols-outlined text-lg leading-none text-tertiary">{s.icon}</span>
            <span className="font-label text-xs uppercase tracking-wide text-on-surface">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="flex-1" />

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onStart}
          className="flex items-center justify-center gap-2 bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3.5 rounded-xl shadow-soft transition-colors active:scale-[0.98]"
        >
          Get Started
          <span className="material-symbols-outlined text-lg leading-none">chevron_right</span>
        </button>
        <button type="button" onClick={onSkip} className="font-label text-xs uppercase tracking-wider text-tertiary hover:text-on-surface transition-colors">
          Skip for now
        </button>
      </div>
    </div>
  );
}

function BodyStep(props: {
  weightKg: number | "";
  setWeightKg: (v: number | "") => void;
  heightFt: number | "";
  setHeightFt: (v: number | "") => void;
  heightIn: number | "";
  setHeightIn: (v: number | "") => void;
  age: number | "";
  setAge: (v: number | "") => void;
  gender: Gender;
  setGender: (v: Gender) => void;
  onBack: () => void;
  onNext: () => void;
  direction: "forward" | "back";
}) {
  const { weightKg, setWeightKg, heightFt, setHeightFt, heightIn, setHeightIn, age, setAge, gender, setGender, onBack, onNext, direction } = props;
  const valid = isValidHeightWeight(weightKg, heightFt, heightIn, age);

  return (
    <StepShell
      icon="accessibility_new"
      eyebrow="Step 1 of 5"
      title="Your Body"
      subtitle="Used only to calculate your BMI and calorie target — nothing here is shared or shown to anyone else."
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!valid}
      direction={direction}
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block font-label text-[10px] uppercase tracking-wide text-tertiary mb-1">Weight (kg)</span>
          <input
            type="number"
            inputMode="decimal"
            min={35}
            max={220}
            step={0.5}
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full rounded-xl bg-surface-container-lowest text-on-surface font-display text-xl px-3 py-2.5 outline-none focus:bg-surface-container border border-surface-variant/40"
          />
        </label>
        <label className="block">
          <span className="block font-label text-[10px] uppercase tracking-wide text-tertiary mb-1">Age</span>
          <input
            type="number"
            inputMode="numeric"
            min={14}
            max={90}
            value={age}
            onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full rounded-xl bg-surface-container-lowest text-on-surface font-display text-xl px-3 py-2.5 outline-none focus:bg-surface-container border border-surface-variant/40"
          />
        </label>
      </div>

      <label className="block">
        <span className="block font-label text-[10px] uppercase tracking-wide text-tertiary mb-1">Height</span>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              min={3}
              max={8}
              value={heightFt}
              onChange={(e) => setHeightFt(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-xl bg-surface-container-lowest text-on-surface font-display text-xl pl-3 pr-9 py-2.5 outline-none focus:bg-surface-container border border-surface-variant/40"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-label text-[10px] text-outline">FT</span>
          </div>
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={11}
              value={heightIn}
              onChange={(e) => setHeightIn(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-xl bg-surface-container-lowest text-on-surface font-display text-xl pl-3 pr-9 py-2.5 outline-none focus:bg-surface-container border border-surface-variant/40"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-label text-[10px] text-outline">IN</span>
          </div>
        </div>
      </label>

      <div>
        <span className="block font-label text-[10px] uppercase tracking-wide text-tertiary mb-1">Gender</span>
        <div className="grid grid-cols-2 gap-2">
          {(["male", "female"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`py-2.5 rounded-xl font-label text-xs uppercase tracking-wide text-center transition-colors ${
                gender === g ? "bg-primary-container text-on-primary-container font-bold" : "bg-surface-container-lowest text-tertiary hover:text-on-surface border border-surface-variant/40"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </StepShell>
  );
}

function ActivityStep({
  activityMultiplier,
  setActivityMultiplier,
  onBack,
  onNext,
  direction,
}: {
  activityMultiplier: number;
  setActivityMultiplier: (v: number) => void;
  onBack: () => void;
  onNext: () => void;
  direction: "forward" | "back";
}) {
  return (
    <StepShell
      icon="directions_run"
      eyebrow="Step 2 of 5"
      title="Your Activity"
      subtitle="How much you move in a typical week, outside of the gym plan we're about to build."
      onBack={onBack}
      onNext={onNext}
      direction={direction}
    >
      {ACTIVITY_LEVELS.map((a) => (
        <OptionCard
          key={a.value}
          selected={activityMultiplier === a.value}
          onClick={() => setActivityMultiplier(a.value)}
          title={a.label}
          hint={a.hint}
          trailing={`${a.value}x`}
        />
      ))}
    </StepShell>
  );
}

function GoalStep({
  goalOffset,
  setGoalOffset,
  onBack,
  onNext,
  direction,
}: {
  goalOffset: number | null;
  setGoalOffset: (v: number) => void;
  onBack: () => void;
  onNext: () => void;
  direction: "forward" | "back";
}) {
  return (
    <StepShell
      icon="stars"
      eyebrow="Step 3 of 5"
      title="Your Goal"
      subtitle="This sets both your daily calorie target and which workout plan we recommend."
      onBack={onBack}
      onNext={onNext}
      nextDisabled={goalOffset === null}
      direction={direction}
    >
      {GOAL_OPTIONS.map((g) => (
        <OptionCard key={g.value} selected={goalOffset === g.value} onClick={() => setGoalOffset(g.value)} title={g.label} hint={g.hint} trailing={g.kcalLabel} />
      ))}
    </StepShell>
  );
}

function ExperienceStep({
  experienceLevel,
  setExperienceLevel,
  onBack,
  onNext,
  direction,
}: {
  experienceLevel: ExperienceLevel | null;
  setExperienceLevel: (v: ExperienceLevel) => void;
  onBack: () => void;
  onNext: () => void;
  direction: "forward" | "back";
}) {
  return (
    <StepShell
      icon="military_tech"
      eyebrow="Step 4 of 5"
      title="Your Experience"
      subtitle="So the plan we pick actually matches what you can handle right now."
      onBack={onBack}
      onNext={onNext}
      nextDisabled={experienceLevel === null}
      direction={direction}
    >
      {EXPERIENCE_OPTIONS.map((e) => (
        <OptionCard key={e.value} selected={experienceLevel === e.value} onClick={() => setExperienceLevel(e.value)} title={e.label} hint={e.hint} />
      ))}
    </StepShell>
  );
}

function DaysStep({
  daysPerWeek,
  setDaysPerWeek,
  onBack,
  onNext,
  direction,
}: {
  daysPerWeek: number;
  setDaysPerWeek: (v: number) => void;
  onBack: () => void;
  onNext: () => void;
  direction: "forward" | "back";
}) {
  return (
    <StepShell
      icon="event_note"
      eyebrow="Step 5 of 5"
      title="Days Per Week"
      subtitle="How many days can you realistically train? Honest beats ambitious — you can always change plans later."
      onBack={onBack}
      onNext={onNext}
      nextLabel="See My Plan"
      direction={direction}
    >
      <div className="grid grid-cols-5 gap-2">
        {DAYS_OPTIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDaysPerWeek(d)}
            className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors ${
              daysPerWeek === d ? "bg-primary-container text-on-primary-container font-bold" : "bg-surface-container-lowest text-tertiary hover:text-on-surface border border-surface-variant/40"
            }`}
          >
            <span className="font-display text-xl leading-none">{d}</span>
            <span className="font-label text-[8px] uppercase tracking-wide">days</span>
          </button>
        ))}
      </div>
    </StepShell>
  );
}

function ResultsStep({
  results,
  generatedPlan,
  templateAlternates,
  showAlternates,
  setShowAlternates,
  saveState,
  onBack,
}: {
  results: BmiMacroResult;
  generatedPlan: GeneratedPlan;
  templateAlternates: WorkoutTemplate[];
  showAlternates: boolean;
  setShowAlternates: (v: boolean) => void;
  saveState: "idle" | "saving" | "saved" | "error";
  onBack: () => void;
}) {
  const router = useRouter();

  function useGeneratedPlan() {
    try {
      window.sessionStorage.setItem(GENERATED_PLAN_KEY, JSON.stringify({ name: generatedPlan.name, days: generatedPlan.days }));
    } catch {
      // Storage blocked (private mode): the planner falls back to an empty
      // builder, which is still usable, just not pre-filled.
    }
    router.push("/dashboard/plan?generated=1");
  }

  function applyTemplate(template: WorkoutTemplate) {
    router.push(`/dashboard/plan?template=${template.id}`);
  }

  return (
    <div className="flex-1 flex flex-col animate-suggest-in-up">
      <span className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary-container text-on-primary-container shadow-soft mb-5 animate-snap-pop shrink-0">
        <span className="material-symbols-outlined text-2xl leading-none">workspace_premium</span>
      </span>
      <p className="font-label text-[11px] uppercase tracking-[0.2em] text-primary-container font-bold mb-1">All Set</p>
      <h1 className="font-display text-3xl text-on-surface uppercase tracking-wide leading-tight mb-1">Your Plan Is Ready</h1>
      <p className="font-body text-xs text-tertiary mb-6 flex items-center gap-1.5">
        {saveState === "saving" && "Saving to your profile…"}
        {saveState === "saved" && (
          <>
            <span className="material-symbols-outlined text-sm leading-none text-primary-container">check_circle</span>
            Saved to your profile
          </>
        )}
        {saveState === "error" && "Couldn't save right now — your results below are still accurate, just redo this later from Quick Actions."}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-surface-container-low p-4 rounded-xl shadow-soft">
          <span className="font-label text-[9px] uppercase tracking-wider text-outline">Body Mass Index</span>
          <p className="font-display text-3xl text-primary-container leading-none mt-1.5">{results.bmi}</p>
          <p className="font-label text-[9px] uppercase tracking-wider text-tertiary mt-1">{results.bmiTag}</p>
        </div>
        <div className="bg-surface-container-low p-4 rounded-xl shadow-soft">
          <span className="font-label text-[9px] uppercase tracking-wider text-outline">Daily Target</span>
          <p className="font-display text-3xl text-on-surface leading-none mt-1.5">{results.targetCalories.toLocaleString("en-IN")}</p>
          <p className="font-label text-[9px] uppercase tracking-wider text-tertiary mt-1">KCAL / DAY</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { label: "Protein", value: results.proteinGrams },
          { label: "Carbs", value: results.carbsGrams },
          { label: "Fats", value: results.fatsGrams },
        ].map((m) => (
          <div key={m.label} className="bg-surface-container p-2.5 rounded-lg text-center">
            <p className="font-display text-lg text-on-surface leading-none">{m.value}g</p>
            <p className="font-label text-[8px] uppercase tracking-wider text-tertiary mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-low border-l-4 border-primary-container p-4 rounded-2xl shadow-soft mb-3">
        <span className="font-label text-[9px] uppercase tracking-wider text-primary-container font-bold">Your Generated Plan</span>
        <h2 className="font-display text-xl text-on-surface uppercase tracking-wide leading-tight mt-1">{generatedPlan.name}</h2>
        <p className="font-label text-[9px] uppercase tracking-wider text-outline mt-1">{generatedPlan.scheduleLabel}</p>

        <div className="flex flex-col gap-1.5 mt-3">
          {generatedPlan.days.map((d) => (
            <div key={d.day} className="flex items-center justify-between gap-2 bg-surface-container rounded-lg px-3 py-2">
              <span className="font-label text-xs uppercase tracking-wide text-on-surface truncate">
                {d.day}
                {d.focus ? ` — ${d.focus}` : ""}
              </span>
              <span className="shrink-0 font-label text-[9px] uppercase tracking-wider text-tertiary">{d.exercises.length} exercises</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={useGeneratedPlan}
          className="w-full mt-3 flex items-center justify-center gap-2 bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-xs uppercase font-bold px-4 py-3 rounded-xl shadow-soft transition-colors active:scale-[0.98]"
        >
          Use This Plan
          <span className="material-symbols-outlined text-base leading-none">chevron_right</span>
        </button>
      </div>

      {!showAlternates ? (
        <button
          type="button"
          onClick={() => setShowAlternates(true)}
          className="font-label text-[10px] uppercase tracking-wider text-tertiary hover:text-on-surface transition-colors mb-6 self-start"
        >
          Or start from one of our templates instead
        </button>
      ) : (
        <div className="flex flex-col gap-2 mb-6">
          {templateAlternates.map((t) => (
            <div key={t.id} className="bg-surface-container p-3 rounded-xl flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="block font-label text-xs uppercase tracking-wide text-on-surface truncate">{t.name}</span>
                <span className="block font-body text-[10px] text-tertiary truncate">{t.schedule}</span>
              </div>
              <button
                type="button"
                onClick={() => applyTemplate(t)}
                className="shrink-0 font-label text-[9px] uppercase font-bold px-3 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors"
              >
                Use This
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-3 pt-4 border-t border-surface-variant/30">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-xl leading-none">chevron_left</span>
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex-1 flex items-center justify-center gap-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label text-sm uppercase font-bold px-6 py-3.5 rounded-xl shadow-soft transition-colors active:scale-[0.98]"
        >
          Go To Dashboard
        </button>
      </div>
    </div>
  );
}
