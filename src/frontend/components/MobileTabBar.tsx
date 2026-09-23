"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/programs", label: "Programs", icon: "fitness_center" },
  { href: "/membership", label: "Passes", icon: "badge" },
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/calculator", label: "Calc", icon: "calculate" },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  // Exact-match only (sub-routes don't highlight a tab) — same behavior as
  // before, just now also driving the sliding pill's position instead of a
  // plain boolean per tab.
  const activeIndex = TABS.findIndex((tab) => tab.href === pathname);

  return (
    <nav className="xl:hidden fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-50">
      <div className="relative grid grid-cols-5 bg-surface-container-lowest/95 backdrop-blur-md border border-surface-variant/50 rounded-full shadow-soft-lg px-1 py-1">
        {/* Same sliding-pill treatment as the dashboard's tab bar (see
            DashboardTabBar.tsx) — `left`/`width` as percent of the parent so
            it lands on the right column regardless of container width. */}
        {activeIndex >= 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1 bottom-1 rounded-full bg-primary-container/15 transition-[left] duration-300 ease-out"
            style={{ left: `calc(${activeIndex} * 20% + 0.25rem)`, width: "calc(20% - 0.5rem)" }}
          />
        )}
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`relative z-10 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                isActive ? "text-primary-container" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-xl leading-none">
                {tab.icon}
              </span>
              <span className="font-label-sm text-[10px] uppercase tracking-wider">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
