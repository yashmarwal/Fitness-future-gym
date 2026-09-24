"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { streakTier } from "@/frontend/lib/streakTiers";
import { fetchCardFile, shareOrDownloadCard } from "@/frontend/lib/shareCard";
import { GOOGLE_MAPS_URL } from "@/frontend/lib/siteConfig";

const AUTO_DISMISS_MS = 8000;
// Longer when there's a review ask on top of the usual share/dismiss
// choice — this is a one-time-ever moment (see attendance.ts's
// review_prompted_at), so it shouldn't get rushed off screen at the same
// pace as an ordinary milestone popup.
const AUTO_DISMISS_WITH_REVIEW_MS = 14000;

const TIER_LABEL: Record<string, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

// Same visual family as PrCelebration.tsx (portal, glow ring, bounce icon)
// — fires only when AttendanceCheckInButton's check-in response reports a
// streak that's an actual round-number milestone (see isStreakMilestone),
// never on an ordinary day-to-day +1, which would get old fast as a popup.
//
// `reviewPrompt` is true at most ONCE per member, ever (see
// attendance.ts::checkInMemberRow — it's gated behind member.review_prompted_at
// being null) — the moment right after a genuine 30+ day milestone is when
// someone's actually feeling good about the gym, which is the whole reason
// this reuses that exact trigger instead of asking on a schedule or on
// every visit.
export default function StreakMilestoneCelebration({
  days,
  reviewPrompt,
  onDismiss,
}: {
  days: number;
  reviewPrompt?: boolean;
  onDismiss: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tier = streakTier(days);

  useEffect(() => {
    const id = setTimeout(onDismiss, reviewPrompt ? AUTO_DISMISS_WITH_REVIEW_MS : AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [onDismiss, reviewPrompt]);

  async function handleShare() {
    setError(null);
    setBusy(true);
    try {
      const file = await fetchCardFile(`/api/dashboard/achievement-card?type=streak`, `fitness-future-streak-${days}.png`);
      await shareOrDownloadCard(
        file,
        `${days}-Day Streak at Fitness Future Gym`,
        `${days} days in a row at Fitness Future Gym 🔥`
      );
    } catch {
      setError("Couldn't share right now — try again from the Achievements page.");
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xl p-6"
      onClick={onDismiss}
    >
      <div className="relative w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="absolute -inset-1 bg-primary-container/50 blur-2xl animate-pulse" aria-hidden="true" />
        <div className="relative bg-surface-container-lowest border-2 border-primary-container rounded-3xl shadow-[0_0_100px_rgba(255,90,31,0.4)] flex flex-col items-center text-center px-8 py-10 gap-4">
          <span className="w-20 h-20 rounded-2xl flex items-center justify-center bg-primary-container text-on-primary-container shadow-soft-lg animate-bounce">
            <span className="material-symbols-outlined text-4xl leading-none">local_fire_department</span>
          </span>

          <div className="flex flex-col gap-1.5">
            <span className="font-label text-[11px] uppercase tracking-[0.2em] text-primary-container font-bold">
              {tier ? `${TIER_LABEL[tier]} Tier` : "Streak Milestone"}
            </span>
            <h2 className="font-display text-3xl text-on-surface uppercase tracking-wide leading-none">
              {days}-Day Streak!
            </h2>
            <p className="font-body text-sm text-tertiary mt-1">
              {reviewPrompt
                ? "You haven't missed a day. That's real dedication."
                : "You haven't missed a day. Keep it alive."}
            </p>
          </div>

          {reviewPrompt && (
            <p className="font-body text-sm text-on-surface bg-surface-container rounded-xl px-4 py-3 -mt-1">
              Mind leaving us a quick Google review? It genuinely helps other people find the gym.
            </p>
          )}

          {error && <p className="font-body text-xs text-error">{error}</p>}

          <div className="w-full flex flex-col gap-2">
            {reviewPrompt && (
              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-1.5 bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3.5 rounded-xl shadow-soft transition-colors active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-lg leading-none">stars</span>
                Rate Us On Google
              </a>
            )}
            <button
              type="button"
              onClick={handleShare}
              disabled={busy}
              className={`w-full flex items-center justify-center gap-1.5 font-label text-sm uppercase font-bold px-6 py-3.5 rounded-xl shadow-soft transition-colors active:scale-[0.98] disabled:opacity-60 ${
                reviewPrompt
                  ? "bg-surface-container hover:bg-surface-container-high text-on-surface"
                  : "bg-primary-container hover:bg-secondary-container text-on-primary-container"
              }`}
            >
              <span className="material-symbols-outlined text-lg leading-none">ios_share</span>
              {busy ? "Preparing..." : "Share This"}
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
