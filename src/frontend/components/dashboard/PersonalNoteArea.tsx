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
    <div className="flex items-center gap-3 bg-surface-container-low pl-4 pr-3 py-2.5 shadow-hard mb-6">
      <span className="material-symbols-outlined text-lg text-primary-container leading-none shrink-0">
        edit_note
      </span>
      <input
        // Remounts (and re-seeds defaultValue) the one time the stored value
        // flips from the server-safe "" to the real localStorage content —
        // an uncontrolled input can't otherwise pick up a changed defaultValue.
        key={savedNote}
        type="text"
        defaultValue={savedNote}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Your goal or a note to yourself — saved on this device only"
        className="flex-1 min-w-0 bg-transparent text-on-surface font-body text-sm outline-none placeholder:text-outline"
      />
      <span
        className="material-symbols-outlined text-sm text-outline leading-none shrink-0"
        title="Saved on this device only"
        aria-label="Saved on this device only"
      >
        lock
      </span>
    </div>
  );
}
