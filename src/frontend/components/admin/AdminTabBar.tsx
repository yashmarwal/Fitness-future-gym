"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GLASS_SHADOW } from "@/frontend/lib/glass";
import { SPOTTER_THINKING_EVENT } from "@/frontend/components/admin/AiAssistantChat";
import SpotterOrb from "@/frontend/components/admin/SpotterOrb";

// The 4 primary destinations, in tab order — everything else that used to
// be a pill in AdminNav's old top nav (Alerts, Trials, Attendance, Access
// Control, Broadcast, Activity) now lives behind the "More" tab's menu
// instead of competing for space in the main bar. Same destinations as
// before, nothing added or removed — just regrouped.
const TABS = [
  { href: "/admin-2G", label: "Overview", icon: "dashboard" },
  { href: "/admin-2G/fees", label: "Fees", icon: "payments" },
  { href: "/admin-2G/members", label: "Members", icon: "group" },
] as const;

const MORE_LINKS = [
  { href: "/admin-2G/alerts", label: "Alerts", icon: "notifications" },
  { href: "/admin-2G/trials", label: "Trials", icon: "person_add" },
  { href: "/admin-2G/attendance", label: "Attendance", icon: "event_available" },
  { href: "/admin-2G/access-control", label: "Access Control", icon: "block" },
  { href: "/admin-2G/broadcast", label: "Broadcast", icon: "campaign" },
  { href: "/admin-2G/audit-log", label: "Activity", icon: "history" },
];

const AI_HREF = "/admin-2G/ai-assistant";

// exact=true for "/admin-2G" specifically — every other admin route starts
// with "/admin-2G/", so a plain prefix match would make Overview light up
// as active on every single page in the panel, not just its own.
function isActive(pathname: string, href: string, exact = false): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Replaces AdminNav's old top pill-row with a bottom floating tab bar —
// same glass recipe as the member dashboard's DashboardTabBar (down to the
// overflow-hidden + inset-y-0 fixes that bar needed for its sliding
// highlight to actually match its own rounded ends), plus a detached
// circular AI shortcut alongside it, matching the reference layout (a main
// 4-up bar with one separate action circle to its right) rather than
// cramming a 5th item into the bar itself.
export default function AdminTabBar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [spotterThinking, setSpotterThinking] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const moreActive = MORE_LINKS.some((l) => isActive(pathname, l.href));
  const aiActive = isActive(pathname, AI_HREF);

  // activeIndex drives the sliding highlight — includes "More" as a 4th
  // slot even though it's a button, not a route, so landing on any page
  // behind it still lights up its own column like a real tab would.
  const activeIndex = isActive(pathname, TABS[0].href, true)
    ? 0
    : isActive(pathname, TABS[1].href)
      ? 1
      : isActive(pathname, TABS[2].href)
        ? 2
        : moreActive
          ? 3
          : -1;

  useEffect(() => {
    if (!moreOpen) return;
    function handleOutsideClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [moreOpen]);

  // AdminTabBar is mounted once, globally — this listener lives for the
  // whole admin session, not just while the AI page is open, so the circle
  // glows the moment a request starts even if that's the one moment this
  // component's own re-render cycle happens to miss.
  useEffect(() => {
    function handleThinking(e: Event) {
      setSpotterThinking((e as CustomEvent<boolean>).detail);
    }
    window.addEventListener(SPOTTER_THINKING_EVENT, handleThinking);
    return () => window.removeEventListener(SPOTTER_THINKING_EVENT, handleThinking);
  }, []);

  return (
    <nav
      ref={navRef}
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md flex items-center gap-3"
    >
      <div
        className={`relative flex-1 grid grid-cols-4 overflow-hidden bg-white/6 backdrop-blur-xl backdrop-saturate-150 border border-white/10 rounded-full ${GLASS_SHADOW} px-1 py-1`}
      >
        {activeIndex >= 0 && (
          <span
            aria-hidden="true"
            className="absolute inset-y-0 rounded-full bg-primary-container/15 transition-[left] duration-300 ease-out"
            style={{ left: `calc(${activeIndex} * 25% + 0.25rem)`, width: "calc(25% - 0.5rem)" }}
          />
        )}
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href, tab.href === "/admin-2G");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => setMoreOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`relative z-10 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
                active ? "text-primary-container" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span
                className="material-symbols-outlined text-lg leading-none"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {tab.icon}
              </span>
              <span className="font-label text-[10px] uppercase tracking-wider">{tab.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          aria-haspopup="true"
          aria-label="More admin sections"
          className={`relative z-10 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
            moreActive || moreOpen ? "text-primary-container" : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span
            className="material-symbols-outlined text-lg leading-none"
            style={moreActive || moreOpen ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            menu
          </span>
          <span className="font-label text-[10px] uppercase tracking-wider">More</span>
        </button>
      </div>

      {/* The popover lives OUTSIDE the grid div above, not nested inside
          it — that div has overflow-hidden (needed to keep the sliding
          highlight contained to the bar's own rounded ends, see
          DashboardTabBar for why), which was silently clipping this whole
          menu to nothing since it pops up and out of that box. Positioned
          relative to `nav` instead (nav has no overflow-hidden, and being
          `fixed` already gives it a positioning context), right-0 so its
          edge lines up with the AI circle it sits just above. Opens
          upward, not downward, since this bar sits at the bottom of the
          screen. */}
      {moreOpen && (
        <div
          className={`absolute bottom-full right-0 mb-3 w-56 bg-white/4 backdrop-blur-xl backdrop-saturate-150 border border-white/10 rounded-2xl ${GLASS_SHADOW} overflow-hidden animate-modal-pop p-1.5 flex flex-col gap-0.5`}
        >
          {MORE_LINKS.map((link, i) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMoreOpen(false)}
                style={{ animationDelay: `${i * 30}ms` }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-label text-xs uppercase tracking-wider transition-colors animate-snap-tick ${
                  active
                    ? "bg-primary-container/15 text-primary-container"
                    : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
                }`}
              >
                <span
                  className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                    active ? "bg-primary-container/15" : "bg-white/6"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm leading-none">{link.icon}</span>
                </span>
                {link.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* The detached AI shortcut — a separate circle alongside the main
          bar rather than a 5th grid column, matching the reference's own
          split between its 4-up bar and its one disconnected action
          button. */}
      <Link
        href={AI_HREF}
        onClick={() => setMoreOpen(false)}
        aria-label="Spotter AI"
        className={`shrink-0 w-14 h-14 flex items-center justify-center rounded-full bg-white/6 backdrop-blur-xl backdrop-saturate-150 border ${GLASS_SHADOW} transition-colors ${
          spotterThinking
            ? "border-primary-container"
            : aiActive
              ? "border-primary-container text-primary-container"
              : "border-white/10 text-on-surface-variant hover:text-on-surface"
        }`}
      >
        {spotterThinking ? (
          <SpotterOrb size={40} />
        ) : (
          <span
            className="material-symbols-outlined text-2xl leading-none"
            style={aiActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            smart_toy
          </span>
        )}
      </Link>
    </nav>
  );
}
