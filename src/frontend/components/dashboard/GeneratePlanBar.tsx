"use client";

import { useRouter } from "next/navigation";
import type { FitnessProfile } from "@/backend/services/fitnessProfile";

// Always routes into the same form-filling wizard (/onboarding) — a member
// with a saved profile gets it pre-filled (see OnboardingPage's
// initialProfile), so it's a quick review-and-confirm rather than starting
// over, but they still go through every step and can change any answer
// before a fresh plan is generated. The wizard itself shows the branded
// "generating" beat right after its last question (FitnessOnboardingWizard's
// DaysStep -> GeneratingPlanOverlay), not here — this bar is just the entry
// point.
export default function GeneratePlanBar({ fitnessProfile }: { fitnessProfile: FitnessProfile | null }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/onboarding")}
      className="w-full flex items-center gap-3 bg-surface-container-low shadow-soft rounded-2xl px-4 py-3 mb-6 hover:bg-surface-container transition-colors text-left"
    >
      <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary-container text-on-primary-container shrink-0">
        <span className="material-symbols-outlined text-lg leading-none">auto_awesome</span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-label text-xs uppercase tracking-wide text-on-surface">
          {fitnessProfile ? "Generate A Fresh Plan" : "Get A Plan Generated For You"}
        </span>
        <span className="block font-body text-xs text-tertiary truncate">
          {fitnessProfile ? "Review your answers and build a fresh plan" : "Answer a few questions, 1 minute"}
        </span>
      </span>
      <span className="material-symbols-outlined text-lg leading-none text-tertiary shrink-0">chevron_right</span>
    </button>
  );
}
