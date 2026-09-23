"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { CHECKIN_SUCCESS_EVENT } from "@/frontend/components/dashboard/NotificationsCard";

// The check-in cooldown is 3 hours, so a second genuine check-in can never
// happen inside this window — anything that would show the banner again inside
// it is the same check-in arriving through another route.
const REPEAT_WINDOW_MS = 170 * 60 * 1000;
const STORAGE_KEY = "ff_workout_prompt_at";
const SHOW_DELAY_MS = 500;
const VISIBLE_MS = 9000;
const EXIT_MS = 280;
const SWIPE_DISMISS_PX = 36;

function claimPrompt(): boolean {
  try {
    const last = Number(window.localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Date.now() - last < REPEAT_WINDOW_MS) return false;
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Storage blocked (private mode): fall through and just show it.
  }
  return true;
}

// "You're checked in — log your workout" as a phone-style heads-up: a card that
// drops in from the top edge of the screen, sits there for a few seconds, and
// slides back up on its own, on swipe-up, or on the close button. Tapping it
// opens the workout log. It's in-app only — the real push notification is sent
// by the server at check-in. Shows two ways:
//   • right after the member taps Check In on this page (CHECKIN_SUCCESS_EVENT);
//   • on the next dashboard visit after a front-desk QR check-in, when the
//     server hands over that check-in's identity (`promptId`).
// Either way it appears once per check-in per device: whichever route gets
// there first stamps localStorage, and the other one stands down.
export default function WorkoutPromptBanner({
  promptId,
  streak,
  todaysPlan,
}: {
  promptId: string | null;
  streak: number;
  todaysPlan: { label: string; exerciseCount: number } | null;
}) {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [touching, setTouching] = useState(false);
  const [dragY, setDragY] = useState(0);
  const touchStartY = useRef(0);
  const leavingRef = useRef(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const dismiss = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    exitTimer.current = setTimeout(() => {
      setOpen(false);
      setLeaving(false);
      setDragY(0);
      leavingRef.current = false;
    }, EXIT_MS);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      if (!claimPrompt()) return;
      timer = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    };
    if (promptId) schedule();
    window.addEventListener(CHECKIN_SUCCESS_EVENT, schedule);
    return () => {
      window.removeEventListener(CHECKIN_SUCCESS_EVENT, schedule);
      clearTimeout(timer);
    };
  }, [promptId]);

  // Leaves by itself after a few seconds — but never while a finger is on it.
  useEffect(() => {
    if (!open || touching) return;
    const timer = setTimeout(dismiss, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [open, touching, dismiss]);

  useEffect(() => () => clearTimeout(exitTimer.current), []);

  if (!open) return null;

  const body = todaysPlan
    ? `Today: ${todaysPlan.label} · ${todaysPlan.exerciseCount} ${todaysPlan.exerciseCount === 1 ? "exercise" : "exercises"} — tap to start`
    : streak >= 2
      ? `${streak}-day streak going — tap to log today's workout`
      : "Tap to log your first set of the day";

  return createPortal(
    <div className="fixed inset-x-0 top-0 z-[9999] px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pointer-events-none">
      <div
        role="status"
        aria-live="polite"
        onTouchStart={(e) => {
          touchStartY.current = e.touches[0].clientY;
          setTouching(true);
        }}
        onTouchMove={(e) => setDragY(Math.min(0, e.touches[0].clientY - touchStartY.current))}
        onTouchEnd={() => {
          setTouching(false);
          if (dragY < -SWIPE_DISMISS_PX) dismiss();
          else setDragY(0);
        }}
        onTouchCancel={() => {
          setTouching(false);
          setDragY(0);
        }}
        style={{
          touchAction: "none",
          transform: leaving ? "translateY(-140%)" : dragY ? `translateY(${dragY}px)` : undefined,
          opacity: leaving ? 0 : undefined,
          transition: touching ? "none" : `transform ${EXIT_MS}ms ease-in, opacity ${EXIT_MS}ms ease-in`,
        }}
        className="animate-banner-drop pointer-events-auto mx-auto w-full max-w-md flex items-stretch bg-surface-container-lowest border border-surface-variant/60 border-l-4 border-l-primary-container shadow-soft-lg rounded-2xl overflow-hidden"
      >
        <Link href="/dashboard/workouts" onClick={dismiss} className="flex-1 min-w-0 flex items-center gap-3 pl-3 py-3">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary-container text-on-primary-container">
            <span className="material-symbols-outlined text-xl leading-none">fitness_center</span>
          </span>
          <span className="flex-1 min-w-0">
            <span className="flex items-center justify-between gap-2 font-label text-[10px] uppercase tracking-[0.15em] text-tertiary">
              <span>Fitness Future</span>
              <span>now</span>
            </span>
            <span className="block font-label text-sm uppercase text-on-surface leading-tight mt-0.5">
              You&apos;re checked in — start logging
            </span>
            <span className="block font-body text-xs text-tertiary leading-snug mt-0.5">{body}</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="w-10 shrink-0 flex items-start justify-center pt-2.5 text-tertiary hover:text-on-surface transition-colors"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-lg leading-none">close</span>
        </button>
      </div>
    </div>,
    document.body
  );
}
