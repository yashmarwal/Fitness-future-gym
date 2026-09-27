"use client";

import { useState } from "react";
import { fetchCardFile, shareOrDownloadCard } from "@/frontend/lib/shareCard";
import type { PersonalRecord } from "@/backend/services/personalRecords";

// One row on the Personal Records page (dashboard/records/page.tsx), now
// with its own Share action — every record is shareable on demand as a
// formal "certificate" card (achievement-card route's "certificate" type,
// CertificateCard), not just whichever single lift happens to be the
// heaviest (ShareAchievementsCard's "lift" type) or the split-second moment
// a record was just broken (PrCelebration.tsx's "pr" type).
export default function PersonalRecordRow({ record }: { record: PersonalRecord }) {
  const [busy, setBusy] = useState(false);

  async function handleShare() {
    setBusy(true);
    try {
      const url = `/api/dashboard/achievement-card?type=certificate&exercise=${encodeURIComponent(record.exerciseName)}`;
      const filename = `fitness-future-${record.exerciseName.trim().toLowerCase().replace(/\s+/g, "-")}-pr.png`;
      const file = await fetchCardFile(url, filename);
      await shareOrDownloadCard(file, `My ${record.exerciseName} Personal Record`, `${record.exerciseName} PR at Fitness Future Gym 💪`);
    } catch {
      // Best-effort — a failed share/download on one row isn't worth a
      // page-level error banner, the member can just tap again.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-container-high text-primary-container shrink-0">
        <span className="material-symbols-outlined text-lg leading-none">emoji_events</span>
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-label text-sm uppercase tracking-wide text-on-surface truncate">{record.exerciseName}</p>
        <p className="font-body text-xs text-tertiary mt-0.5">
          {new Date(record.achievedAt).toLocaleDateString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
      <p className="font-display text-2xl text-primary-container tabular-nums shrink-0">
        {record.bestWeightKg != null ? `${record.bestWeightKg}kg × ${record.bestReps}` : `${record.bestReps} reps`}
      </p>
      <button
        type="button"
        onClick={handleShare}
        disabled={busy}
        aria-label={`Share ${record.exerciseName} personal record as a certificate`}
        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-surface-container-high hover:bg-surface-container-highest text-tertiary hover:text-primary-container transition-colors disabled:opacity-60"
      >
        <span className="material-symbols-outlined text-base leading-none">{busy ? "hourglass_top" : "ios_share"}</span>
      </button>
    </div>
  );
}
