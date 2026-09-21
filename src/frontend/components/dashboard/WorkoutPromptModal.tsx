"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { CHECKIN_SUCCESS_EVENT } from "@/frontend/components/dashboard/NotificationsCard";

// The check-in cooldown is 3 hours, so a second genuine check-in can never
// happen inside this window — anything that would open the popup again inside
// it is the same check-in arriving through another route.
const REPEAT_WINDOW_MS = 170 * 60 * 1000;
const STORAGE_KEY = "ff_workout_prompt_at";
const OPEN_DELAY_MS = 600;

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

// "You're checked in — log your workout." Opens two ways:
//   • right after the member taps Check In on this page (CHECKIN_SUCCESS_EVENT);
//   • on the next dashboard visit after a front-desk QR check-in, when the
//     server hands over the id of that check-in's fresh prompt (`promptId`).
// Either way it appears once per check-in per device: whichever route gets
// there first stamps localStorage, and the other one stands down.
export default function WorkoutPromptModal({
  promptId,
  streak,
  todaysPlan,
}: {
  promptId: string | null;
  streak: number;
  todaysPlan: { label: string; exerciseCount: number } | null;
}) {
  const [open, setOpen] = useState(false);
  const primaryRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      if (!claimPrompt()) return;
      timer = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    };
    if (promptId) schedule();
    window.addEventListener(CHECKIN_SUCCESS_EVENT, schedule);
    return () => {
      window.removeEventListener(CHECKIN_SUCCESS_EVENT, schedule);
      clearTimeout(timer);
    };
  }, [promptId]);

  useEffect(() => {
    if (!open) return;
    primaryRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="workout-prompt-title"
        className="animate-snap-in relative w-full max-w-sm bg-surface-container-lowest border-2 border-primary-container shadow-hard-lg flex flex-col items-center text-center px-7 py-8 gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="w-16 h-16 flex items-center justify-center bg-primary-container text-on-primary-container shadow-hard animate-snap-pop">
          <span className="material-symbols-outlined text-3xl leading-none">fitness_center</span>
        </span>

        <div className="flex flex-col gap-1.5">
          <span className="font-label text-[11px] uppercase tracking-[0.2em] text-primary-container font-bold">Checked in</span>
          <h2 id="workout-prompt-title" className="font-display text-3xl text-on-surface uppercase tracking-wide leading-none">
            Time to lift
          </h2>
          <p className="font-body text-sm text-tertiary mt-1">
            {streak >= 2
              ? `${streak}-day streak going — log today's workout to keep it alive.`
              : "Log your first set — it counts toward your records and muscle ranks."}
          </p>
        </div>

        {todaysPlan && (
          <div className="w-full bg-surface-container border-l-4 border-primary-container px-4 py-3 text-left">
            <span className="block font-label text-[10px] uppercase tracking-wide text-tertiary">Today&apos;s plan</span>
            <span className="block font-display text-2xl text-primary-container leading-tight">{todaysPlan.label}</span>
            <span className="block font-body text-xs text-tertiary">
              {todaysPlan.exerciseCount} {todaysPlan.exerciseCount === 1 ? "exercise" : "exercises"} lined up
            </span>
          </div>
        )}

        <Link
          ref={primaryRef}
          href="/dashboard/workouts"
          onClick={() => setOpen(false)}
          className="w-full bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3.5 shadow-hard transition-colors active:scale-[0.98]"
        >
          {todaysPlan ? "Start today's workout" : "Log a workout"}
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="font-label text-xs uppercase tracking-wider text-tertiary hover:text-on-surface transition-colors"
        >
          Not now
        </button>
      </div>
    </div>,
    document.body
  );
}
