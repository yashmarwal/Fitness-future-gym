"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/attendance", label: "Attendance" },
  { href: "/admin/fees", label: "Fees" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/broadcast", label: "WhatsApp" },
];

export default function AdminNav({ username }: { username: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="w-full bg-surface-container-lowest border-b border-surface-variant/50">
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
            className="font-label text-xs uppercase tracking-wider text-on-surface-variant hover:text-primary-container transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
      <nav className="flex items-center gap-1 px-gutter-mobile lg:px-gutter-desktop overflow-x-auto">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`font-label text-xs uppercase tracking-wider px-4 py-3 whitespace-nowrap border-b-2 transition-colors ${
              pathname === link.href
                ? "text-primary-container border-primary-container"
                : "text-on-surface-variant border-transparent hover:text-on-surface"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
