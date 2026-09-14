import { useSyncExternalStore } from "react";

// A free-text note/goal, entirely client-side (localStorage) — the member
// can put anything in it (a goal, a reminder to themselves, whatever).
// Never touches the server, so there's no character limit or moderation
// concern to design around.
const STORAGE_KEY = "ff_dashboard_note";

// Unlike the array/object cases elsewhere (streak.ts, trialClaim.ts), no
// snapshot caching is needed here — strings are primitives, so two reads of
// the same value are always reference-equal on their own.
function readNote(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveNote(value: string) {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, value);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable (private mode etc.) — silently drop, the
    // textarea still works for the rest of the session either way.
  }
}

function subscribe() {
  return () => {};
}

// getServerSnapshot returns "" (a primitive, always reference-equal to
// itself) rather than reading anything — same reasoning as deviceMember.ts.
export function useSavedNote(): string {
  return useSyncExternalStore(subscribe, readNote, () => "");
}
