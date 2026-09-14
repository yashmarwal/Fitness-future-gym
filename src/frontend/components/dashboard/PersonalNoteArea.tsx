"use client";

import { useRef } from "react";
import { useSavedNote, saveNote } from "@/frontend/lib/personalNote";

export default function PersonalNoteArea() {
  // Only used to seed the initial value — see the `key` trick below for why
  // an uncontrolled textarea (not value+onChange+useState) is the lint-safe
  // way to hydrate this without a synchronous setState-in-effect.
  const savedNote = useSavedNote();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveNote(value), 400);
  }

  return (
    <div className="bg-surface-container-low p-4 shadow-hard flex flex-col gap-2 mb-6">
      <span className="flex items-center gap-1.5 font-label text-xs uppercase tracking-widest text-primary-container">
        <span className="material-symbols-outlined text-base leading-none">edit_note</span>
        Your Note
      </span>
      <textarea
        // Remounts (and re-seeds defaultValue) the one time the stored value
        // flips from the server-safe "" to the real localStorage content —
        // an uncontrolled input can't otherwise pick up a changed defaultValue.
        key={savedNote}
        defaultValue={savedNote}
        onChange={(e) => handleChange(e.target.value)}
        rows={2}
        placeholder="A goal, a reminder to yourself, anything — saved on this device only."
        className="w-full bg-surface-container border border-surface-variant text-on-surface font-body text-sm px-3 py-2 outline-none focus:border-primary-container resize-none"
      />
      <span className="font-body text-[10px] text-outline">Auto-saved on this device only — not shared with anyone.</span>
    </div>
  );
}
