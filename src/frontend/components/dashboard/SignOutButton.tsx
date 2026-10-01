"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignOutButton() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      // Not also calling router.refresh() — see LoginForm.tsx for why that
      // combination races with the pending push transition. push() alone
      // still re-runs middleware with the now-cleared cookie.
      router.push("/");
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={signingOut}
      className="w-full flex items-center justify-center gap-1.5 bg-error-container/20 hover:bg-error-container/35 text-error font-label text-sm uppercase font-bold px-6 py-3.5 rounded-xl transition-colors active:scale-[0.98] disabled:opacity-60"
    >
      <span className="material-symbols-outlined text-lg leading-none">logout</span>
      {signingOut ? "Signing Out…" : "Sign Out"}
    </button>
  );
}
