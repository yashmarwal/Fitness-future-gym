"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

export default function AttendanceGate({
  checkedIn: initialCheckedIn,
  children,
}: {
  checkedIn: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  // Not copied into its own useState: the dashboard home page's own
  // check-in button (AttendanceCheckInButton, rendered as part of
  // `children` here) marks attendance and calls router.refresh(), which
  // only gives this component a NEW `checkedIn` prop — a useState seeded
  // from that prop only reads it on the very first render and goes stale
  // after that, which used to re-block the very next page the member
  // navigated to even though they'd genuinely just checked in seconds
  // earlier. Deriving straight from the (always-current) prop during
  // render avoids that entirely; `locallyMarked` only covers the gap
  // between this gate's own "Mark Attendance" tap and the refresh actually
  // landing.
  const [locallyMarked, setLocallyMarked] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checkedIn = initialCheckedIn || locallyMarked;

  // The overview is always reachable (that's where the check-in button
  // itself lives), and so is nutrition logging — deliberately exempt, since
  // attendance can now only be marked 6–11 AM / 4–10:30 PM (see
  // isWithinAttendanceHours in attendance.ts). Without this exemption, a
  // member logging dinner at 9pm and then a late snack at midnight would
  // find the gate impossible to satisfy at all outside those windows —
  // food logging needs to work any time of day, not just gym hours.
  const isOverview = pathname === "/dashboard";
  const isNutrition = pathname.startsWith("/dashboard/nutrition");
  const blocked = !checkedIn && !isOverview && !isNutrition;

  async function handleMark() {
    setMarking(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/checkin", { method: "POST" });
      const data = await res.json();
      if (data.status === "success" || data.status === "cooldown") {
        setLocallyMarked(true);
        router.refresh();
      } else if (data.status === "inactive") {
        setError("Your membership isn't active — see the front desk.");
      } else if (data.status === "blocked") {
        setError("Your membership is on hold — see the front desk about your fee.");
        router.refresh();
      } else if (data.status === "outside_hours") {
        setError("The floor's closed right now — attendance opens 6–11 AM and 4–10:30 PM.");
      } else {
        setError(data.message ?? "Couldn't check you in. Ask the front desk for help.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setMarking(false);
    }
  }

  return (
    <>
      {children}
      {blocked && (
        <div className="fixed inset-0 z-100 bg-surface/95 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-surface-container-low shadow-hard-lg p-8 max-w-sm w-full flex flex-col items-center gap-4 text-center">
            <span className="material-symbols-outlined text-5xl text-primary-container">qr_code_scanner</span>
            <h2 className="font-display text-xl text-on-surface uppercase tracking-wide">Mark Attendance First</h2>
            <p className="font-body text-sm text-tertiary">
              Check in at the gym to unlock your dashboard tools for the next 3 hours.
            </p>
            <button
              onClick={handleMark}
              disabled={marking}
              className="w-full bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 shadow-hard disabled:opacity-60 transition-colors"
            >
              {marking ? "Checking In..." : "Mark Attendance"}
            </button>
            {error && <p className="font-body text-xs text-error">{error}</p>}
            <Link href="/dashboard" className="font-label text-xs uppercase tracking-wider text-tertiary">
              ← Back To Dashboard
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
