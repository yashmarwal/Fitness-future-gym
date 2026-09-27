"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CHECKIN_SUCCESS_EVENT } from "@/frontend/components/dashboard/NotificationsCard";
import AttendanceIssuePopup from "@/frontend/components/attendance/AttendanceIssuePopup";

// Shown by the workout pages INSTEAD of their content when the member hasn't
// checked in (the server decides — see dashboard/workouts, plan and timer
// pages), so nothing of the locked page is fetched or rendered behind it.
// In-flow rather than a full-screen overlay: the dashboard header and tab bar
// stay usable, so the member can still go to any of the open pages.
export default function AttendanceLock() {
  const router = useRouter();
  const [marking, setMarking] = useState(false);
  // Set once the check-in succeeded, to cover the moment before the refresh
  // lands and the real page replaces this card.
  const [unlocking, setUnlocking] = useState(false);
  // Any real reason a check-in couldn't go through — pops up with a buzz
  // (see AttendanceIssuePopup) instead of a line of text easy to miss on a
  // phone screen.
  const [issue, setIssue] = useState<string | null>(null);

  async function handleMark() {
    setMarking(true);
    try {
      const res = await fetch("/api/dashboard/checkin", { method: "POST" });
      const data = await res.json();
      if (data.status === "success" || data.status === "cooldown") {
        setUnlocking(true);
        if (data.status === "success") window.dispatchEvent(new Event(CHECKIN_SUCCESS_EVENT));
        router.refresh();
      } else if (data.status === "inactive") {
        setIssue("Your membership isn't active — see the front desk.");
      } else if (data.status === "blocked") {
        setIssue("Your membership is on hold — see the front desk about your fee.");
        router.refresh();
      } else if (data.status === "outside_hours") {
        setIssue("The floor's closed right now — attendance opens 6 AM–12 PM and 4–10:30 PM.");
      } else if (data.status === "gym_closed") {
        setIssue(data.reason ?? "The gym is closed today.");
      } else {
        setIssue(data.message ?? "Couldn't check you in. Ask the front desk for help.");
      }
    } catch {
      setIssue("Network error. Please try again.");
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-10 flex justify-center">
      <div className="bg-surface-container-low shadow-soft-lg rounded-3xl p-8 max-w-sm w-full flex flex-col items-center gap-4 text-center">
        <span className="material-symbols-outlined text-5xl text-primary-container">event_available</span>
        <h1 className="font-display text-xl text-on-surface uppercase tracking-wide">Mark Attendance First</h1>
        <p className="font-body text-sm text-tertiary">
          Check in at the gym to unlock your workout tools for the next 3 hours.
        </p>
        <button
          onClick={handleMark}
          disabled={marking || unlocking}
          className="w-full bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 rounded-xl shadow-soft disabled:opacity-60 transition-colors"
        >
          {unlocking ? "Unlocking..." : marking ? "Checking In..." : "Mark Attendance"}
        </button>
        <Link href="/dashboard" className="font-label text-xs uppercase tracking-wider text-tertiary">
          ← Back To Dashboard
        </Link>
      </div>
      {issue && <AttendanceIssuePopup message={issue} onDismiss={() => setIssue(null)} />}
    </div>
  );
}
