import { BADGES } from "@/frontend/lib/streak";
import { StatCard } from "@/frontend/components/dashboard/Primitives";

// Pure display now — no "use client" needed at all, since there's no
// interaction left here (the old manual tap-to-mark calendar was removed).
// Both numbers come straight from the member's real, permanent,
// server-tracked attendance streak (member.currentStreakDays/
// longestStreakDays — see attendance.ts::checkInMemberRow and
// member.ts::effectiveCurrentStreak), not a self-reported one.
export default function StreakTracker({
  currentStreakDays,
  longestStreakDays,
}: {
  currentStreakDays: number;
  longestStreakDays: number;
}) {
  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-md mx-auto">
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-2">Streak &amp; Achievements</h1>
      <p className="font-body text-sm text-tertiary mb-6">
        Based on your real check-ins at the gym — no manual marking, it just tracks itself. Miss a day and the
        current streak resets, but your longest streak ever is always kept.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <StatCard value={currentStreakDays} label="Current Streak" tone="accent" icon="local_fire_department" />
        <StatCard value={longestStreakDays} label="Longest Streak" icon="emoji_events" />
      </div>

      <h2 className="font-display text-lg text-on-surface uppercase tracking-wide mb-3">Achievements</h2>
      <div className="grid grid-cols-3 gap-2">
        {BADGES.map((badge) => {
          const unlocked = longestStreakDays >= badge.days;
          return (
            <div
              key={badge.days}
              className={`flex flex-col items-center gap-1 p-3 shadow-soft rounded-2xl text-center ${
                unlocked ? "bg-surface-container-low" : "bg-surface-container/40 opacity-50"
              }`}
            >
              <span
                className={`material-symbols-outlined text-2xl ${unlocked ? "text-primary-container" : "text-outline"}`}
              >
                {badge.icon}
              </span>
              <span className="font-label text-[9px] uppercase tracking-wide text-on-surface">{badge.name}</span>
              <span className="font-body text-[10px] text-tertiary">{badge.days} days</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
