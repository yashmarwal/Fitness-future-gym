"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CHECKIN_SUCCESS_EVENT } from "@/frontend/components/dashboard/NotificationsCard";
import StreakMilestoneCelebration from "@/frontend/components/dashboard/StreakMilestoneCelebration";
import AttendanceIssuePopup from "@/frontend/components/attendance/AttendanceIssuePopup";
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
  // Any real reason a check-in couldn't go through — pops up with a buzz
  // (see AttendanceIssuePopup) instead of a line of text under the button
  // someone standing on the gym floor could easily miss.
  const [issue, setIssue] = useState<string | null>(null);
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
        setIssue("Membership inactive — see the front desk.");
      } else if (data.status === "blocked") {
        setIssue("Your membership is on hold — see the front desk about your fee.");
        router.refresh();
      } else if (data.status === "outside_hours") {
        setIssue("Floor's closed — attendance opens 6 AM–12 PM and 4–10:30 PM.");
      } else if (data.status === "gym_closed") {
        setIssue(data.reason ?? "The gym is closed today.");
      } else {
        setIssue("Couldn't check you in right now.");
      }
    } catch {
      setIssue("Network error. Please try again.");
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
    <button
      type="button"
      onClick={handleTap}
      disabled={checkedIn || marking}
      aria-label={checkedIn ? "Attendance already marked" : "Tap to check in and mark attendance"}
      className={`relative overflow-hidden bg-black w-full pl-3 pr-4 py-2.5 shadow-soft mb-6 rounded-full border-2 transition-colors duration-300 text-left disabled:cursor-default ${
        checkedIn
          ? "border-primary-container/50"
          : // The single most important action on this page — a check-in
            // unlocks the rest of the dashboard — so it needs to read as
            // distinct from the neutral ShortcutTile cards above it, not
            // just another dark pill in the same row. A dull gray border
            // on the same near-black fill as everything around it was
            // exactly why it blended in; a bright full-opacity brand
            // border plus a tinted fill fixes that without needing an
            // extra glow/pulse layer on top.
            "border-primary-container hover:bg-primary-container/5"
      }`}
    >
      <Image
        src="/images/dashboard-stats/attendance-pill.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-top-right pointer-events-none"
      />
      {/* A comet of stroke traveling around the whole pill, not just the
          small circular button, for as long as the request is in flight —
          pathLength=100 keeps the dash math independent of the pill's
          actual rendered width (see attendance-pill-trace). Pure white,
          not the brand orange this used before: the pill's own border is
          now solid primary-container (see the not-checked-in classes
          above), so an orange trace over an orange border was invisible.
          Deliberately setting ONLY ry (not rx) to "50%": per the SVG spec,
          when only ry is given, rx is inferred to the same resolved value
          (height / 2) rather than each being clamped independently against
          its own axis — that's what keeps both end-caps true semicircles
          (a real pill/stadium) instead of the flattened ellipse you get
          from something like rx="9999" on a rect much wider than it is
          tall (rx clamps to width/2, ry clamps to height/2 separately). */}
      {marking && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" aria-hidden="true">
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            ry="50%"
            pathLength={100}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="16 84"
            className="animate-attendance-pill-trace"
          />
        </svg>
      )}
      {/* Purely decorative now — the whole pill above is the real tap
          target (aria-label there covers it), this is just the icon badge. */}
      <span className="relative z-10 flex items-center gap-3 w-full">
      <span
        aria-hidden="true"
        className={`relative w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-soft transition-all
          ${
            checkedIn
              ? "bg-surface-container-high text-primary-container"
              : "bg-primary-container text-on-primary-container"
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
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-label text-xs uppercase tracking-wide text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          Attendance
        </span>
        <span
          key={statusText}
          className="block font-body text-xs truncate animate-attendance-status-in text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
        >
          {statusText}
        </span>
      </span>
      </span>
      {milestoneStreak != null && (
        <StreakMilestoneCelebration
          days={milestoneStreak}
          reviewPrompt={reviewPrompt}
          onDismiss={() => setMilestoneStreak(null)}
        />
      )}
      {issue && <AttendanceIssuePopup message={issue} onDismiss={() => setIssue(null)} />}
    </button>
  );
}
