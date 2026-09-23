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
  // Exact-match only (sub-routes under a tab don't highlight it) — same
  // behavior as before, just now also driving the sliding pill's position
  // instead of a plain boolean per tab.
  const activeIndex = TABS.findIndex((tab) => tab.href === pathname);

  return (
    <nav className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-50 lg:hidden">
      <div className="relative grid grid-cols-5 bg-surface-container-lowest/95 backdrop-blur-md border border-surface-variant/50 rounded-full shadow-soft-lg px-1 py-1">
        {/* The sliding highlight — positioned with `left`/`width` (percent of
            the PARENT, unlike `transform`'s percent-of-self) so it lands on
            the right column regardless of container width, and animates
            smoothly between tabs via the `left` transition. */}
        {activeIndex >= 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1 bottom-1 rounded-full bg-primary-container/15 transition-[left] duration-300 ease-out"
            style={{ left: `calc(${activeIndex} * 20% + 0.25rem)`, width: "calc(20% - 0.5rem)" }}
          />
        )}
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`relative z-10 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                active ? "text-primary-container" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
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
      </div>
    </nav>
  );
}
