"use client";

import { useEffect, useState } from "react";
import type { MuscleProgress } from "@/backend/services/muscleProgress";
import { getLastSeenRanks, saveLastSeenRanks } from "@/frontend/lib/muscleProgressLocal";
import { CATEGORY_ICON, tierClasses } from "@/frontend/lib/muscleRankStyle";

type RecentLog = { exerciseName: string; sets: number; reps: number; loggedAt: string };

export default function MuscleProgressBoard({
  progress,
  recentByCategory,
}: {
  progress: MuscleProgress[];
  recentByCategory: Record<string, RecentLog[]>;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // Computed once via a lazy initializer (runs synchronously on first
  // client render, window-guarded for SSR) rather than an effect — this is
  // a one-time "compare server truth to what localStorage last saw and
  // persist the update" read, not something to re-derive on every render,
  // and the project's set-state-in-effect lint rule specifically flags
  // calling setState synchronously inside an effect body for exactly this
  // kind of on-mount computation (see AttendanceGate.tsx/PersonalNoteArea.tsx
  // for the same class of fix elsewhere in this codebase).
  const [leveledUp, setLeveledUp] = useState<{ category: string; rankName: string }[]>(() => {
    if (typeof window === "undefined") return [];
    const last = getLastSeenRanks();
    const updated: Record<string, number> = { ...last };
    const newlyLeveled: { category: string; rankName: string }[] = [];

    for (const p of progress) {
      const prevRank = last[p.category];
      // Only celebrate when there's a genuine PRIOR visit to compare
      // against — a member's first-ever visit to this page (who may
      // already have months of workout history behind their XP total)
      // shouldn't trigger a wall of "leveled up" toasts all at once.
      if (prevRank !== undefined && p.rankIndex > prevRank) {
        newlyLeveled.push({ category: p.category, rankName: p.rankName });
      }
      updated[p.category] = p.rankIndex;
    }

    saveLastSeenRanks(updated);
    return newlyLeveled;
  });

  // A genuine effect: subscribing to a timer and calling setState from its
  // callback once it fires — not deriving state synchronously in the
  // effect body, which is the pattern the lint rule actually objects to.
  useEffect(() => {
    if (leveledUp.length === 0) return;
    const timer = setTimeout(() => setLeveledUp([]), 4500);
    return () => clearTimeout(timer);
  }, [leveledUp]);

  return (
    <div className="relative">
      {leveledUp.length > 0 && (
        <div
          className="fixed top-20 left-1/2 z-100 -translate-x-1/2 bg-primary-container text-on-primary-container shadow-hard-lg px-5 py-3 flex items-center gap-2 whitespace-nowrap"
          style={{ animation: "toast-slide-in 0.35s ease-out" }}
        >
          <span className="material-symbols-outlined text-xl leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>
            military_tech
          </span>
          <span className="font-label text-xs uppercase tracking-wide font-bold">
            {leveledUp.map((l) => `${l.category} → ${l.rankName}`).join(" • ")}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {progress.map((p) => {
          const tier = tierClasses(p.rankIndex);
          const isExpanded = expanded === p.category;
          const justLeveled = leveledUp.some((l) => l.category === p.category);
          const recent = recentByCategory[p.category] ?? [];

          return (
            <button
              key={p.category}
              onClick={() => setExpanded(isExpanded ? null : p.category)}
              className={`text-left bg-surface-container-low p-4 shadow-hard border transition-all hover:-translate-y-0.5 ${
                isExpanded ? "col-span-2 border-primary-container" : "border-transparent"
              } ${justLeveled ? "animate-[notif-glow_1.4s_ease-in-out_3]" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-outlined text-2xl text-on-surface-variant leading-none">
                  {CATEGORY_ICON[p.category] ?? "fitness_center"}
                </span>
                <span
                  className={`font-label text-[9px] uppercase tracking-widest font-bold px-2 py-1 border ${tier.badge} ${
                    justLeveled ? "[animation:rank-pop_0.5s_ease-out]" : ""
                  }`}
                >
                  {p.rankName}
                </span>
              </div>

              <p className="font-label text-xs uppercase tracking-wide text-on-surface mb-2">{p.category}</p>

              <div className="w-full h-1.5 bg-surface-container-high overflow-hidden mb-1.5">
                <div
                  className={`h-full ${tier.bar} transition-[width] duration-700 ease-out`}
                  style={{ width: `${p.progressPct}%` }}
                />
              </div>
              <p className="font-body text-[10px] text-tertiary">
                {p.maxed ? `${p.xp.toLocaleString("en-IN")} XP — Maxed` : `${p.xpIntoRank} / ${p.xpForNextRank} XP to next`}
              </p>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-surface-variant/40 flex flex-col gap-1.5">
                  {recent.length === 0 ? (
                    <p className="font-body text-[11px] text-tertiary">
                      No {p.category.toLowerCase()} sets logged in the last 30 days yet.
                    </p>
                  ) : (
                    recent.map((log, i) => (
                      <div key={i} className="flex items-center justify-between font-body text-[11px] text-on-surface-variant">
                        <span className="truncate pr-2">{log.exerciseName}</span>
                        <span className="text-tertiary shrink-0 font-mono">
                          {log.sets}×{log.reps}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
