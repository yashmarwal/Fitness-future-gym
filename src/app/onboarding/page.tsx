import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMemberSession } from "@/backend/auth/session";
import { getFitnessProfile } from "@/backend/services/fitnessProfile";
import FitnessOnboardingWizard from "@/frontend/components/onboarding/FitnessOnboardingWizard";

// Top-level route, not /dashboard/onboarding — deliberately outside the
// dashboard layout (which always renders the header + tab bar around
// {children}), so this reads as its own immersive, full-screen guided flow,
// the same way /login and /signup already sit outside it. Reachable both
// right after signup (SignupForm redirects here instead of /dashboard) and
// any time later via the dashboard's "complete your profile" nudge or the
// BMI tile's "Redo the full wizard" link — in the second case, whatever the
// member answered before is passed in so they're editing, not starting over.
export const metadata: Metadata = {
  title: "Set Up Your Profile",
  robots: { index: false, follow: true },
};

export default async function OnboardingPage() {
  const session = await getMemberSession();
  if (!session) redirect("/login");

  const initialProfile = await getFitnessProfile(session.memberId);

  return <FitnessOnboardingWizard initialProfile={initialProfile} />;
}
