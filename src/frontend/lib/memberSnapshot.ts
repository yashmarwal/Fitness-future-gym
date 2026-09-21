import { daysBetweenIstDates, getIstDateString } from "@/frontend/lib/date";
import { matchExerciseCategory } from "@/frontend/lib/exerciseLibrary";

// Turns a member's own data into the figures and one-line insights shown in
// the dashboard's Snapshot bar. Pure and deterministic — no network, no AI:
// every sentence is picked by a fixed rule from real figures, so it's free,
// instant, and can never say something the data doesn't support. Inputs are
// plain structural types (not the backend services' types) so this stays in
// frontend/ without importing anything server-only.
export type SnapshotInput = {
  member: {
    currentStreakDays: number;
    longestStreakDays: number;
    feeDueDate: string | null;
    plan: string | null;
    joinedAt: string | null;
  };
  /** Check-in instants (ISO), any order. Kept ~30 days by the app. */
  attendance: string[];
  workoutLogs: { exerciseName: string; sets: number; reps: number; weightKg: number | null; loggedAt: string }[];
  todaysFood: { calories: number; proteinG: number | null; carbsG: number | null; fatG: number | null }[];
  personalRecords: { exerciseName: string; bestWeightKg: number | null; bestReps: number; achievedAt: string }[];
  muscleProgress: {
    category: string;
    xp: number;
    rankName: string;
    rankIndex: number;
    xpIntoRank: number;
    xpForNextRank: number | null;
    progressPct: number;
    maxed: boolean;
  }[];
  now?: Date;
};

export type SnapshotDay = { date: string; label: string; fullLabel: string; trained: boolean; isToday: boolean };
export type HeatCell = { date: string; level: 0 | 1 | 2; isToday: boolean };
export type SnapshotInsight = { icon: string; text: string };

export type MemberSnapshot = {
  /** One line for the collapsed bar. */
  teaser: string;
  week: { days: SnapshotDay[]; trainedCount: number; previousCount: number; goal: number; goalRemaining: number };
  streak: { current: number; best: number };
  lifting: {
    sets: number;
    volumeKg: number;
    exercises: number;
    heaviest: { name: string; weightKg: number; reps: number } | null;
  };
  /** Rolling 28 days, oldest first. */
  activity: { cells: HeatCell[]; sessions: number; perWeek: number };
  habits: { bestDays: string[]; timeOfDay: "Morning" | "Evening" | "Mixed" | null };
  balance: { parts: { category: string; sets: number; pct: number }[]; untrained: string[] };
  nutrition: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    meals: number;
    /** Share of macro calories; null when no macros were logged. */
    split: { proteinPct: number; carbsPct: number; fatPct: number } | null;
  };
  records: {
    thisMonth: number;
    latest: { name: string; weightKg: number | null; reps: number } | null;
    recent: { name: string; weightKg: number | null; reps: number; daysAgo: number }[];
  };
  rank: {
    category: string;
    rankName: string;
    rankIndex: number;
    progressPct: number;
    xpToNext: number | null;
    maxed: boolean;
  } | null;
  membership: { plan: string | null; since: string | null; months: number };
  fee: { kind: "none" | "ok" | "soon" | "today" | "overdue"; days: number; label: string };
  insights: SnapshotInsight[];
};

// The default target the weekly progress bar aims at. A round, achievable
// number for a gym-goer, not a claim about any one member's plan.
export const WEEKLY_GOAL_DAYS = 4;

const DAY_MS = 86_400_000;
const WEEK_DAYS = 7;
const HEAT_DAYS = 28;
const MONTH_DAYS = 30;
const MAIN_MUSCLES = ["Chest", "Back", "Shoulders", "Legs", "Arms", "Core"];

function istDate(iso: string): string {
  return getIstDateString(new Date(iso));
}

function istWeekday(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", timeZone: "Asia/Kolkata" });
}

function istHour(iso: string): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false }).formatToParts(new Date(iso));
  return Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function formatWeight(kg: number): string {
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(1);
}

function recordLabel(r: { exerciseName: string; bestWeightKg: number | null; bestReps: number }): string {
  return r.bestWeightKg != null ? `${r.exerciseName} ${formatWeight(r.bestWeightKg)}kg × ${r.bestReps}` : `${r.exerciseName} ${r.bestReps} reps`;
}

