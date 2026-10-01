"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUnreadNotifications } from "@/frontend/lib/useUnreadNotifications";
import { GLASS_SHADOW } from "@/frontend/lib/glass";

const TABS = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/dashboard/workouts", label: "Workouts", icon: "fitness_center" },
  { href: "/dashboard/nutrition", label: "Food", icon: "restaurant" },
  { href: "/dashboard/timer", label: "Timer", icon: "timer" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" },
];

export default function DashboardTabBar() {
  const pathname = usePathname();
  const hasUnread = useUnreadNotifications();
  // Exact-match only (sub-routes under a tab don't highlight it) — same
  // behavior as before, just now also driving the sliding pill's position
  // instead of a plain boolean per tab.
  const activeIndex = TABS.findIndex((tab) => tab.href === pathname);

  return (
    <nav className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-50 lg:hidden">
      {/* Same restrained-glass recipe as the dashboard's Quick Actions cards
          (frontend/lib/glass.ts) — neutral translucent fill + backdrop
          blur/saturate + a two-layer shadow, instead of the flatter
          near-opaque surface color this used before. */}
      {/* overflow-hidden is the actual fix for the highlight's corners
          poking out past this bar's own rounded-full curve on the
          leftmost/rightmost column (visible in testing as a squared-off
          overhang past the edge) — nothing clips a child to its parent's
          border-radius unless this is set, regardless of what radius the
          child itself uses. */}
      <div
        className={`relative grid grid-cols-5 overflow-hidden bg-white/6 backdrop-blur-xl backdrop-saturate-150 border border-white/10 rounded-full ${GLASS_SHADOW} px-1 py-1`}
      >
        {/* The sliding highlight — positioned with `left`/`width` (percent of
            the PARENT, unlike `transform`'s percent-of-self) so it lands on
            the right column regardless of container width, and animates
            smoothly between tabs via the `left` transition. A plain flat
            tint, no border — a border here read as a raised "bump" rather
            than a sleek highlight at this bar's thin scale. */}
        {activeIndex >= 0 && (
          <span
            aria-hidden="true"
            // inset-y-0, not a small top/bottom gap: for an absolutely
            // positioned child, top/bottom are measured from the parent's
            // padding edge regardless of the parent's own padding value —
            // so a "small" 2px inset here actually meant this element's
            // own height (and so its own rounded-full radius) fell short
            // of the bar's radius by several px, leaving a sliver of the
            // bar's curve visible above/below it at the end columns where
            // that curve actually shows. Flush top/bottom makes this
            // element's radius match the bar's almost exactly (off by
            // only the 1px border width), so the two curves read as one.
            className="absolute inset-y-0 rounded-full bg-primary-container/15 transition-[left] duration-300 ease-out"
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
              className={`relative z-10 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
                active ? "text-primary-container" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="relative">
                <span
                  className="material-symbols-outlined text-lg leading-none"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {tab.icon}
                </span>
                {tab.href === "/dashboard/settings" && hasUnread && (
                  <span
                    // ring-black, not ring-surface-container-lowest: that
                    // was a solid near-opaque color sized for the bar's old
                    // solid background, but the bar is translucent glass
                    // now (see the className above) — a solid-color ring
                    // sat on top of a blurred backdrop instead of blending
                    // into it, which read as a visible mismatched square
                    // behind the dot rather than a clean circle.
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-black"
                    aria-hidden="true"
                  />
                )}
              </span>
              <span className="font-label text-[10px] uppercase tracking-wider">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
