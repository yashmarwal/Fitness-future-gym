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

  return (
    <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t border-surface-variant/50 grid grid-cols-5">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
              isActive
                ? "text-primary-container font-bold border-t-2 border-primary-container bg-surface-container-low/50"
                : "text-on-surface-variant hover:text-on-surface"
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
    </nav>
  );
}
