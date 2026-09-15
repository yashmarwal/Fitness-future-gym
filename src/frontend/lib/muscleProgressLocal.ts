// Tracks which rank the member last SAW per muscle group, purely so the
// Muscle Progress page knows when to show a "leveled up" celebration
// instead of silently jumping straight to the new rank. This is UI-only
// state — the real XP/rank truth always comes from the server
// (member_muscle_xp via muscleProgress.ts) — so losing this (private
// browsing, cleared site data) just means the next celebration is skipped
// once, never a wrong rank shown.
const STORAGE_KEY = "ff_muscle_last_seen_ranks";

export function getLastSeenRanks(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function saveLastSeenRanks(ranks: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ranks));
  } catch {
    // best-effort only
  }
}
