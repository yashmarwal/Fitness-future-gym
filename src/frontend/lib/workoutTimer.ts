import { useSyncExternalStore } from "react";
import { getIstDateString } from "@/frontend/lib/date";

// A standalone "how long have I actually been working out" tracker — not
// the rest timer (RestTimer.tsx, unrelated and untouched). Lives entirely
// in localStorage, never the database: this is a lightweight vanity/
// awareness stat, not a record anyone needs to audit, so there's no reason
// to burn a table or a sync round-trip on it, and it naturally resets
// itself instead of ever needing a cleanup cron.
//
// Model: `days` holds only *flushed* (completed) milliseconds per IST
// calendar date. While running, the current segment (`now - startedAt`) is
// NOT yet in `days` — callers pass in `now` to add it for display. The
// widget flushes the running segment every FLUSH_INTERVAL_MS (resetting
// startedAt to now), so a crashed tab or force-closed browser loses at
// most one flush interval of time, never a whole session.

const STORAGE_KEY = "ff_workout_timer_v1";
const RETENTION_DAYS = 7;
export const INACTIVITY_LIMIT_MS = 10 * 60 * 1000;
export const FLUSH_INTERVAL_MS = 15_000;

export type WorkoutTimerState = {
  running: boolean;
  startedAt: number | null;
  startedDate: string | null; // IST date string the current segment began on
  lastActivityAt: number | null;
  days: Record<string, number>;
};

// A single frozen reference used for every SSR / pre-hydration render —
// useSyncExternalStore requires getServerSnapshot to return the same
// reference every call, or it treats each render as new state.
const SERVER_STATE: WorkoutTimerState = {
  running: false,
  startedAt: null,
  startedDate: null,
  lastActivityAt: null,
  days: {},
};

function emptyState(): WorkoutTimerState {
  return { running: false, startedAt: null, startedDate: null, lastActivityAt: null, days: {} };
}

function pruneDays(days: Record<string, number>): Record<string, number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
  const cutoffStr = getIstDateString(cutoff);
  const pruned: Record<string, number> = {};
  for (const [date, ms] of Object.entries(days)) {
    if (date >= cutoffStr) pruned[date] = ms;
  }
  return pruned;
}

// getSnapshot must return a referentially stable value when the underlying
// data hasn't changed, or useSyncExternalStore errors with "should be
// cached to avoid an infinite loop" — same raw-string-caching approach as
// trialClaim.ts's getTrialClaim.
let cachedRaw: string | null = null;
let cachedState: WorkoutTimerState = SERVER_STATE;
const listeners = new Set<() => void>();

function readSnapshot(): WorkoutTimerState {
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
    const parsed = raw ? (JSON.parse(raw) as Partial<WorkoutTimerState>) : {};
    cachedState = {
      running: Boolean(parsed.running),
      startedAt: typeof parsed.startedAt === "number" ? parsed.startedAt : null,
      startedDate: typeof parsed.startedDate === "string" ? parsed.startedDate : null,
      lastActivityAt: typeof parsed.lastActivityAt === "number" ? parsed.lastActivityAt : null,
      days: pruneDays(parsed.days && typeof parsed.days === "object" ? parsed.days : {}),
    };
  } catch {
    cachedState = emptyState();
  }
  return cachedState;
}

function commit(next: WorkoutTimerState): void {
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

export function useWorkoutTimerState(): WorkoutTimerState {
  return useSyncExternalStore(subscribe, readSnapshot, () => SERVER_STATE);
}

// Adds the current running segment into `days` and resets the segment to
// start fresh from `now`.
function flush(state: WorkoutTimerState, now: number): WorkoutTimerState {
  if (!state.running || state.startedAt == null || state.startedDate == null) return state;
  const elapsed = Math.max(0, now - state.startedAt);
  const days = { ...state.days, [state.startedDate]: (state.days[state.startedDate] ?? 0) + elapsed };
  return { ...state, days, startedAt: now, startedDate: getIstDateString(new Date(now)) };
}

export function startTimer(now: number = Date.now()): void {
  const state = readSnapshot();
  if (state.running) return;
  commit({ ...state, running: true, startedAt: now, startedDate: getIstDateString(new Date(now)), lastActivityAt: now });
}

export function stopTimer(now: number = Date.now()): void {
  const state = readSnapshot();
  if (!state.running) return;
  commit({ ...flush(state, now), running: false, startedAt: null, startedDate: null });
}

// Called on a periodic tick while running: flushes the segment so little
// is ever lost, then auto-stops if the member has gone quiet for too long.
export function tickWorkoutTimer(now: number = Date.now()): void {
  const state = readSnapshot();
  if (!state.running) return;
  if (state.lastActivityAt != null && now - state.lastActivityAt >= INACTIVITY_LIMIT_MS) {
    stopTimer(now);
    return;
  }
  commit(flush(state, now));
}

export function recordWorkoutActivity(now: number = Date.now()): void {
  const state = readSnapshot();
  if (!state.running) return;
  commit({ ...state, lastActivityAt: now });
}

// Total elapsed ms across the retained window, including the live segment
// if currently running — this is the headline "total workout time" figure.
export function getWeekTotalMs(state: WorkoutTimerState, now: number): number {
  const flushedTotal = Object.values(state.days).reduce((sum, ms) => sum + ms, 0);
  const liveSegment = state.running && state.startedAt != null ? Math.max(0, now - state.startedAt) : 0;
  return flushedTotal + liveSegment;
}

export function getTodayMs(state: WorkoutTimerState, now: number): number {
  const today = getIstDateString(new Date(now));
  const flushedToday = state.days[today] ?? 0;
  const liveSegment =
    state.running && state.startedAt != null && state.startedDate === today ? Math.max(0, now - state.startedAt) : 0;
  return flushedToday + liveSegment;
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${Math.floor((ms % 60_000) / 1000)}s`;
}
