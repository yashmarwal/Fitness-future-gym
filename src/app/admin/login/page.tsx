import type { Metadata } from "next";
import AdminLoginForm from "@/frontend/components/admin/AdminLoginForm";

// Same override as admin/(dashboard)/layout.tsx, for anyone who installs
// from the login screen before signing in.
export const metadata: Metadata = {
  manifest: "/admin-manifest.json",
};

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
