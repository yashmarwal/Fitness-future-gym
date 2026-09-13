"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/dashboard/workouts", label: "Workouts", icon: "fitness_center" },
  { href: "/dashboard/nutrition", label: "Food", icon: "restaurant" },
  { href: "/dashboard/timer", label: "Timer", icon: "timer" },
  { href: "/dashboard/fees", label: "Fees", icon: "payments" },
];

export default function DashboardTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t border-surface-variant/50 grid grid-cols-5 lg:hidden">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
              active ? "text-primary-container" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {active && <span className="absolute top-0 inset-x-3 h-0.5 bg-primary-container" />}
            <span
              className="material-symbols-outlined text-xl leading-none"
              style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {tab.icon}
            </span>
            <span className="font-label text-[10px] uppercase tracking-wider">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
