import type { Metadata } from "next";
import SignupForm from "@/frontend/components/auth/SignupForm";

// No unique search-worthy content of its own — noindexed so it doesn't
// compete with the homepage/membership page for brand-name searches.
export const metadata: Metadata = {
  title: "Create Account",
  robots: { index: false, follow: true },
};

export default function SignupPage() {
  return <SignupForm />;
}
