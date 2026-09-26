// Minimal, dependency-free consent store — localStorage-backed, three
// toggleable categories (essential is always on and isn't stored as a
// choice). Currently the only thing actually gated by a category is the
// Google Maps embed on the Location page (`functional`) — this site runs no
// analytics/marketing scripts today, but the categories exist now so a
// future script can check `hasConsent(...)` from day one instead of
// shipping untracked.
export type ConsentCategory = "functional" | "analytics" | "marketing";
export type ConsentChoices = { functional: boolean; analytics: boolean; marketing: boolean };
export type ConsentState = ConsentChoices & { decided: boolean };

const STORAGE_KEY = "ff-cookie-consent";
export const CONSENT_CHANGE_EVENT = "ff-consent-change";

const DEFAULT_CHOICES: ConsentChoices = { functional: false, analytics: false, marketing: false };

export function getConsent(): ConsentState {
  if (typeof window === "undefined") return { ...DEFAULT_CHOICES, decided: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CHOICES, decided: false };
    const parsed = JSON.parse(raw) as Partial<ConsentChoices>;
    return {
      functional: Boolean(parsed.functional),
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      decided: true,
    };
  } catch {
    return { ...DEFAULT_CHOICES, decided: false };
  }
}

export function setConsent(choices: ConsentChoices): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(choices));
  } catch {
    // Private browsing / storage disabled — the banner will just re-show
    // next visit rather than crash; nothing else depends on persistence.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: choices }));
}

export function hasConsent(category: ConsentCategory): boolean {
  return getConsent()[category];
}
