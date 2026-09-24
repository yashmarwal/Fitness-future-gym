"use client";

import { useState } from "react";
import { parseIndianDob } from "@/frontend/lib/dateOfBirth";

// Free-typed, not a calendar picker — see dateOfBirth.ts for why. The
// member types whatever's natural ("7/9/2003", "7 9 2003", even
// "07092003"); on blur it's silently normalized to a clean DD/MM/YYYY
// display, or flagged if it genuinely can't be parsed. The parent only
// ever receives the raw text — SignupForm re-parses it to ISO right before
// submitting, so this component doesn't need to know anything about the
// API's format at all.
export default function DateOfBirthField({
  value,
  onChange,
  required,
}: {
  value: string;
  onChange: (raw: string) => void;
  required?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);

  function handleBlur() {
    if (!value.trim()) {
      setError(null);
      return;
    }
    const parsed = parseIndianDob(value);
    if (parsed) {
      onChange(parsed.display);
      setError(null);
    } else {
      setError("Didn't recognise that date — try DD/MM/YYYY, e.g. 07/09/2003.");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg leading-none pointer-events-none">
          cake
        </span>
        <input
          inputMode="numeric"
          autoComplete="bday"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (error) setError(null);
          }}
          onBlur={handleBlur}
          required={required}
          placeholder="DD/MM/YYYY, e.g. 07/09/2003"
          className={`w-full rounded-2xl bg-surface-container-low border text-on-surface font-body pl-11 pr-4 py-3.5 outline-none transition-colors ${
            error ? "border-error focus:border-error" : "border-surface-variant focus:border-primary-container"
          }`}
        />
      </div>
      {error && (
        <p className="animate-snap-in flex items-center gap-1 font-body text-xs text-error">
          <span className="material-symbols-outlined text-sm leading-none">error</span>
          {error}
        </p>
      )}
    </div>
  );
}
