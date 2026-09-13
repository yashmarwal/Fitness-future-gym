import type { ReactNode } from "react";

type Tone = "default" | "accent" | "alert";

function toneClass(tone: Tone): string {
  if (tone === "accent") return "text-primary-container";
  if (tone === "alert") return "text-error";
  return "text-on-surface";
}

/**
 * Shared stat tile used across the overview, streak and nutrition pages so
 * every "number in a box" reads as the same component instead of three
 * independently-styled cards.
 */
export function StatCard({
  value,
  label,
  tone = "default",
  size = "lg",
  uppercase = false,
}: {
  value: ReactNode;
  label: string;
  tone?: Tone;
  size?: "md" | "lg";
  uppercase?: boolean;
}) {
  return (
    <div className="bg-surface-container-low p-5 shadow-hard flex flex-col gap-1">
      <span
        className={`font-display leading-none ${size === "md" ? "text-2xl" : "text-3xl"} ${uppercase ? "uppercase" : ""} ${toneClass(tone)}`}
      >
        {value}
      </span>
      <p className="font-label text-[10px] uppercase tracking-wider text-tertiary">{label}</p>
    </div>
  );
}

/** Shared empty-state block for "no logs yet" style messages. */
export function DashboardEmptyState({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center bg-surface-container-low/60 border border-dashed border-surface-variant px-6 py-10 shadow-hard">
      <span className="material-symbols-outlined text-3xl text-outline">{icon}</span>
      <p className="font-body text-sm text-tertiary max-w-xs">{children}</p>
    </div>
  );
}
