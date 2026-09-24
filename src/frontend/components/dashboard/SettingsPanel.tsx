"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import type { MemberNotification } from "@/backend/services/memberNotifications";
import NotificationsCard from "@/frontend/components/dashboard/NotificationsCard";
import NotificationBar from "@/frontend/components/dashboard/NotificationBar";

type Prefs = { water: boolean; mealLog: boolean; streak: boolean; workout: boolean };

// Everything that used to be scattered — the Sign Out button (previously
// its own button in DashboardHeader), the Notifications card + feed
// (previously always rendered on the dashboard home page, nowhere else),
// and a Membership Card shortcut — now lives in one place, reachable from
// the gear icon in DashboardHeader on every dashboard route instead of
// just the home page. A bottom sheet on mobile (matches how this app
// already does full-screen overlays — see StreakMilestoneCelebration /
// PrCelebration — but slides up from the edge people actually tapped,
// rather than popping up centered) and a centered card on wider screens.
export default function SettingsPanel({
  open,
  onClose,
  fullName,
  membershipNumber,
  plan,
  initialPrefs,
  initialNotifications,
}: {
  open: boolean;
  onClose: () => void;
  fullName: string;
  membershipNumber: string;
  plan: string | null;
  initialPrefs: Prefs;
  initialNotifications: MemberNotification[];
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  // Escape closes it too — a keyboard/desktop-friendly touch to go with the
  // backdrop-tap and X button, same as any other dismissible overlay.
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleLogout() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      // Not also calling router.refresh() — see LoginForm.tsx for why that
      // combination races with the pending push transition. push() alone
      // still re-runs middleware with the now-cleared cookie.
      router.push("/");
    } catch {
      setSigningOut(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xl"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md sm:mx-4 max-h-[88vh] flex flex-col bg-surface-container-lowest border-t-2 sm:border-2 border-primary-container/40 rounded-t-3xl sm:rounded-3xl shadow-[0_0_100px_rgba(255,90,31,0.25)] animate-sheet-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab-handle, a mobile bottom-sheet convention — purely visual,
            the whole header row and backdrop are already tappable to close. */}
        <div className="sm:hidden flex justify-center pt-3" aria-hidden="true">
          <span className="w-10 h-1 rounded-full bg-surface-variant" />
        </div>

        <div className="flex items-center justify-between px-6 pt-3 sm:pt-6 pb-4 border-b border-surface-variant/30 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-11 h-11 rounded-2xl flex items-center justify-center bg-primary-container text-on-primary-container shrink-0">
              <span className="material-symbols-outlined text-xl leading-none">settings</span>
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-xl text-on-surface uppercase tracking-wide leading-none truncate">
                Settings
              </h2>
              <p className="font-body text-xs text-tertiary mt-1 truncate">{fullName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-lg leading-none">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <Link
            href="/dashboard/card"
            onClick={onClose}
            className="flex items-center gap-3 bg-surface-container-low border border-surface-variant/40 hover:border-primary-container/50 rounded-2xl px-4 py-3.5 shadow-soft transition-colors active:scale-[0.99]"
          >
            <span className="w-11 h-11 rounded-xl flex items-center justify-center bg-surface-container-high text-primary-container shrink-0">
              <span className="material-symbols-outlined text-xl leading-none">badge</span>
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-label text-xs uppercase tracking-wide text-on-surface">Membership Card</p>
              <p className="font-body text-xs text-tertiary truncate">
                {membershipNumber}
                {plan ? ` · ${plan}` : ""}
              </p>
            </div>
            <span className="material-symbols-outlined text-lg text-tertiary leading-none shrink-0">chevron_right</span>
          </Link>

          {/* NotificationsCard and NotificationBar each carry their own
              bottom margin already (they're normally placed directly in a
              page's flow) — not wrapped in an extra gap container here, or
              that spacing doubles up. */}
          <div>
            <h3 className="font-label text-[11px] uppercase tracking-widest text-tertiary px-1 mb-3">Notifications</h3>
            <NotificationsCard initialPrefs={initialPrefs} />
            <NotificationBar initialNotifications={initialNotifications} />
          </div>

          <button
            onClick={handleLogout}
            disabled={signingOut}
            className="w-full flex items-center justify-center gap-1.5 bg-error-container/20 hover:bg-error-container/35 text-error font-label text-sm uppercase font-bold px-6 py-3.5 rounded-xl transition-colors active:scale-[0.98] disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-lg leading-none">logout</span>
            {signingOut ? "Signing Out…" : "Sign Out"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
