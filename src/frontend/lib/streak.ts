// Achievement badges — unlocked based on the member's real, server-tracked
// longest attendance streak ever (members.longest_streak_days, see
// attendance.ts::checkInMemberRow), NOT the old self-reported client-side
// calendar this file used to hold. That manual "tap each day" tracker was
// removed once the real attendance streak became reliable (fixed 2026-09-16
// — see the streak-fix entry in memory) — keeping two different "streak"
// numbers on the dashboard that didn't necessarily agree with each other
// was more confusing than useful, and a badge for something the gym's own
// door-check-in already proves is more meaningful than one for a manually
// self-reported calendar anyway.
export const BADGES = [
  { days: 3, name: "Spark", icon: "bolt" },
  { days: 7, name: "Iron Week", icon: "military_tech" },
  { days: 14, name: "Two-Week Grind", icon: "workspace_premium" },
  { days: 30, name: "Iron Month", icon: "emoji_events" },
  { days: 60, name: "Iron Veteran", icon: "local_fire_department" },
  { days: 100, name: "Century Club", icon: "stars" },
] as const;
