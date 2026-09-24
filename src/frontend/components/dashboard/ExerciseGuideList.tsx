"use client";

import { useState } from "react";
import type { ExerciseGuideEntry } from "@/frontend/lib/exerciseGuide";

function titleCase(text: string): string {
  return text.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Same smooth expand/collapse technique as WorkoutLogHistory.tsx's day
// drawers (grid-template-rows 0fr/1fr on an inner min-h-0 overflow-hidden
// wrapper) — same interaction language, not a new one-off pattern.
function ExerciseRow({ entry }: { entry: ExerciseGuideEntry }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-surface-container-low shadow-soft rounded-2xl border border-surface-variant/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
      >
        <span className="material-symbols-outlined text-lg leading-none text-primary-container shrink-0">
          fitness_center
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-label text-sm uppercase tracking-wide text-on-surface truncate">
            {titleCase(entry.name)}
          </span>
          <span className="block font-body text-xs text-tertiary truncate">
            {titleCase(entry.target)} &middot; {titleCase(entry.equipment)}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`material-symbols-outlined text-lg leading-none text-tertiary shrink-0 transition-transform duration-300 motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
        >
          expand_more
        </span>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="px-5 pb-4 pt-1 border-t border-surface-variant/40 flex flex-col gap-3">
            {entry.secondaryMuscles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {entry.secondaryMuscles.map((m) => (
                  <span
                    key={m}
                    className="font-label text-[9px] uppercase tracking-wide px-2 py-1 rounded-full bg-surface-container text-tertiary"
                  >
                    {titleCase(m)}
                  </span>
                ))}
              </div>
            )}
            {entry.steps.length > 0 && (
              <ol className="flex flex-col gap-2">
                {entry.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-surface-container-high text-primary-container font-label text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="font-body text-sm text-on-surface leading-snug">{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExerciseGuideList({ results }: { results: ExerciseGuideEntry[] }) {
  if (results.length === 0) {
    return (
      <div className="bg-surface-container-low rounded-2xl shadow-soft py-8 px-4 text-center font-body text-sm text-tertiary">
        No exercises match — try a different search or category.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {results.map((entry) => (
        <ExerciseRow key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
