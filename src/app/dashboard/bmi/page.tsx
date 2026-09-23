import type { Metadata } from "next";
import Link from "next/link";
import { getMemberSession } from "@/backend/auth/session";
import { getFitnessProfile } from "@/backend/services/fitnessProfile";
import CalculatorForm, { type CalculatorInitial } from "@/frontend/components/calculator/CalculatorForm";

export const metadata: Metadata = { title: "BMI & Macro Calculator" };

export default async function DashboardBmiPage() {
  const session = await getMemberSession();
  const profile = await getFitnessProfile(session!.memberId);

  // Pre-fills from the fitness-onboarding wizard's saved answers, if the
  // member has any — same shared math (bmiMacro.ts) either way, so the
  // numbers here always agree with the results screen they saw in the
  // wizard, not a second independent calculation.
  const initial: CalculatorInitial | undefined = profile
    ? {
        weightKg: profile.weightKg,
        heightFt: Math.floor(profile.heightCm / 30.48),
        heightIn: Math.round((profile.heightCm / 2.54) % 12),
        age: profile.age,
        gender: profile.gender,
        activityMultiplier: profile.activityMultiplier,
        goalOffset: profile.goalOffset,
      }
    : undefined;

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-(--container-max) mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide">BMI & Macro Calculator</h1>
        <Link
          href="/onboarding"
          className="shrink-0 flex items-center gap-1 font-label text-[10px] uppercase text-primary-container hover:text-secondary transition-colors"
        >
          <span className="material-symbols-outlined text-sm leading-none">auto_awesome</span>
          {profile ? "Redo Full Wizard" : "Get A Plan Recommendation"}
        </Link>
      </div>
      <CalculatorForm initial={initial} dashboardStyle />
    </div>
  );
}
