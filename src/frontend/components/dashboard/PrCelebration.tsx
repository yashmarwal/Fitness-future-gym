"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { PrCheckResult } from "@/backend/services/personalRecords";

const AUTO_DISMISS_MS = 6000;

// Fires only for a genuine improvement over a previous attempt (never for
// the first-ever log of an exercise — see WorkoutLogForm, which only
// mounts this when pr.isPr && !pr.isFirstTime — there's no "up from X"
// story to tell yet on a first log, and popping this for every new
// exercise someone tries would get old fast). Dismissible by tapping the
// backdrop, unlike the rest-timer's finish alarm — this is a positive
// surprise, not something that needs forced acknowledgment.
export default function PrCelebration({ pr, onDismiss }: { pr: PrCheckResult; onDismiss: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [onDismiss]);

  const weightLabel = pr.weightKg != null ? `${pr.weightKg}kg × ${pr.reps}` : `${pr.reps} reps`;
  const previousLabel =
    pr.previousBestWeightKg != null
      ? `${pr.previousBestWeightKg}kg × ${pr.previousBestReps}`
      : pr.previousBestReps != null
        ? `${pr.previousBestReps} reps`
        : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xl p-6"
      onClick={onDismiss}
    >
      <div className="relative w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="absolute -inset-1 bg-primary-container/50 blur-2xl animate-pulse" aria-hidden="true" />
        <div className="relative bg-surface-container-lowest border-2 border-primary-container shadow-[0_0_100px_rgba(255,90,31,0.4)] flex flex-col items-center text-center px-8 py-10 gap-4">
          <span className="w-20 h-20 flex items-center justify-center bg-primary-container text-on-primary-container shadow-hard-lg animate-bounce">
            <span className="material-symbols-outlined text-4xl leading-none">emoji_events</span>
          </span>

          <div className="flex flex-col gap-1.5">
            <span className="font-label text-[11px] uppercase tracking-[0.2em] text-primary-container font-bold">
              Personal Record
            </span>
            <h2 className="font-display text-3xl text-on-surface uppercase tracking-wide leading-none">New PR!</h2>
            <p className="font-body text-sm text-tertiary mt-1">{pr.exerciseName}</p>
          </div>

          <div className="w-full bg-surface-container border-l-4 border-primary-container p-4 flex flex-col gap-1">
            <span className="font-display text-3xl text-primary-container tabular-nums leading-none">
              {weightLabel}
            </span>
            {previousLabel && (
              <span className="font-label text-[10px] uppercase tracking-wide text-tertiary mt-1">
                Up from {previousLabel}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="w-full bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3.5 shadow-hard transition-colors active:scale-[0.98]"
          >
            Keep Going
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
