"use client";

import { useRouter } from "next/navigation";
import { generatePlan } from "@/frontend/lib/exerciseSplits";
import type { FitnessProfile } from "@/backend/services/fitnessProfile";

// Same handoff key the onboarding wizard's results step writes — see
// FitnessOnboardingWizard.tsx and WorkoutPlanner.tsx's mount effect, which
// reads this once when it sees ?generated=1 on the planner URL.
const GENERATED_PLAN_KEY = "ff_generated_plan";

// A one-tap shortcut to the same generator the onboarding wizard uses
// (exerciseSplits.ts) — for a member who already has a saved fitness
// profile, there's no reason to make them redo the whole wizard just to
// get a fresh plan; this regenerates straight from their saved answers and
// drops them into the same preview-then-confirm builder. A member with no
// saved profile yet goes to the wizard instead, since there's nothing to
// generate from.
export default function GeneratePlanBar({ fitnessProfile }: { fitnessProfile: FitnessProfile | null }) {
  const router = useRouter();

  function handleTap() {
    if (!fitnessProfile) {
      router.push("/onboarding");
      return;
    }
    const plan = generatePlan({
      goal: fitnessProfile.goalKey,
      experienceLevel: fitnessProfile.experienceLevel,
      daysPerWeek: fitnessProfile.daysPerWeek,
    });
    try {
      window.sessionStorage.setItem(GENERATED_PLAN_KEY, JSON.stringify({ name: plan.name, days: plan.days }));
    } catch {
      // Storage blocked (private mode): the planner falls back to an empty
      // builder, still usable, just not pre-filled.
    }
    router.push("/dashboard/plan?generated=1");
  }

  return (
    <button
      type="button"
      onClick={handleTap}
      className="w-full flex items-center gap-3 bg-surface-container-low shadow-hard px-4 py-3 mb-6 hover:bg-surface-container transition-colors text-left"
    >
      <span className="w-9 h-9 flex items-center justify-center bg-primary-container text-on-primary-container shrink-0">
        <span className="material-symbols-outlined text-lg leading-none">auto_awesome</span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-label text-xs uppercase tracking-wide text-on-surface">
          {fitnessProfile ? "Generate A Fresh Plan" : "Get A Plan Generated For You"}
        </span>
        <span className="block font-body text-xs text-tertiary truncate">
          {fitnessProfile ? "Built from your saved goal, experience and days/week" : "Answer a few questions, 1 minute"}
        </span>
      </span>
      <span className="material-symbols-outlined text-lg leading-none text-tertiary shrink-0">chevron_right</span>
    </button>
  );
}
