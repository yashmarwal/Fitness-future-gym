"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Overview", icon: "dashboard" },
  { href: "/admin/alerts", label: "Alerts", icon: "notifications" },
  { href: "/admin/members", label: "Members", icon: "group" },
  { href: "/admin/trials", label: "Trials", icon: "person_add" },
  { href: "/admin/attendance", label: "Attendance", icon: "event_available" },
  { href: "/admin/qr", label: "QR Code", icon: "qr_code_2" },
  { href: "/admin/fees", label: "Fees", icon: "payments" },
  { href: "/admin/broadcast", label: "Broadcast", icon: "campaign" },
];

export default function AdminNav({ username }: { username: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    // Not also calling router.refresh() — see LoginForm.tsx for why that
    // combination races with the pending push transition. push() alone
    // still re-runs middleware with the now-cleared cookie.
    router.push("/admin/login");
  }

  return (
    <header className="sticky top-0 z-20 w-full bg-surface-container-lowest border-b border-surface-variant/50">
      <div className="flex items-center justify-between px-gutter-mobile lg:px-gutter-desktop h-16">
        <span className="font-display text-xl text-on-surface uppercase tracking-wide">
          Admin <span className="text-primary-container">Panel</span>
        </span>
        <div className="flex items-center gap-4">
          <span className="font-label text-xs uppercase tracking-wider text-tertiary hidden sm:inline">
            {username}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 font-label text-xs uppercase tracking-wider text-on-surface-variant hover:text-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-base leading-none">logout</span>
            Sign Out
          </button>
        </div>
      </div>
      <nav className="flex items-center gap-1 px-gutter-mobile lg:px-gutter-desktop overflow-x-auto">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-1.5 font-label text-xs uppercase tracking-wider px-4 py-3 whitespace-nowrap border-b-2 transition-colors ${
              pathname === link.href
                ? "text-primary-container border-primary-container bg-surface-container-low/60"
                : "text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-container-low/30"
            }`}
          >
            <span className="material-symbols-outlined text-base leading-none">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
