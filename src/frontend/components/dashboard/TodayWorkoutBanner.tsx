"use client";

import { useState } from "react";
import Link from "next/link";

type Exercise = { name: string; sets: number; reps: string };

export default function TodayWorkoutBanner({
  planName,
  day,
  focus,
  exercises,
}: {
  planName: string;
  day: string;
  focus?: string;
  exercises: Exercise[];
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="bg-primary-container text-on-primary-container p-4 shadow-hard-lg mb-6 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-label text-xs uppercase tracking-widest">
          <span className="material-symbols-outlined text-lg leading-none">today</span>
          Today&apos;s Workout — {day}
          {focus ? ` (${focus})` : ""}
        </span>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="opacity-80 hover:opacity-100 shrink-0"
        >
          <span className="material-symbols-outlined text-lg leading-none">close</span>
        </button>
      </div>
      <ul className="flex flex-col gap-0.5">
        {exercises.map((ex, i) => (
          <li key={i} className="font-body text-sm">
            {ex.name} — {ex.sets} × {ex.reps}
          </li>
        ))}
      </ul>
      <Link href="/dashboard/plan" className="font-label text-[10px] uppercase underline w-fit mt-1">
        View &quot;{planName}&quot; Plan →
      </Link>
    </div>
  );
}
