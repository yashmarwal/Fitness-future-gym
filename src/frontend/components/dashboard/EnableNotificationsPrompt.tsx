"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { isPushSupported, subscribeToPush } from "@/frontend/lib/pushNotifications";

const DISMISSED_KEY = "ff-notif-prompt-dismissed";
const SHOW_DELAY_MS = 1200;

// A one-time pop on a member's first-ever dashboard visit, prompting them
// to enable push notifications — NotificationsCard (now on the Settings
// page) already has its own quieter "highlight" nudge, but that only
// matters to someone who's already gone looking for Settings. This is the
// bigger, impossible-to-miss ask, shown once, up front.
//
// "First visit" isn't tracked with a DB flag — Notification.permission
// starting at "default" already IS that signal: a brand-new member's
// browser has never been asked before, so this is a correct, free proxy
// rather than new state to maintain. A localStorage flag (device-local,
// same pattern as personalNote.ts) stops it from re-showing every single
// page load for someone who tapped "Not Now" — permission stays "default"
// in that case, so they can still enable later from Settings; only
// "Enable Notifications" actually calls the browser's native prompt.
export default function EnableNotificationsPrompt() {
  const [show, setShow] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!isPushSupported() || Notification.permission !== "default") return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    const id = setTimeout(() => setShow(true), SHOW_DELAY_MS);
    return () => clearTimeout(id);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  }

  async function handleEnable() {
    setRequesting(true);
    try {
      await subscribeToPush();
    } finally {
      // Dismissed either way — granted or denied, the browser's own
      // permission prompt only ever shows once per origin, so there's
      // nothing left for this popup to do after that resolves.
      dismiss();
      setRequesting(false);
    }
  }

  if (!show) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xl px-6" onClick={dismiss}>
      <div className="relative w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="bg-surface-container-lowest border-2 border-primary-container/40 rounded-3xl shadow-soft-lg flex flex-col items-center text-center px-8 py-10 gap-4">
          <span className="w-16 h-16 rounded-2xl flex items-center justify-center bg-primary-container/15 text-primary-container shrink-0">
            <span className="material-symbols-outlined text-3xl leading-none">notifications_active</span>
          </span>
          <div>
            <h2 className="font-display text-xl text-on-surface uppercase tracking-wide">Stay In The Loop</h2>
            <p className="font-body text-sm text-tertiary mt-2 leading-snug">
              Turn on notifications for PRs, fee reminders, streak alerts, and more — right from the app, no WhatsApp or
              email needed.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <button
              type="button"
              onClick={handleEnable}
              disabled={requesting}
              className="w-full bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3.5 rounded-xl shadow-soft disabled:opacity-60 transition-colors active:scale-[0.98]"
            >
              {requesting ? "Enabling…" : "Enable Notifications"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              disabled={requesting}
              className="w-full font-label text-xs uppercase tracking-wider text-tertiary hover:text-on-surface transition-colors disabled:opacity-60"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
