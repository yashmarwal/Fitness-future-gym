import Link from "next/link";
import Image from "next/image";

// Two pills side by side, not one full-width pill — Personal Records
// (unchanged link) and Achievements (the hub for the downloadable/
// shareable PR/stats/streak cards, see dashboard/achievements/page.tsx).
// Achievements needs its own entry point here since it briefly lived inside
// the dashboard tiles' center-hub circle, which was removed when those
// tiles reverted to their plain original design. Icon + label only, no
// subtitle line — at half-width each, a subtitle (latest record name, or
// "Share your stats") had no room to breathe and just truncated awkwardly
// ("Reverse Wr…") no matter how it was shortened, so it no longer takes
// `records` at all (nothing left inside it needs that data).
export default function PersonalRecordsBar() {
  return (
    <div className="flex gap-3 mb-6">
      <Link
        href="/dashboard/records"
        className="relative overflow-hidden bg-black flex-1 min-w-0 flex items-center gap-3 pl-3 pr-4 py-3 shadow-soft rounded-full border-2 border-surface-variant hover:border-primary-container transition-colors"
      >
        <Image src="/images/dashboard-stats/personal-records.jpg" alt="" fill priority sizes="50vw" className="object-cover pointer-events-none" />
        <span className="relative z-10 w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-soft bg-surface-container-high text-primary-container">
          <span className="material-symbols-outlined text-lg leading-none">emoji_events</span>
        </span>
        <p className="relative z-10 flex-1 min-w-0 font-label text-xs uppercase tracking-wide text-white truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          Personal Records
        </p>
      </Link>
      <Link
        href="/dashboard/achievements"
        className="relative overflow-hidden bg-black flex-1 min-w-0 flex items-center gap-3 pl-3 pr-4 py-3 shadow-soft rounded-full border-2 border-surface-variant hover:border-primary-container transition-colors"
      >
        <Image src="/images/dashboard-stats/achievements.jpg" alt="" fill priority sizes="50vw" className="object-cover pointer-events-none" />
        <span className="relative z-10 w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-soft bg-surface-container-high text-primary-container">
          <span className="material-symbols-outlined text-lg leading-none">workspace_premium</span>
        </span>
        <p className="relative z-10 flex-1 min-w-0 font-label text-xs uppercase tracking-wide text-white truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          Achievements
        </p>
      </Link>
    </div>
  );
}
