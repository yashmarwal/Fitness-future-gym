import type { Metadata } from "next";
import AdminLoginForm from "@/frontend/components/admin/AdminLoginForm";

// Same override as admin-2G/(dashboard)/layout.tsx, for anyone who installs
// from the login screen before signing in. robots is its own explicit
// override too — this is the one /admin-2G route proxy.ts doesn't redirect
// away from (staff need to actually reach it to sign in), so unlike every
// other admin/dashboard page it isn't automatically kept out of the index
// by the redirect itself. robots.txt already disallows crawling /admin-2G,
// but that only blocks the crawl — it doesn't stop the URL from being
// indexed (with no snippet) if it's ever linked from anywhere external, so
// this still needs its own noindex, same as /login and /signup get.
export const metadata: Metadata = {
  manifest: "/admin-manifest.json",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
