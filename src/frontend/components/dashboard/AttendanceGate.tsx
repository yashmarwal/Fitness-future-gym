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
  const [checkedIn, setCheckedIn] = useState(initialCheckedIn);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only the overview is always reachable — that's where the check-in
  // button itself lives, plus this same blocking modal for anyone who
  // navigates straight to a sub-page's URL.
  const isOverview = pathname === "/dashboard";
  const blocked = !checkedIn && !isOverview;

  async function handleMark() {
    setMarking(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/checkin", { method: "POST" });
      const data = await res.json();
      if (data.status === "success" || data.status === "cooldown") {
        setCheckedIn(true);
        router.refresh();
      } else if (data.status === "inactive") {
        setError("Your membership isn't active — see the front desk.");
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
