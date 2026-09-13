"use client";

import { useRouter } from "next/navigation";

export default function DashboardHeader({ fullName }: { fullName: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="w-full bg-surface-container-lowest border-b border-surface-variant/50 px-gutter-mobile lg:px-gutter-desktop h-16 flex items-center justify-between">
      <div className="flex flex-col leading-none">
        <span className="font-label text-[10px] uppercase tracking-widest text-primary-container">
          Welcome Back
        </span>
        <span className="font-display text-xl text-on-surface uppercase tracking-wide">{fullName}</span>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-primary-container font-label text-xs uppercase tracking-wider px-3 py-2 transition-colors"
      >
        <span className="material-symbols-outlined text-base leading-none">logout</span>
        Sign Out
      </button>
    </header>
  );
}
