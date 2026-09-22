"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const DISMISS_KEY = "ff_fitness_profile_nudge_dismissed_at";
// Re-appears a few days after being dismissed rather than staying gone
// forever — a genuine reminder, not a one-time toast, but still never a hard
// block (see feedback: skippable, non-blocking for both new and existing
// members).
const DISMISS_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;

// Shown on the dashboard whenever the member hasn't completed the fitness-
// onboarding wizard — covers both an existing member who joined before this
// shipped, and anyone who tapped "Skip" during their own signup. Only
// rendered at all when the server confirms there's no saved profile
// (dashboard/page.tsx), so this component's own job is purely the
// dismiss/cooldown UX on top of that.
export default function FitnessProfileNudge() {
  const [dismissed, setDismissed] = useState(true); // true until proven otherwise, so nothing flashes before the check runs

  // The setTimeout defers the state update out of the effect's synchronous
  // body (same escape used by WorkoutPromptBanner's claimPrompt/schedule) —
  // this only ever reads localStorage once per mount, it's not a real delay.
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const last = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0);
        setDismissed(Date.now() - last < DISMISS_COOLDOWN_MS);
      } catch {
        setDismissed(false); // storage blocked: just show it, worst case is one extra view
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Nothing else depends on this persisting.
    }
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div className="bg-surface-container-low border-l-4 border-primary-container shadow-hard p-4 mb-6 flex items-center gap-3">
      <span className="w-10 h-10 flex items-center justify-center bg-primary-container text-on-primary-container shrink-0">
        <span className="material-symbols-outlined text-lg leading-none">auto_awesome</span>
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-label text-xs uppercase tracking-wide text-on-surface">Get A Plan Made For You</p>
        <p className="font-body text-xs text-tertiary mt-0.5">
          1 minute — your BMI, calorie target, and a matched workout plan.
        </p>
      </div>
      <Link
        href="/onboarding"
        className="shrink-0 font-label text-[10px] uppercase font-bold px-3 py-2 bg-primary-container hover:bg-secondary-container text-on-primary-container transition-colors"
      >
        Start
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 flex items-center justify-center w-7 h-7 text-tertiary hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-base leading-none">close</span>
      </button>
    </div>
  );
}
