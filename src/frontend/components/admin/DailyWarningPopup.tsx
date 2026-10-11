"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminModal from "@/frontend/components/admin/AdminModal";
import { getIstDateString } from "@/frontend/lib/date";

export type DailyWarning = {
  key: string;
  icon: string;
  tone: "error" | "warning";
  title: string;
  count: number;
  href: string;
};

const SHOWN_KEY = "ff_admin_daily_warning_shown_date";

const TONE_TEXT: Record<DailyWarning["tone"], string> = {
  error: "text-error",
  warning: "text-primary-container",
};

const TONE_BORDER: Record<DailyWarning["tone"], string> = {
  error: "border-l-error",
  warning: "border-l-primary-container",
};

// Once-a-day "here's what needs attention" popup, mounted on the Overview
// page (the admin's natural landing page). Shows the first time the admin
// opens the panel each IST calendar day, covering every category passed in
// that currently has something in it — not just blocked members, whatever
// the caller includes. SHOWN_KEY is written the moment it's displayed, not
// on dismiss, so closing it never makes it reappear later the same day.
export default function DailyWarningPopup({ warnings }: { warnings: DailyWarning[] }) {
  const [show, setShow] = useState(false);
  const active = warnings.filter((w) => w.count > 0);

  useEffect(() => {
    if (active.length === 0) return;

    // Deferred out of the effect's synchronous body — same escape used
    // elsewhere in this app (FitnessProfileNudge, FoodLogHistoryStrip) to
    // satisfy the set-state-in-effect lint rule; this only reads
    // localStorage once per mount, it's not a real delay.
    const timer = setTimeout(() => {
      const today = getIstDateString();
      try {
        if (window.localStorage.getItem(SHOWN_KEY) === today) return;
        window.localStorage.setItem(SHOWN_KEY, today);
      } catch {
        // Storage blocked — just show it this load, worst case is a repeat view.
      }
      setShow(true);
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `active` is derived fresh every render; only the mount matters here.
  }, []);

  if (!show || active.length === 0) return null;

  const totalMembers = active.reduce((sum, w) => sum + w.count, 0);

  return (
    <AdminModal title="Today's Warnings" icon="warning" onClose={() => setShow(false)}>
      <p className="font-body text-xs text-tertiary mb-4">
        {totalMembers} member{totalMembers === 1 ? "" : "s"} across {active.length} area
        {active.length === 1 ? "" : "s"} need your attention.
      </p>
      <div className="flex flex-col gap-2">
        {active.map((w) => (
          <Link
            key={w.key}
            href={w.href}
            onClick={() => setShow(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-white/4 border-l-4 ${TONE_BORDER[w.tone]} hover:bg-white/8 transition-colors`}
          >
            <span className={`material-symbols-outlined text-lg leading-none shrink-0 ${TONE_TEXT[w.tone]}`}>
              {w.icon}
            </span>
            <span className="flex-1 min-w-0 font-label text-xs uppercase tracking-wide text-on-surface">
              {w.title}
            </span>
            <span className={`font-display text-lg leading-none shrink-0 ${TONE_TEXT[w.tone]}`}>{w.count}</span>
          </Link>
        ))}
      </div>
    </AdminModal>
  );
}
