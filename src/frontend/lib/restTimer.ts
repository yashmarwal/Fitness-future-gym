import { useSyncExternalStore } from "react";

// The inline Rest Timer bar (RestTimerBar.tsx, shown on the workouts page)
// used to keep its countdown in plain component state, which meant
// navigating to any other page (even just tapping "Log Workout" → "Plan
// Workouts" and back) unmounted it and reset the countdown to the full
// preset. This moves the actual truth — is it running, and when does it
// end — into localStorage via the same useSyncExternalStore pattern used
// elsewhere in this app (workoutTimer.ts, personalNote.ts, trialClaim.ts),
// so the countdown (or a finished alarm) survives across navigations and
// even a page reload. The standalone /dashboard/timer page's RestTimer.tsx
// is untouched and still keeps its own separate, non-persisted state.

const STORAGE_KEY = "ff_rest_timer_v1";
const DEFAULT_DURATION = 60;

export type RestTimerState = {
  duration: number; // seconds — the selected preset length
  running: boolean;
  endsAt: number | null; // epoch ms this countdown completes at, only meaningful while running
  pausedRemaining: number; // seconds left, meaningful only while NOT running and NOT alarming
  alarming: boolean;
  soundOn: boolean;
};

const SERVER_STATE: RestTimerState = {
  duration: DEFAULT_DURATION,
  running: false,
  endsAt: null,
  pausedRemaining: DEFAULT_DURATION,
  alarming: false,
  soundOn: true,
};

function defaultState(): RestTimerState {
  return { ...SERVER_STATE };
}

let cachedRaw: string | null = null;
let cachedState: RestTimerState = SERVER_STATE;
const listeners = new Set<() => void>();

function readSnapshot(): RestTimerState {
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
    const parsed = raw ? (JSON.parse(raw) as Partial<RestTimerState>) : {};
    cachedState = {
      duration: typeof parsed.duration === "number" ? parsed.duration : DEFAULT_DURATION,
      running: Boolean(parsed.running),
      endsAt: typeof parsed.endsAt === "number" ? parsed.endsAt : null,
      pausedRemaining: typeof parsed.pausedRemaining === "number" ? parsed.pausedRemaining : DEFAULT_DURATION,
      alarming: Boolean(parsed.alarming),
      soundOn: parsed.soundOn !== false,
    };
  } catch {
    cachedState = defaultState();
  }
  return cachedState;
}

function commit(next: RestTimerState): void {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(next);
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Storage full or unavailable (private mode) — state still updates for
    // the rest of this session via the in-memory cache below, it just won't
    // persist across reloads.
  }
  cachedRaw = raw;
  cachedState = next;
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function useRestTimerState(): RestTimerState {
  return useSyncExternalStore(subscribe, readSnapshot, () => SERVER_STATE);
}

export function selectRestTimerPreset(seconds: number): void {
  commit({ duration: seconds, running: false, endsAt: null, pausedRemaining: seconds, alarming: false, soundOn: readSnapshot().soundOn });
}

export function startRestTimer(now: number = Date.now()): void {
  const state = readSnapshot();
  if (state.running || state.pausedRemaining <= 0) return;
  commit({ ...state, running: true, endsAt: now + state.pausedRemaining * 1000, alarming: false });
}

export function pauseRestTimer(now: number = Date.now()): void {
  const state = readSnapshot();
  if (!state.running || state.endsAt == null) return;
  const remaining = Math.max(0, Math.ceil((state.endsAt - now) / 1000));
  commit({ ...state, running: false, endsAt: null, pausedRemaining: remaining });
}

export function resetRestTimer(): void {
  const state = readSnapshot();
  commit({ ...state, running: false, endsAt: null, pausedRemaining: state.duration, alarming: false });
}

export function setRestTimerSound(soundOn: boolean): void {
  commit({ ...readSnapshot(), soundOn });
}

// Called periodically while a countdown might be running (see
// RestTimerBar's tick effect) — flips to "alarming" once endsAt has
// passed, whether that happens while the bar is mounted and counting down,
// or is discovered on remount after the member was away on another page
// for longer than the remaining time. Returns whether it just fired, so
// the caller can play the finish sound/vibration exactly once.
export function tickRestTimer(now: number = Date.now()): boolean {
  const state = readSnapshot();
  if (!state.running || state.endsAt == null) return false;
  if (now < state.endsAt) return false;
  commit({ ...state, running: false, endsAt: null, pausedRemaining: 0, alarming: true });
  return true;
}

export function getRemainingSeconds(state: RestTimerState, now: number): number {
  if (state.alarming) return 0;
  if (state.running && state.endsAt != null) return Math.max(0, Math.ceil((state.endsAt - now) / 1000));
  return state.pausedRemaining;
}
