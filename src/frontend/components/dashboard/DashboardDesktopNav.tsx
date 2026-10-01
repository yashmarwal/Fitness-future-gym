"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUnreadNotifications } from "@/frontend/lib/useUnreadNotifications";

const LINKS = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/dashboard/card", label: "Membership Card", icon: "badge" },
  { href: "/dashboard/attendance", label: "Attendance", icon: "calendar_month" },
  { href: "/dashboard/records", label: "Records", icon: "emoji_events" },
  { href: "/dashboard/workouts", label: "Workouts", icon: "fitness_center" },
  { href: "/dashboard/playground", label: "Playground", icon: "group" },
  { href: "/dashboard/nutrition", label: "Nutrition", icon: "restaurant" },
  { href: "/dashboard/timer", label: "Timer", icon: "timer" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" },
];

export default function DashboardDesktopNav() {
  const pathname = usePathname();
  const hasUnread = useUnreadNotifications();

  return (
    // bg-black, same reasoning as DashboardHeader — this full-width strip
    // sits directly on the page background, not as a floating/elevated
    // element (unlike DashboardTabBar's floating glass pill), so it should
    // match the page's pure black exactly.
    <nav className="hidden lg:flex items-center gap-1 bg-black border-b border-surface-variant/50 px-gutter-desktop overflow-x-auto">
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
            <span className="relative">
              <span className="material-symbols-outlined text-base leading-none">{link.icon}</span>
              {link.href === "/dashboard/settings" && hasUnread && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-black"
                  aria-hidden="true"
                />
              )}
            </span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
