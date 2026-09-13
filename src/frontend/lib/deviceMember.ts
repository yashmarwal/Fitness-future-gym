import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ff_device_member";

export type DeviceMember = {
  name: string;
  membershipNumber: string;
};

// getSnapshot must return a referentially stable value when the underlying
// data hasn't changed, or useSyncExternalStore treats every render as a new
// snapshot and errors with "should be cached to avoid an infinite loop" —
// JSON.parse-ing localStorage fresh on every call (as this used to) creates
// a new object reference each time even when the raw string is identical.
let cachedRaw: string | null = null;
let cachedValue: DeviceMember | null = null;

export function getDeviceMember(): DeviceMember | null {
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
    cachedValue = raw ? (JSON.parse(raw) as DeviceMember) : null;
  } catch {
    cachedValue = null;
  }
  return cachedValue;
}

export function saveDeviceMember(member: DeviceMember) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
}

// No cross-tab reactivity needed — this device's saved identity doesn't
// change during a session — so subscribe is a no-op. Using
// useSyncExternalStore (rather than useState+useEffect) avoids both a
// hydration mismatch and an effect-body setState call.
function subscribe() {
  return () => {};
}

export function useDeviceMember(): DeviceMember | null {
  return useSyncExternalStore(subscribe, getDeviceMember, () => null);
}
