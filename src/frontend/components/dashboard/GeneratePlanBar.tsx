"use client";

import Image from "next/image";
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
      className="relative overflow-hidden bg-black w-full flex items-center gap-3 shadow-soft rounded-2xl px-4 py-3 mb-6 text-left"
    >
      <Image
        src="/images/dashboard-stats/generate-plan.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover pointer-events-none"
        style={{ filter: "hue-rotate(-46deg) saturate(0.55) brightness(1.35)" }}
      />
      <span className="relative z-10 w-9 h-9 rounded-xl flex items-center justify-center bg-pink-200 text-pink-950 shrink-0">
        <span className="material-symbols-outlined text-lg leading-none">auto_awesome</span>
      </span>
      <span className="relative z-10 flex-1 min-w-0">
        <span className="block font-label text-xs uppercase tracking-wide text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          {fitnessProfile ? "Generate A Fresh Plan" : "Get A Plan Generated For You"}
        </span>
        <span className="block font-body text-xs text-white/75 truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          {fitnessProfile ? "Review your answers and build a fresh plan" : "Answer a few questions, 1 minute"}
        </span>
      </span>
      <span className="relative z-10 material-symbols-outlined text-lg leading-none text-white/75 shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
        chevron_right
      </span>
    </button>
  );
}
