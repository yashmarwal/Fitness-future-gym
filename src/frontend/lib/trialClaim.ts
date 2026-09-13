import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ff_trial_claim";

export type TrialClaim = {
  phone: string;
  trialCode: string;
  endsAt: string;
};

// getSnapshot must return a referentially stable value when the underlying
// data hasn't changed, or useSyncExternalStore treats every render as a new
// snapshot and errors with "should be cached to avoid an infinite loop" —
// JSON.parse-ing localStorage fresh on every call (as this used to) creates
// a new object reference each time even when the raw string is identical.
let cachedRaw: string | null = null;
let cachedValue: TrialClaim | null = null;

export function getTrialClaim(): TrialClaim | null {
  if (typeof window === "undefined") return null;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }

  if (raw === cachedRaw) return cachedValue;

  cachedRaw = raw;
  try {
    cachedValue = raw ? (JSON.parse(raw) as TrialClaim) : null;
  } catch {
    cachedValue = null;
  }
  return cachedValue;
}

export function saveTrialClaim(claim: TrialClaim) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(claim));
}

// No cross-tab reactivity needed — this device's saved claim doesn't change
// mid-session, so subscribe is a no-op.
function subscribe() {
  return () => {};
}

export function useTrialClaim(): TrialClaim | null {
  return useSyncExternalStore(subscribe, getTrialClaim, () => null);
}
