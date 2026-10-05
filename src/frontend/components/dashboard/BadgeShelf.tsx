"use client";

import { useState } from "react";
import { BADGES, type BadgeId } from "@/frontend/lib/badges";
import { fetchCardFile, shareOrDownloadCard } from "@/frontend/lib/shareCard";

type EarnedMap = Partial<Record<BadgeId, string>>;

const GROUP_ORDER = ["Attendance", "Strength", "Muscle Rank", "Playground"] as const;

function formatEarnedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
}

function BadgeTile({ id, name, description, icon, earnedAt }: { id: BadgeId; name: string; description: string; icon: string; earnedAt?: string }) {
  const [busy, setBusy] = useState(false);
  const earned = earnedAt != null;

  async function handleShare() {
    setBusy(true);
    try {
      const url = `/api/dashboard/achievement-card?type=badge&badge=${encodeURIComponent(id)}`;
      const filename = `fitness-future-badge-${id.replace(/_/g, "-")}.png`;
      const file = await fetchCardFile(url, filename);
      await shareOrDownloadCard(file, `${name} Badge`, `I just earned the ${name} badge at Fitness Future Gym 🏅`);
    } catch {
      // Best-effort — a failed share on one tile isn't worth a page banner.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`flex flex-col items-center text-center gap-2 p-4 rounded-2xl shadow-soft ${
        earned ? "bg-surface-container-low" : "bg-surface-container-low opacity-50"
      }`}
    >
      <span
        className={`w-14 h-14 rounded-full flex items-center justify-center ${
          earned ? "bg-primary-container text-on-primary-container" : "bg-surface-container-high text-tertiary"
        }`}
      >
        <span className="material-symbols-outlined text-2xl leading-none">{earned ? icon : "lock"}</span>
      </span>
      <p className="font-label text-xs uppercase tracking-wide text-on-surface leading-snug">{name}</p>
      {earned ? (
        <>
          <p className="font-body text-[11px] text-tertiary">{formatEarnedDate(earnedAt)}</p>
          <button
            type="button"
            onClick={handleShare}
            disabled={busy}
            aria-label={`Share ${name} badge`}
            className="mt-1 flex items-center gap-1 font-label text-[10px] uppercase text-primary-container hover:text-secondary transition-colors disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-sm leading-none">{busy ? "hourglass_top" : "ios_share"}</span>
            Share
          </button>
        </>
      ) : (
        <p className="font-body text-[11px] text-tertiary leading-snug">{description}</p>
      )}
    </div>
  );
}

// Earned badges shown in full color with their date and a share action;
// locked ones dimmed with a lock icon and the description doubling as the
// "how to unlock" hint — same "what's earned vs locked" posture
// AlertSummaryPill's admin-side counterpart uses, just without needing a
// separate toggle to see what's still ahead.
export default function BadgeShelf({ earned }: { earned: EarnedMap }) {
  return (
    <div className="flex flex-col gap-6">
      {GROUP_ORDER.map((group) => {
        const groupBadges = BADGES.filter((b) => b.group === group);
        if (groupBadges.length === 0) return null;
        return (
          <div key={group} className="flex flex-col gap-3">
            <h2 className="font-label text-xs uppercase tracking-widest text-tertiary">{group}</h2>
            <div className="grid grid-cols-3 gap-3">
              {groupBadges.map((b) => (
                <BadgeTile key={b.id} id={b.id} name={b.name} description={b.description} icon={b.icon} earnedAt={earned[b.id]} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
