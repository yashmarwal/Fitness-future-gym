"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getConsent, setConsent, type ConsentChoices } from "@/frontend/lib/cookieConsent";

const ALL_ON: ConsentChoices = { functional: true, analytics: true, marketing: true };
const ALL_OFF: ConsentChoices = { functional: false, analytics: false, marketing: false };

// Shown once, on any page, until the visitor makes a choice — same
// site-wide-utility-banner pattern as PwaInstallPrompt.tsx (rendered once in
// the root layout, reads its own localStorage-backed state, renders nothing
// once decided). "Reject Non-Essential" and the customize toggles are real:
// nothing that checks hasConsent()/getConsent() (currently just the Location
// page's Google Maps embed) loads until its category is actually on.
export default function CookieConsentBanner() {
  // "checking" avoids the hydration mismatch every other client-only-state
  // component in this app avoids the same way (see NotificationsCard.tsx) —
  // localStorage genuinely can't be read during SSR/first paint.
  const [visible, setVisible] = useState<"checking" | boolean>("checking");
  const [customizing, setCustomizing] = useState(false);
  const [choices, setChoices] = useState<ConsentChoices>(ALL_OFF);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(!getConsent().decided);
  }, []);

  if (visible !== true) return null;

  function accept(finalChoices: ConsentChoices) {
    setConsent(finalChoices);
    setVisible(false);
  }

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:max-w-md z-50 bg-surface-container-high rounded-2xl shadow-soft-lg p-4 flex flex-col gap-3">
      <p className="font-body text-sm text-on-surface leading-relaxed">
        We use essential cookies to run this site, plus a few optional ones (like our embedded map) that only
        load if you allow them. See our{" "}
        <Link href="/cookies-policy" className="text-primary-container hover:underline">Cookies Policy</Link>.
      </p>

      {customizing && (
        <div className="flex flex-col gap-2 border-t border-surface-variant/40 pt-3">
          <ConsentToggle
            label="Functional"
            hint="Embedded Google Map on our Location page"
            checked={choices.functional}
            onChange={(v) => setChoices((c) => ({ ...c, functional: v }))}
          />
          <ConsentToggle
            label="Analytics"
            hint="Not currently used on this site"
            checked={choices.analytics}
            onChange={(v) => setChoices((c) => ({ ...c, analytics: v }))}
          />
          <ConsentToggle
            label="Marketing"
            hint="Not currently used on this site"
            checked={choices.marketing}
            onChange={(v) => setChoices((c) => ({ ...c, marketing: v }))}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {customizing ? (
          <button
            onClick={() => accept(choices)}
            className="rounded-lg bg-primary-container text-on-primary-container font-label text-[10px] uppercase font-bold px-4 py-2.5"
          >
            Save Preferences
          </button>
        ) : (
          <>
            <button
              onClick={() => accept(ALL_ON)}
              className="rounded-lg bg-primary-container text-on-primary-container font-label text-[10px] uppercase font-bold px-4 py-2.5"
            >
              Accept All
            </button>
            <button
              onClick={() => accept(ALL_OFF)}
              className="rounded-lg bg-surface-container text-on-surface-variant font-label text-[10px] uppercase font-bold px-4 py-2.5"
            >
              Reject Non-Essential
            </button>
            <button
              onClick={() => setCustomizing(true)}
              className="font-label text-[10px] uppercase text-on-surface-variant hover:text-primary-container transition-colors px-2"
            >
              Customize
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ConsentToggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 shrink-0 accent-primary-container"
      />
      <span className="flex flex-col">
        <span className="font-label text-[11px] uppercase tracking-wide text-on-surface">{label}</span>
        <span className="font-body text-[10px] text-tertiary">{hint}</span>
      </span>
    </label>
  );
}
