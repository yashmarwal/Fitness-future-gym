"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/dashboard/card", label: "Membership Card", icon: "badge" },
  { href: "/dashboard/attendance", label: "Attendance", icon: "calendar_month" },
  { href: "/dashboard/workouts", label: "Workouts", icon: "fitness_center" },
  { href: "/dashboard/nutrition", label: "Nutrition", icon: "restaurant" },
  { href: "/dashboard/timer", label: "Timer", icon: "timer" },
  { href: "/dashboard/fees", label: "Fees", icon: "payments" },
];

export default function DashboardDesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:flex items-center gap-1 bg-surface-container-low border-b border-surface-variant/50 px-gutter-desktop overflow-x-auto">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-1.5 font-label text-xs uppercase tracking-wider px-3 py-3 whitespace-nowrap border-b-2 transition-colors ${
              active
                ? "text-primary-container border-primary-container bg-surface-container-highest/40"
                : "text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-container-high/30"
            }`}
          >
            <span className="material-symbols-outlined text-base leading-none">{link.icon}</span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
