"use client";

import { useRef } from "react";
import { useSavedNote, saveNote } from "@/frontend/lib/personalNote";

export default function PersonalNoteArea() {
  // Only used to seed the initial value — see the `key` trick below for why
  // an uncontrolled input (not value+onChange+useState) is the lint-safe
  // way to hydrate this without a synchronous setState-in-effect.
  const savedNote = useSavedNote();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveNote(value), 400);
  }

  return (
    // A small corner tag notched into the bar's own top border — loosely
    // borrowed from a Uiverse.io neo-brutalist input concept, kept to just
    // that one motif (not the thick borders/3D tilt/hard offset shadow the
    // reference also had, which would've read as bulky rather than sleek).
    // Dark-on-orange instead of the bar's own orange-on-dark, so the tag
    // actually reads against the solid orange fill instead of disappearing
    // into it the way the attendance button's same-color trace line did.
    <div className="relative mt-3 mb-6">
      <span className="absolute -top-2 left-4 z-10 bg-on-primary-container text-primary-container border border-primary-container font-label text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
        My Goal
      </span>
      <div className="flex items-center gap-3 bg-primary-container text-on-primary-container pl-4 pr-3 py-3 shadow-soft rounded-2xl">
        <span className="material-symbols-outlined text-xl leading-none shrink-0">bolt</span>
        <input
          // Remounts (and re-seeds defaultValue) the one time the stored value
          // flips from the server-safe "" to the real localStorage content —
          // an uncontrolled input can't otherwise pick up a changed defaultValue.
          key={savedNote}
          type="text"
          defaultValue={savedNote}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Your Goal Or A Note To Yourself"
          className="flex-1 min-w-0 bg-transparent font-headline-sm text-lg uppercase tracking-wide outline-none placeholder:text-on-primary-container/70"
        />
        <span
          className="material-symbols-outlined text-base leading-none shrink-0 opacity-70"
          title="Saved on this device only"
          aria-label="Saved on this device only"
        >
          lock
        </span>
      </div>
    </div>
  );
}
