"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CHECKIN_SUCCESS_EVENT } from "@/frontend/components/dashboard/NotificationsCard";
import StreakMilestoneCelebration from "@/frontend/components/dashboard/StreakMilestoneCelebration";
import { isStreakMilestone } from "@/frontend/lib/streakTiers";

type Status = { checkedIn: boolean; retryAfterMinutes: number | null };

// initialStatus comes from the server render (dashboard/page.tsx already
// fetches getAttendanceStatus for this), so the button shows real,
// interactive state on first paint instead of a disabled "Loading…" that
// only resolves after a second client→API round-trip.
//
// Look/animation loosely inspired by a Uiverse.io "install button" concept
// (tap → ripple + an orbiting loader ring while pending → the icon pops
// into a checkmark once done, pill border animating to an accent color) —
// see the attendance-* keyframes in globals.css. The check-in logic below
// is unchanged from before the restyle.
export default function AttendanceCheckInButton({ initialStatus }: { initialStatus: Status }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set only when this check-in's streak is a genuine round-number
  // milestone (see isStreakMilestone) — an ordinary day-to-day +1 never
  // shows this, or the popup would stop meaning anything.
  const [milestoneStreak, setMilestoneStreak] = useState<number | null>(null);
  // Server-decided, not derived client-side — reviewPrompt is only ever
  // true once per member, ever (see attendance.ts's review_prompted_at),
  // so this component just relays whatever the API already decided rather
  // than re-implementing that "only once" rule here too.
  const [reviewPrompt, setReviewPrompt] = useState(false);

  async function handleTap() {
    if (marking || status.checkedIn) return;
    setMarking(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/checkin", { method: "POST" });
      const data = await res.json();
      if (data.status === "success") {
        setStatus({ checkedIn: true, retryAfterMinutes: 180 });
        window.dispatchEvent(new Event(CHECKIN_SUCCESS_EVENT));
        if (typeof data.streak === "number" && isStreakMilestone(data.streak)) {
          setMilestoneStreak(data.streak);
          setReviewPrompt(Boolean(data.reviewPrompt));
        }
        router.refresh();
      } else if (data.status === "cooldown") {
        setStatus({ checkedIn: true, retryAfterMinutes: data.retryAfterMinutes });
      } else if (data.status === "inactive") {
        setError("Membership inactive — see the front desk.");
      } else if (data.status === "blocked") {
        setError("Your membership is on hold — see the front desk about your fee.");
        router.refresh();
      } else if (data.status === "outside_hours") {
        setError("Floor's closed — attendance opens 6 AM–12 PM and 4–10:30 PM.");
      } else {
        setError("Couldn't check you in right now.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setMarking(false);
    }
  }

  const checkedIn = status.checkedIn;

  const statusText = marking
    ? "Checking in…"
    : checkedIn
      ? `Marked — unlocked for ${Math.ceil((status.retryAfterMinutes ?? 0) / 60)}h`
      : "Tap to check in and unlock your dashboard";

  return (
    <div
      className={`flex items-center gap-3 bg-surface-container-low pl-3 pr-4 py-2.5 shadow-soft mb-6 rounded-full border-2 transition-colors duration-300 ${
        checkedIn ? "border-primary-container" : "border-surface-variant"
      }`}
    >
      <button
        onClick={handleTap}
        disabled={checkedIn || marking}
        aria-label={checkedIn ? "Attendance already marked" : "Tap to mark attendance"}
        className={`relative w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-soft transition-all
          ${
            checkedIn
              ? "bg-surface-container-high text-primary-container cursor-default"
              : "bg-primary-container text-on-primary-container hover:bg-secondary-container active:scale-90"
          }
          ${marking ? "animate-attendance-pulse" : ""}
        `}
      >
        {/* Loader ring — a single dot orbiting the button, looping for as
            long as the real request is in flight (see attendance-orbit). */}
        {marking && (
          <span aria-hidden="true" className="absolute inset-0 animate-attendance-orbit">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-on-background" />
          </span>
        )}
        {/* key forces a remount when the state flips so the pop-in
            animation reliably replays, same idiom as CheckInCelebration.tsx. */}
        <span
          key={checkedIn ? "done" : "pending"}
          className={`material-symbols-outlined text-xl leading-none ${checkedIn ? "animate-attendance-check-pop" : ""}`}
        >
          {checkedIn ? "check_circle" : "event_available"}
        </span>
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-label text-xs uppercase tracking-wide text-on-surface">Attendance</p>
        <p
          key={error ?? statusText}
          className={`font-body text-xs truncate animate-attendance-status-in ${error ? "text-error" : "text-tertiary"}`}
        >
          {error ?? statusText}
        </p>
      </div>
      {milestoneStreak != null && (
        <StreakMilestoneCelebration
          days={milestoneStreak}
          reviewPrompt={reviewPrompt}
          onDismiss={() => setMilestoneStreak(null)}
        />
      )}
    </div>
  );
}
