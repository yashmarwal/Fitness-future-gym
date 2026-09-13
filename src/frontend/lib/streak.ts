import { useSyncExternalStore } from "react";

// A separate, self-reported streak from the real attendance-based one shown
// on the dashboard overview (that one comes from actual gym check-ins) —
// this is a simple personal "did I do something today" calendar, entirely
// client-side, no server involved.
const STORAGE_KEY = "ff_streak_days";

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isSunday(d: Date): boolean {
  return d.getDay() === 0;
}

// getSnapshot must be referentially stable when the data hasn't changed
// (see trialClaim.ts/deviceMember.ts for the same fix) — cache by raw string.
let cachedRaw: string | null = null;
let cachedDates: string[] = [];

function readDates(): string[] {
  if (typeof window === "undefined") return [];
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedDates;
  cachedRaw = raw;
  try {
    cachedDates = raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    cachedDates = [];
  }
  return cachedDates;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("ff-streak-updated", callback);
  return () => window.removeEventListener("ff-streak-updated", callback);
}

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("ff-streak-updated"));
}

// A fresh `[]` literal is a new reference every call — unlike `null`/primitives,
// arrays fail useSyncExternalStore's reference-equality check even when
// "empty" both times, which is what triggered the "getServerSnapshot should
// be cached" loop warning. Return the same empty-array instance always.
const EMPTY_DATES: string[] = [];

function getServerSnapshot(): string[] {
  return EMPTY_DATES;
}

export function useStreakDates(): string[] {
  return useSyncExternalStore(subscribe, readDates, getServerSnapshot);
}

// Toggles a single calendar day. Only today or an earlier date makes sense
// (no marking the future) — callers should guard that in the UI.
export function toggleDate(dateStr: string) {
  if (typeof window === "undefined") return;
  const dates = new Set(readDates());
  if (dates.has(dateStr)) dates.delete(dateStr);
  else dates.add(dateStr);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(dates)));
  notify();
}

export function todayStr(): string {
  return toDateStr(new Date());
}

// Current streak: walk backward from yesterday counting consecutive checked
// non-Sunday days (Sundays are a free day — they neither extend nor break
// the streak), stopping at the first non-Sunday miss. Today itself only
// adds to the count once it's actually checked — the streak isn't "at risk"
// until a day is missed outright, matching how most streak trackers work.
export function computeCurrentStreak(dateStrings: string[]): number {
  const dates = new Set(dateStrings);
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  // Bounded loop (5 years) so a corrupted/huge dataset can't hang the UI.
  for (let i = 0; i < 365 * 5; i++) {
    if (isSunday(cursor)) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (dates.has(toDateStr(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  if (dates.has(todayStr())) streak++;
  return streak;
}

// Best streak ever, recomputed from history each time (no separate
// "best" value to keep in sync) — walks every day from the first checked
// date to today applying the same Sunday-skip rule, tracking the max run.
export function computeBestStreak(dateStrings: string[]): number {
  const dates = new Set(dateStrings);
  if (dates.size === 0) return 0;

  const sorted = Array.from(dates).sort();
  const cursor = new Date(sorted[0]);
  const end = new Date();
  end.setHours(0, 0, 0, 0);

  let running = 0;
  let best = 0;
  // Bounded loop (10 years) as a safety net against a corrupted dataset.
  for (let i = 0; i < 365 * 10 && cursor <= end; i++) {
    if (!isSunday(cursor)) {
      if (dates.has(toDateStr(cursor))) {
        running++;
        best = Math.max(best, running);
      } else {
        running = 0;
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return best;
}

export const BADGES = [
  { days: 3, name: "Spark", icon: "bolt" },
  { days: 7, name: "Iron Week", icon: "military_tech" },
  { days: 14, name: "Two-Week Grind", icon: "workspace_premium" },
  { days: 30, name: "Iron Month", icon: "emoji_events" },
  { days: 60, name: "Iron Veteran", icon: "local_fire_department" },
  { days: 100, name: "Century Club", icon: "stars" },
] as const;