function joinNatural(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function buildMemberSnapshot(input: SnapshotInput): MemberSnapshot {
  const now = input.now ?? new Date();
  const today = getIstDateString(now);

  // The IST calendar days from `from` days back to `to` days back, oldest first.
  const datesBack = (from: number, to: number) =>
    Array.from({ length: from - to + 1 }, (_, i) => getIstDateString(new Date(now.getTime() - (from - i) * DAY_MS)));
  const weekDates = datesBack(WEEK_DAYS - 1, 0);
  const previousDates = datesBack(WEEK_DAYS * 2 - 1, WEEK_DAYS);
  const heatDates = datesBack(HEAT_DAYS - 1, 0);

  // "Trained" = checked in OR logged a workout that day.
  const attendedCounts = new Map<string, number>();
  for (const iso of input.attendance) attendedCounts.set(istDate(iso), (attendedCounts.get(istDate(iso)) ?? 0) + 1);
  const loggedDates = new Set(input.workoutLogs.map((l) => istDate(l.loggedAt)));
  const trained = (date: string) => attendedCounts.has(date) || loggedDates.has(date);

  const days: SnapshotDay[] = weekDates.map((date) => {
    const noon = new Date(`${date}T12:00:00+05:30`);
    const short = noon.toLocaleDateString("en-US", { weekday: "short", timeZone: "Asia/Kolkata" });
    const full = noon.toLocaleDateString("en-US", { weekday: "long", timeZone: "Asia/Kolkata" });
    return { date, label: short.charAt(0), fullLabel: full, trained: trained(date), isToday: date === today };
  });
  const trainedCount = days.filter((d) => d.trained).length;
  const previousCount = previousDates.filter(trained).length;
  const goalRemaining = Math.max(0, WEEKLY_GOAL_DAYS - trainedCount);

  // Rolling four-week activity.
  const cells: HeatCell[] = heatDates.map((date) => {
    const visits = attendedCounts.get(date) ?? 0;
    const level: 0 | 1 | 2 = visits >= 2 ? 2 : visits === 1 || loggedDates.has(date) ? 1 : 0;
    return { date, level, isToday: date === today };
  });
  const sessions = heatDates.filter(trained).length;
  const perWeek = Math.round((sessions / (HEAT_DAYS / WEEK_DAYS)) * 10) / 10;

  // Habits from the check-ins of the last 30 days.
  const monthStart = getIstDateString(new Date(now.getTime() - (MONTH_DAYS - 1) * DAY_MS));
  const monthCheckIns = input.attendance.filter((iso) => istDate(iso) >= monthStart);
  const weekdayCounts = new Map<string, number>();
  let morning = 0;
  for (const iso of monthCheckIns) {
    weekdayCounts.set(istWeekday(iso), (weekdayCounts.get(istWeekday(iso)) ?? 0) + 1);
    if (istHour(iso) < 14) morning++;
  }
  const rankedDays = [...weekdayCounts.entries()].sort((a, b) => b[1] - a[1]);
  const bestDays = monthCheckIns.length >= 4 ? rankedDays.filter(([, n]) => n >= 2).slice(0, 2).map(([d]) => d) : [];
  let timeOfDay: MemberSnapshot["habits"]["timeOfDay"] = null;
  if (monthCheckIns.length >= 5) {
    const share = morning / monthCheckIns.length;
    timeOfDay = share >= 0.65 ? "Morning" : share <= 0.35 ? "Evening" : "Mixed";
  }

  // Lifting this week.
  const weekSet = new Set(weekDates);
  const weekLogs = input.workoutLogs.filter((l) => weekSet.has(istDate(l.loggedAt)));
  let volumeKg = 0;
  let heaviest: MemberSnapshot["lifting"]["heaviest"] = null;
  for (const log of weekLogs) {
    if (log.weightKg != null && log.weightKg > 0) {
      volumeKg += log.sets * log.reps * log.weightKg;
      if (!heaviest || log.weightKg > heaviest.weightKg) {
        heaviest = { name: log.exerciseName, weightKg: log.weightKg, reps: log.reps };
      }
    }
  }
  const lifting = {
    sets: weekLogs.reduce((sum, l) => sum + l.sets, 0),
    volumeKg: Math.round(volumeKg),
    exercises: new Set(weekLogs.map((l) => l.exerciseName.trim().toLowerCase())).size,
    heaviest,
  };

  // Muscle balance: this week's sets by muscle group, via the same matcher
  // that awards Muscle Progress XP. Unrecognised exercises just aren't counted.
  const setsByCategory = new Map<string, number>();
  for (const log of weekLogs) {
    const category = matchExerciseCategory(log.exerciseName);
    if (category) setsByCategory.set(category, (setsByCategory.get(category) ?? 0) + log.sets);
  }
  const totalCategorised = [...setsByCategory.values()].reduce((sum, n) => sum + n, 0);
  const parts = [...setsByCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, sets]) => ({ category, sets, pct: Math.max(1, Math.round((sets / totalCategorised) * 100)) }));
  const balance = {
    parts,
    untrained: totalCategorised > 0 ? MAIN_MUSCLES.filter((m) => !setsByCategory.has(m)) : [],
  };

  // Nutrition today.
  const sum = (pick: (f: SnapshotInput["todaysFood"][number]) => number | null) =>
    Math.round(input.todaysFood.reduce((total, f) => total + (pick(f) ?? 0), 0));
  const proteinG = sum((f) => f.proteinG);
  const carbsG = sum((f) => f.carbsG);
  const fatG = sum((f) => f.fatG);
  const macroCalories = proteinG * 4 + carbsG * 4 + fatG * 9;
  const nutrition = {
    calories: Math.round(input.todaysFood.reduce((total, f) => total + f.calories, 0)),
    proteinG,
    carbsG,
    fatG,
    meals: input.todaysFood.length,
    split:
      macroCalories > 0
        ? {
            proteinPct: Math.round(((proteinG * 4) / macroCalories) * 100),
            carbsPct: Math.round(((carbsG * 4) / macroCalories) * 100),
            fatPct: Math.round(((fatG * 9) / macroCalories) * 100),
          }
        : null,
  };

  // Personal records (the service returns newest first).
  const recordMonthStart = getIstDateString(new Date(now.getTime() - (MONTH_DAYS - 1) * DAY_MS));
  const latestRecord = input.personalRecords[0] ?? null;
  const records = {
    thisMonth: input.personalRecords.filter((r) => istDate(r.achievedAt) >= recordMonthStart).length,
    latest: latestRecord
      ? { name: latestRecord.exerciseName, weightKg: latestRecord.bestWeightKg, reps: latestRecord.bestReps }
      : null,
    recent: input.personalRecords.slice(0, 3).map((r) => ({
      name: r.exerciseName,
      weightKg: r.bestWeightKg,
      reps: r.bestReps,
      daysAgo: Math.max(0, daysBetweenIstDates(istDate(r.achievedAt), today)),
    })),
  };

  // The muscle group they're strongest in (most XP). Nothing yet → no rank row.
  const top = [...input.muscleProgress].sort((a, b) => b.xp - a.xp)[0];
  const rank =
    top && top.xp > 0
      ? {
          category: top.category,
          rankName: top.rankName,
          rankIndex: top.rankIndex,
          progressPct: top.progressPct,
          xpToNext: top.xpForNextRank != null ? Math.max(0, top.xpForNextRank - top.xpIntoRank) : null,
          maxed: top.maxed,
        }
      : null;

  let fee: MemberSnapshot["fee"] = { kind: "none", days: 0, label: "No fee due date" };
  if (input.member.feeDueDate) {
    const days = daysBetweenIstDates(today, input.member.feeDueDate.slice(0, 10));
    if (days < 0) fee = { kind: "overdue", days: -days, label: `Fee overdue ${plural(-days, "day")}` };
    else if (days === 0) fee = { kind: "today", days: 0, label: "Fee due today" };
    else if (days <= 7) fee = { kind: "soon", days, label: `Fee due in ${plural(days, "day")}` };
    else fee = { kind: "ok", days, label: `Fee due in ${days} days` };
  }

  let membership: MemberSnapshot["membership"] = { plan: input.member.plan, since: null, months: 0 };
  if (input.member.joinedAt) {
    const joined = input.member.joinedAt.slice(0, 10);
    membership = {
      plan: input.member.plan,
      since: new Date(`${joined}T12:00:00+05:30`).toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "Asia/Kolkata" }),
      months: Math.max(0, Math.floor(daysBetweenIstDates(joined, today) / 30.4)),
    };
  }

  const streak = { current: input.member.currentStreakDays, best: input.member.longestStreakDays };

  // ── One-line insights, most useful first. Each is chosen by a rule from the
  // figures above.
  const insights: SnapshotInsight[] = [];

  if (trainedCount === 0 && streak.current === 0) {
    insights.push({ icon: "bolt", text: "No sessions yet this week — today's a good day to start." });
  } else {
    const diff = trainedCount - previousCount;
    const vs =
      previousCount === 0 && trainedCount > 0
        ? "a fresh start after a quiet week"
        : diff > 0
          ? `${plural(diff, "day")} more than last week`
          : diff < 0
            ? `${plural(-diff, "day")} fewer than last week`
            : "the same as last week";
    insights.push({ icon: "calendar_month", text: `You've trained ${plural(trainedCount, "day")} in the last 7 — ${vs}.` });
    insights.push({
      icon: "stars",
      text:
        goalRemaining === 0
          ? `Weekly goal of ${WEEKLY_GOAL_DAYS} days reached. Anything more is a bonus.`
          : `${plural(goalRemaining, "more day")} to hit a weekly goal of ${WEEKLY_GOAL_DAYS}.`,
    });
  }

  if (streak.current >= 2) {
    const toBest = streak.best - streak.current;
    insights.push({
      icon: "local_fire_department",
      text:
        toBest > 0
          ? `${streak.current}-day streak — ${plural(toBest, "more day")} to beat your best of ${streak.best}.`
          : `${streak.current}-day streak — your best ever. Keep it alive.`,
    });
  }

  if (lifting.heaviest) {
    insights.push({
      icon: "fitness_center",
      text: `${lifting.volumeKg.toLocaleString("en-IN")} kg lifted this week across ${plural(lifting.sets, "set")}. Heaviest: ${lifting.heaviest.name} ${formatWeight(lifting.heaviest.weightKg)}kg.`,
    });
  } else if (lifting.sets > 0) {
    insights.push({ icon: "fitness_center", text: `${plural(lifting.sets, "set")} logged this week across ${plural(lifting.exercises, "exercise")}.` });
  }

  if (balance.untrained.length > 0 && balance.untrained.length <= 4) {
    insights.push({ icon: "accessibility_new", text: `No ${joinNatural(balance.untrained)} work logged this week — worth a look.` });
  }

  if (records.thisMonth > 0 && records.latest) {
    insights.push({
      icon: "emoji_events",
      text: `${plural(records.thisMonth, "personal record")} in the last 30 days — latest: ${recordLabel({ exerciseName: records.latest.name, bestWeightKg: records.latest.weightKg, bestReps: records.latest.reps })}.`,
    });
  }

  if (rank) {
    insights.push({
      icon: "military_tech",
      text: rank.maxed
        ? `${rank.rankName} in ${rank.category} — the top rank. Nothing left to climb there.`
        : `${rank.rankName} in ${rank.category} — ${rank.xpToNext} XP to the next rank.`,
    });
  }

  if (bestDays.length > 0) {
    const when = timeOfDay === "Morning" ? ", usually in the morning" : timeOfDay === "Evening" ? ", usually in the evening" : "";
    insights.push({ icon: "schedule", text: `You train most on ${joinNatural(bestDays.map((d) => `${d}s`))}${when}.` });
  }

  insights.push({
    icon: "restaurant",
    text:
      nutrition.meals > 0
        ? `Today: ${nutrition.calories.toLocaleString("en-IN")} kcal and ${nutrition.proteinG}g protein across ${plural(nutrition.meals, "meal")}.`
        : "Nothing logged for food today — add a meal to track your calories and protein.",
  });

  if (fee.kind === "overdue" || fee.kind === "today" || fee.kind === "soon") {
    insights.push({ icon: "payments", text: `${fee.label} — pay at the front desk to keep your access.` });
  }

  // The collapsed bar's single line — kept to two parts so it fits a phone.
  const teaserParts = [`${trainedCount}/7 days`];
  if (streak.current >= 2) teaserParts.push(`${streak.current}-day streak`);
  else if (nutrition.calories > 0) teaserParts.push(`${nutrition.calories.toLocaleString("en-IN")} kcal`);
  else if (lifting.volumeKg > 0) teaserParts.push(`${lifting.volumeKg.toLocaleString("en-IN")} kg lifted`);

  return {
    teaser: teaserParts.join(" · "),
    week: { days, trainedCount, previousCount, goal: WEEKLY_GOAL_DAYS, goalRemaining },
    streak,
    lifting,
    activity: { cells, sessions, perWeek },
    habits: { bestDays, timeOfDay },
    balance,
    nutrition,
    records,
    rank,
    membership,
    fee,
    insights,
  };
}
