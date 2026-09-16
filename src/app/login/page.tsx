import type { Metadata } from "next";
import LoginForm from "@/frontend/components/auth/LoginForm";

// No unique search-worthy content of its own — noindexed so it doesn't
// compete with the homepage for brand-name searches.
export const metadata: Metadata = {
  title: "Member Login",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return <LoginForm />;
}
