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

  const statusText = loading
    ? "Loading…"
    : marking
      ? "Checking in…"
      : checkedIn
        ? `Marked — unlocked for ${Math.ceil((status!.retryAfterMinutes ?? 0) / 60)}h`
        : "Tap to check in and unlock your dashboard";

  return (
    <div className="flex items-center gap-3 bg-surface-container-low pl-3 pr-4 py-2.5 shadow-hard mb-6">
      <button
        onClick={handleTap}
        disabled={checkedIn || marking || loading}
        aria-label={checkedIn ? "Attendance already marked" : "Tap to mark attendance"}
        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-hard transition-all
          ${
            checkedIn
              ? "bg-surface-container-high text-primary-container cursor-default"
              : "bg-primary-container text-on-primary-container hover:bg-secondary-container active:scale-90"
          }
        `}
      >
        <span className="material-symbols-outlined text-xl leading-none">
          {checkedIn ? "check_circle" : "qr_code_scanner"}
        </span>
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-label text-xs uppercase tracking-wide text-on-surface">Attendance</p>
        <p className={`font-body text-xs truncate ${error ? "text-error" : "text-tertiary"}`}>
          {error ?? statusText}
        </p>
      </div>
    </div>
  );
}
