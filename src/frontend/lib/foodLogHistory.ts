import { useSyncExternalStore } from "react";
import { getIstDateString } from "@/frontend/lib/date";

// A local "did I log food, and how much" glance strip — not the real
// nutrition record (that's food_logs in the database, the authoritative,
// cross-device source of truth already shown as "Today's Food Log" on the
// nutrition page, with its own 30-day server retention). This is a
// lightweight, same-device-only companion stat, same "vanity/awareness"
// reasoning as workoutTimer.ts's local tracker — purely for a quick "last
// few days at a glance" strip, nothing here is ever the real total.

const STORAGE_KEY = "ff_food_log_history_v2";
// Days kept in total, today included: today plus the 6 before it.
const RETENTION_DAYS = 7;

export type FoodLogEntry = {
  description: string;
  calories: number;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
};

export type FoodLogHistoryState = {
  days: Record<string, FoodLogEntry[]>; // logged items per IST calendar date
};

// A single frozen reference used for every SSR / pre-hydration render —
// useSyncExternalStore requires getServerSnapshot to return the same
// reference every call, same reasoning as workoutTimer.ts's SERVER_STATE.
const SERVER_STATE: FoodLogHistoryState = { days: {} };

function pruneDays(days: Record<string, FoodLogEntry[]>): Record<string, FoodLogEntry[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (RETENTION_DAYS - 1));
  const cutoffStr = getIstDateString(cutoff);
  const pruned: Record<string, FoodLogEntry[]> = {};
  for (const [date, entries] of Object.entries(days)) {
    if (date >= cutoffStr) pruned[date] = entries;
  }
  return pruned;
}

// getSnapshot must return a referentially stable value when the underlying
// data hasn't changed, or useSyncExternalStore errors with "should be
// cached to avoid an infinite loop" — same raw-string-caching approach as
// workoutTimer.ts.
let cachedRaw: string | null = null;
let cachedState: FoodLogHistoryState = SERVER_STATE;
const listeners = new Set<() => void>();

function readSnapshot(): FoodLogHistoryState {
  if (typeof window === "undefined") return SERVER_STATE;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedState;

  cachedRaw = raw;
  try {
    const parsed = raw ? (JSON.parse(raw) as Partial<FoodLogHistoryState>) : {};
    cachedState = { days: pruneDays(parsed.days && typeof parsed.days === "object" ? parsed.days : {}) };
  } catch {
    cachedState = { days: {} };
  }
  return cachedState;
}

function commit(next: FoodLogHistoryState): void {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(next);
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Storage full or unavailable (private mode) — state still updates for
    // the rest of this session via the in-memory cache below, it just won't
    // persist across reloads. Nothing else in the app depends on this data.
  }
  cachedRaw = raw;
  cachedState = next;
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function useFoodLogHistoryState(): FoodLogHistoryState {
  return useSyncExternalStore(subscribe, readSnapshot, () => SERVER_STATE);
}

// Called right after a food item is successfully logged — every call site
// that POSTs to /api/dashboard/food (FoodLogForm's manual entry and "Log
// Again", SavedMealsSection's quick-add) calls this too, so the strip
// reflects every logging path, not just one of them. Stores the full item,
// not just its calories, so a day's popup can show what was actually eaten.
export function recordFoodLogged(entry: FoodLogEntry, now: number = Date.now()): void {
  if (!Number.isFinite(entry.calories) || entry.calories <= 0) return;
  const state = readSnapshot();
  const today = getIstDateString(new Date(now));
  const days = { ...state.days, [today]: [...(state.days[today] ?? []), entry] };
  commit({ days: pruneDays(days) });
}

export type FoodHistoryDay = {
  date: string;
  label: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  items: FoodLogEntry[];
};

// Every retained day before today (oldest first, so a row of these reads
// left-to-right as the week unfolding), one entry per day regardless of
// whether anything was logged — a day with no items is a real day nothing
// was logged, not a gap to hide. Same non-skipping reasoning as
// workoutTimer.ts's getPreviousDays (an earlier version there skipped zero
// days, which silently mislabeled an older day's total as "yesterday's"
// whenever yesterday itself had nothing logged).
export function getPreviousFoodDays(state: FoodLogHistoryState, now: number): FoodHistoryDay[] {
  const out: FoodHistoryDay[] = [];
  for (let back = RETENTION_DAYS - 1; back >= 1; back--) {
    const date = getIstDateString(new Date(now - back * 86_400_000));
    const items = state.days[date] ?? [];
    const label = new Date(`${date}T12:00:00+05:30`).toLocaleDateString("en-IN", {
      weekday: "short",
      timeZone: "Asia/Kolkata",
    });
    out.push({
      date,
      label,
      calories: items.reduce((sum, i) => sum + i.calories, 0),
      proteinG: items.reduce((sum, i) => sum + (i.proteinG ?? 0), 0),
      carbsG: items.reduce((sum, i) => sum + (i.carbsG ?? 0), 0),
      fatG: items.reduce((sum, i) => sum + (i.fatG ?? 0), 0),
      items,
    });
  }
  return out;
}
