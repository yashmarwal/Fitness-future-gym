import Link from "next/link";
import type { PersonalRecord } from "@/backend/services/personalRecords";

// Server-rendered — no client JS needed here at all, same reasoning as
// MuscleProgressTeaser (this is purely "here's a preview, tap through for
// more"). Mirrors AttendanceCheckInButton's bar shape/sizing exactly (same
// rounded pill, same icon circle, same soft shadow) since it sits directly
// under it on the dashboard home, so the two read as a matched pair rather
// than two differently-styled UI patterns stacked on top of each other.
export default function PersonalRecordsBar({ records }: { records: PersonalRecord[] }) {
  const latest = records[0] ?? null;
  const subtitle = latest
    ? `Latest: ${latest.exerciseName} — ${latest.bestWeightKg != null ? `${latest.bestWeightKg}kg × ${latest.bestReps}` : `${latest.bestReps} reps`}`
    : "Log a set to start your trophy case";

  return (
    <Link
      href="/dashboard/records"
      className="flex items-center gap-3 bg-surface-container-low pl-3 pr-4 py-2.5 shadow-soft rounded-full border-2 border-surface-variant hover:border-primary-container mb-6 transition-colors"
    >
      <span className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-soft bg-surface-container-high text-primary-container">
        <span className="material-symbols-outlined text-xl leading-none">emoji_events</span>
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-label text-xs uppercase tracking-wide text-on-surface">Personal Records</p>
        <p className="font-body text-xs text-tertiary truncate">{subtitle}</p>
      </div>
      <span className="material-symbols-outlined text-base text-tertiary shrink-0">arrow_forward</span>
    </Link>
  );
}
