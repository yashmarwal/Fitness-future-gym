"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { PrCheckResult } from "@/backend/services/personalRecords";
import { fetchCardFile, shareOrDownloadCard } from "@/frontend/lib/shareCard";

const AUTO_DISMISS_MS = 10000;

// Fires only for a genuine improvement over a previous attempt (never for
// the first-ever log of an exercise — see WorkoutLogForm, which only
// mounts this when pr.isPr && !pr.isFirstTime — there's no "up from X"
// story to tell yet on a first log, and popping this for every new
// exercise someone tries would get old fast). Dismissible by tapping the
// backdrop, unlike the rest-timer's finish alarm — this is a positive
// surprise, not something that needs forced acknowledgment.
//
// This is also the ONLY moment "Share This PR" can exist at all: the
// before→after card needs the previous best, and member_exercise_prs only
// ever stores the current one — checkAndRecordPr already overwrote it
// before this component's props even arrived. There's no "go share an old
// PR later" flow for that reason; the achievement-card route's `type=pr`
// only works with a prevWeight/prevReps carried over from right here.
export default function PrCelebration({ pr, onDismiss }: { pr: PrCheckResult; onDismiss: () => void }) {
  const [busy, setBusy] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  useEffect(() => {
    // Paused, not cancelled, while a share is in flight — an auto-dismiss
    // mid-fetch would yank the modal (and the member's exercise-name
    // context for the share) out from under a request they just started.
    if (busy) return;
    const id = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [onDismiss, busy]);

  async function handleShare() {
    setShareError(null);
    setBusy(true);
    try {
      const params = new URLSearchParams({ type: "pr", exercise: pr.exerciseName });
      if (pr.previousBestWeightKg != null) params.set("prevWeight", String(pr.previousBestWeightKg));
      if (pr.previousBestReps != null) params.set("prevReps", String(pr.previousBestReps));
      const file = await fetchCardFile(`/api/dashboard/achievement-card?${params.toString()}`, `fitness-future-pr.png`);
      await shareOrDownloadCard(
        file,
        `New PR at Fitness Future Gym`,
        `New personal record on ${pr.exerciseName} at Fitness Future Gym 💪`
      );
    } catch {
      setShareError("Couldn't share right now — try again from the Achievements page.");
    } finally {
      setBusy(false);
    }
  }

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
        <div className="relative bg-surface-container-lowest border-2 border-primary-container rounded-3xl shadow-[0_0_100px_rgba(255,90,31,0.4)] flex flex-col items-center text-center px-8 py-10 gap-4">
          <span className="w-20 h-20 rounded-2xl flex items-center justify-center bg-primary-container text-on-primary-container shadow-soft-lg animate-bounce">
            <span className="material-symbols-outlined text-4xl leading-none">emoji_events</span>
          </span>

          <div className="flex flex-col gap-1.5">
            <span className="font-label text-[11px] uppercase tracking-[0.2em] text-primary-container font-bold">
              Personal Record
            </span>
            <h2 className="font-display text-3xl text-on-surface uppercase tracking-wide leading-none">New PR!</h2>
            <p className="font-body text-sm text-tertiary mt-1">{pr.exerciseName}</p>
          </div>

          <div className="w-full bg-surface-container border-l-4 border-primary-container rounded-xl p-4 flex flex-col gap-1">
            <span className="font-display text-3xl text-primary-container tabular-nums leading-none">
              {weightLabel}
            </span>
            {previousLabel && (
              <span className="font-label text-[10px] uppercase tracking-wide text-tertiary mt-1">
                Up from {previousLabel}
              </span>
            )}
          </div>

          {shareError && <p className="font-body text-xs text-error">{shareError}</p>}

          <div className="w-full flex flex-col gap-2">
            <button
              type="button"
              onClick={handleShare}
              disabled={busy}
              className="w-full flex items-center justify-center gap-1.5 bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3.5 rounded-xl shadow-soft transition-colors active:scale-[0.98] disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-lg leading-none">ios_share</span>
              {busy ? "Preparing..." : "Share This PR"}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label text-sm uppercase font-bold px-6 py-3.5 rounded-xl shadow-soft transition-colors active:scale-[0.98]"
            >
              Keep Going
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
