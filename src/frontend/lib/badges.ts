// The Achievement Badges catalog — shared between the backend's award-check
// (badges.ts) and the frontend badge shelf (dashboard/achievements) and
// share-card route, same "one shared definition" reasoning as
// streakTiers.ts. This file is pure data: no DB access, no thresholds
// duplicated anywhere else — badges.ts imports the numeric thresholds it
// needs to evaluate (streak/rank ones) from their own source of truth
// (streakTiers.ts, muscleProgress.ts) rather than this file re-stating them.

export type BadgeId =
  | "first_checkin"
  | "streak_bronze"
  | "streak_silver"
  | "streak_gold"
  | "streak_platinum"
  | "checkins_10"
  | "checkins_50"
  | "checkins_100"
  | "first_pr"
  | "prs_10"
  | "prs_25"
  | "bench_club"
  | "squat_club"
  | "deadlift_club"
  | "rank_gold"
  | "rank_diamond"
  | "rank_legend"
  | "well_rounded"
  | "playground_first_win"
  | "playground_5_wins"
  | "playground_15_wins";

export type BadgeDef = {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  // Groups the shelf into sections — purely a display concern, not used by
  // the award-check logic.
  group: "Attendance" | "Strength" | "Muscle Rank" | "Playground";
};

export const BADGES: BadgeDef[] = [
  { id: "first_checkin", name: "First Step", description: "Checked in for the first time.", icon: "flag", group: "Attendance" },
  { id: "streak_bronze", name: "7-Day Streak", description: "Trained 7 days in a row.", icon: "local_fire_department", group: "Attendance" },
  { id: "streak_silver", name: "30-Day Streak", description: "Trained 30 days in a row.", icon: "local_fire_department", group: "Attendance" },
  { id: "streak_gold", name: "60-Day Streak", description: "Trained 60 days in a row.", icon: "local_fire_department", group: "Attendance" },
  { id: "streak_platinum", name: "100-Day Streak", description: "Trained 100 days in a row.", icon: "local_fire_department", group: "Attendance" },
  { id: "checkins_10", name: "10 Check-Ins", description: "Checked in 10 times, ever.", icon: "event_available", group: "Attendance" },
  { id: "checkins_50", name: "50 Check-Ins", description: "Checked in 50 times, ever.", icon: "event_available", group: "Attendance" },
  { id: "checkins_100", name: "100 Check-Ins", description: "Checked in 100 times, ever.", icon: "event_available", group: "Attendance" },

  { id: "first_pr", name: "First Record", description: "Set your first personal record.", icon: "emoji_events", group: "Strength" },
  { id: "prs_10", name: "10 Records", description: "Set 10 personal records.", icon: "emoji_events", group: "Strength" },
  { id: "prs_25", name: "25 Records", description: "Set 25 personal records.", icon: "emoji_events", group: "Strength" },
  { id: "bench_club", name: "Bench Press Club", description: "Bench pressed 60kg or more.", icon: "fitness_center", group: "Strength" },
  { id: "squat_club", name: "Squat Club", description: "Squatted 100kg or more.", icon: "fitness_center", group: "Strength" },
  { id: "deadlift_club", name: "Deadlift Club", description: "Deadlifted 120kg or more.", icon: "fitness_center", group: "Strength" },

  { id: "rank_gold", name: "Gold Rank", description: "Reached Gold rank in a muscle category.", icon: "military_tech", group: "Muscle Rank" },
  { id: "rank_diamond", name: "Diamond Rank", description: "Reached Diamond rank in a muscle category.", icon: "military_tech", group: "Muscle Rank" },
  { id: "rank_legend", name: "Legend", description: "Reached Legend rank in a muscle category.", icon: "military_tech", group: "Muscle Rank" },
  { id: "well_rounded", name: "Well-Rounded", description: "Reached Silver rank or higher in every muscle category.", icon: "diversity_3", group: "Muscle Rank" },

  { id: "playground_first_win", name: "First Win", description: "Won a Playground challenge.", icon: "sports_score", group: "Playground" },
  { id: "playground_5_wins", name: "Playground Regular", description: "Won 5 Playground challenges.", icon: "sports_score", group: "Playground" },
  { id: "playground_15_wins", name: "Playground Champion", description: "Won 15 Playground challenges.", icon: "sports_score", group: "Playground" },
];

export const BADGE_MAP: Record<BadgeId, BadgeDef> = Object.fromEntries(BADGES.map((b) => [b.id, b])) as Record<BadgeId, BadgeDef>;
