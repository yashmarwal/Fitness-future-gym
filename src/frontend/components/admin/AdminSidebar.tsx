"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GLASS_SHADOW } from "@/frontend/lib/glass";
import { SPOTTER_THINKING_EVENT } from "@/frontend/components/admin/AiAssistantChat";
import SpotterOrb from "@/frontend/components/admin/SpotterOrb";

// Desktop-only counterpart to AdminTabBar — on a wide screen there's room
// to show every section at once instead of 3 primary tabs + a "More"
// popover, so this is a flat, ungrouped list rather than reusing
// AdminTabBar's TABS/MORE_LINKS split (that split exists purely to fit a
// phone-width bar, which doesn't apply here). `lg:` is this codebase's
// established desktop breakpoint (see DashboardDesktopNav on the member
// side) — AdminTabBar gets a matching `lg:hidden` so the two are mutually
// exclusive, never both on screen at once, same as the member dashboard's
// own nav split.
const LINKS = [
  { href: "/admin-2G", label: "Overview", icon: "dashboard" },
  { href: "/admin-2G/members", label: "Members", icon: "group" },
  { href: "/admin-2G/fees", label: "Fees", icon: "payments" },
  { href: "/admin-2G/trials", label: "Trials", icon: "person_add" },
  { href: "/admin-2G/attendance", label: "Attendance", icon: "event_available" },
  { href: "/admin-2G/alerts", label: "Alerts", icon: "notifications" },
  { href: "/admin-2G/broadcast", label: "Broadcast", icon: "campaign" },
  { href: "/admin-2G/access-control", label: "Access Control", icon: "block" },
  { href: "/admin-2G/audit-log", label: "Activity", icon: "history" },
] as const;

const AI_HREF = "/admin-2G/ai-assistant";

// Same exact-match reasoning as AdminTabBar's isActive — "/admin-2G" alone
// must not light up on every nested route.
function isActive(pathname: string, href: string): boolean {
  if (href === "/admin-2G") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [spotterThinking, setSpotterThinking] = useState(false);

  // Same global listener AdminTabBar keeps for its own AI circle — mounted
  // once, for the whole admin session, so the glow starts the instant a
  // request fires regardless of which nav happens to be on screen.
  useEffect(() => {
    function handleThinking(e: Event) {
      setSpotterThinking((e as CustomEvent<boolean>).detail);
    }
    window.addEventListener(SPOTTER_THINKING_EVENT, handleThinking);
    return () => window.removeEventListener(SPOTTER_THINKING_EVENT, handleThinking);
  }, []);

  const aiActive = isActive(pathname, AI_HREF);

  return (
    <nav
      aria-label="Admin sections"
      className="hidden lg:flex lg:flex-col lg:fixed lg:top-16 lg:bottom-0 lg:left-0 lg:w-60 lg:border-r lg:border-white/10 lg:bg-white/3 lg:backdrop-blur-xl lg:backdrop-saturate-150 lg:px-3 lg:py-5 lg:gap-0.5 lg:overflow-y-auto z-20"
    >
      {LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-label text-xs uppercase tracking-wider transition-colors ${
              active
                ? `bg-primary-container/15 text-primary-container ${GLASS_SHADOW}`
                : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
            }`}
          >
            <span
              className="material-symbols-outlined text-lg leading-none shrink-0"
              style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {link.icon}
            </span>
            {link.label}
          </Link>
        );
      })}

      <div className="mt-2 pt-2 border-t border-white/10">
        <Link
          href={AI_HREF}
          aria-current={aiActive ? "page" : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-label text-xs uppercase tracking-wider transition-colors ${
            spotterThinking || aiActive
              ? `bg-primary-container/15 text-primary-container ${GLASS_SHADOW}`
              : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
          }`}
        >
          {spotterThinking ? (
            <span className="shrink-0 flex items-center justify-center w-[18px] h-[18px]">
              <SpotterOrb size={18} />
            </span>
          ) : (
            <span
              className="material-symbols-outlined text-lg leading-none shrink-0"
              style={aiActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              smart_toy
            </span>
          )}
          Spotter AI
        </Link>
      </div>
    </nav>
  );
}
