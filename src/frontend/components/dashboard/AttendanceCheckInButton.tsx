"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Status = { checkedIn: boolean; retryAfterMinutes: number | null };

export default function AttendanceCheckInButton() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/attendance-status")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.status === "ok") {
          setStatus({ checkedIn: data.checkedIn, retryAfterMinutes: data.retryAfterMinutes });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleTap() {
    if (marking || status?.checkedIn) return;
    setMarking(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/checkin", { method: "POST" });
      const data = await res.json();
      if (data.status === "success") {
        setStatus({ checkedIn: true, retryAfterMinutes: 180 });
        router.refresh();
      } else if (data.status === "cooldown") {
        setStatus({ checkedIn: true, retryAfterMinutes: data.retryAfterMinutes });
      } else if (data.status === "inactive") {
        setError("Membership inactive — see the front desk.");
      } else {
        setError("Couldn't check you in right now.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setMarking(false);
    }
  }

  const checkedIn = status?.checkedIn ?? false;
  const loading = status === null;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleTap}
        disabled={checkedIn || marking || loading}
        aria-label={checkedIn ? "Attendance already marked" : "Tap to mark attendance"}
        className={`relative w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 shadow-hard-lg transition-all
          ${
            checkedIn
              ? "bg-surface-container-high text-primary-container cursor-default"
              : "bg-primary-container text-on-primary-container hover:bg-secondary-container active:scale-95"
          }
          disabled:opacity-100
        `}
      >
        <span className="material-symbols-outlined text-3xl leading-none">
          {checkedIn ? "check_circle" : "qr_code_scanner"}
        </span>
        <span className="font-label text-[9px] uppercase tracking-wide leading-none">
          {loading ? "..." : marking ? "Marking" : checkedIn ? "Marked" : "Check In"}
        </span>
      </button>
      {checkedIn && status?.retryAfterMinutes != null && (
        <p className="font-body text-[10px] text-outline text-center">
          Next check-in in {Math.ceil(status.retryAfterMinutes / 60)}h
        </p>
      )}
      {error && <p className="font-body text-xs text-error text-center max-w-40">{error}</p>}
    </div>
  );
}
