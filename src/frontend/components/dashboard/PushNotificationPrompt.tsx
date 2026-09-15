"use client";

import { useEffect, useState } from "react";
import { isPushSupported, subscribeToPush } from "@/frontend/lib/pushNotifications";

const DISMISSED_KEY = "ff_push_prompt_dismissed";

// A slim, dismissible banner offering real OS-level notifications (fee
// reminders, birthdays, gym announcements) — additive to the WhatsApp/email/
// in-app-bell channels the member already has, never a replacement, since
// this needs an explicit browser permission grant some members will decline
// or simply not have available (iOS Safari only supports this once the PWA
// is actually added to the home screen, not from a regular browser tab).
// Computed once via a lazy useState initializer (runs synchronously on
// first client render, window-guarded for SSR) rather than an effect —
// this project's set-state-in-effect lint rule flags calling setState
// synchronously inside an effect body for exactly this kind of one-time
// on-mount computation (same class of fix as CoachAvatar.tsx/
// MuscleProgressBoard.tsx elsewhere in this codebase).
function computeInitialVisible(): boolean {
  if (typeof window === "undefined" || !isPushSupported()) return false;
  if (Notification.permission !== "default") return false;
  try {
    return window.localStorage.getItem(DISMISSED_KEY) !== "1";
  } catch {
    return true;
  }
}

export default function PushNotificationPrompt() {
  const [visible, setVisible] = useState(computeInitialVisible);
  const [requesting, setRequesting] = useState(false);

  // A genuine effect: syncing an external system (the push subscription)
  // in the background for a member who already granted permission on a
  // prior visit — not deriving component state, so no lint conflict.
  // subscribeToPush() is an idempotent upsert if already subscribed.
  useEffect(() => {
    if (isPushSupported() && Notification.permission === "granted") {
      subscribeToPush().catch(() => {});
    }
  }, []);

  async function handleEnable() {
    setRequesting(true);
    try {
      const ok = await subscribeToPush();
      if (ok) setVisible(false);
      else handleDismiss();
    } finally {
      setRequesting(false);
    }
  }

  function handleDismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // best-effort only
    }
  }

  if (!visible) return null;

  return (
    <div className="bg-surface-container-low border border-primary-container/40 shadow-hard p-4 mb-6 flex items-center gap-3">
      <span className="material-symbols-outlined text-primary-container text-2xl leading-none shrink-0">
        notifications_active
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-label text-xs uppercase tracking-wide text-on-surface">Turn On Notifications</p>
        <p className="font-body text-xs text-tertiary">Fee reminders, gym updates, and more — straight to your phone.</p>
      </div>
      <button
        onClick={handleEnable}
        disabled={requesting}
        className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-xs uppercase font-bold px-4 py-2 shadow-hard disabled:opacity-60 transition-colors shrink-0"
      >
        {requesting ? "Enabling…" : "Enable"}
      </button>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="text-tertiary hover:text-on-surface shrink-0"
      >
        <span className="material-symbols-outlined text-lg leading-none">close</span>
      </button>
    </div>
  );
}
