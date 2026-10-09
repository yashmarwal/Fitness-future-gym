import type { ReactNode } from "react";
import Image from "next/image";

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
  icon,
  image,
  priority = false,
}: {
  value: ReactNode;
  label: string;
  tone?: Tone;
  size?: "md" | "lg";
  uppercase?: boolean;
  icon?: string;
  /** Optional background art (path under /public) — only the member dashboard's
   * overview grid passes this; every other StatCard usage is unaffected. */
  image?: string;
  /** Preload the image instead of lazy-loading — only for cards visible on
   * first paint with no scroll, so they never flash in after the frame. */
  priority?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden p-5 shadow-soft rounded-2xl flex flex-col gap-1 transition-transform hover:-translate-y-0.5 ${image ? "bg-black" : "card-corner-glow bg-surface-container-low"}`}
    >
      {image && <Image src={image} alt="" fill priority={priority} sizes="50vw" className="object-cover pointer-events-none" />}
      {icon && (
        <span
          className={`relative z-10 material-symbols-outlined text-lg leading-none mb-1 ${toneClass(tone)} ${image ? "drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" : ""}`}
        >
          {icon}
        </span>
      )}
      <span
        className={`relative z-10 font-display leading-none ${size === "md" ? "text-2xl" : "text-3xl"} ${uppercase ? "uppercase" : ""} ${
          tone === "default" && image ? "text-white" : toneClass(tone)
        } ${image ? "drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" : ""}`}
      >
        {value}
      </span>
      <p
        className={`relative z-10 font-label text-[10px] uppercase tracking-wider ${image ? "text-white/75 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" : "text-tertiary"}`}
      >
        {label}
      </p>
    </div>
  );
}

/**
 * A pulsing placeholder block for loading.tsx skeletons — one shared shape
 * so every skeleton across the dashboard reads as the same visual language
 * instead of each route inventing its own gray boxes.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-surface-container-high rounded-xl ${className}`} />;
}

/** Shared empty-state block for "no logs yet" style messages. */
export function DashboardEmptyState({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center bg-surface-container-low/60 border border-dashed border-surface-variant rounded-2xl px-6 py-10 shadow-soft">
      <span className="material-symbols-outlined text-3xl text-outline">{icon}</span>
      <p className="font-body text-sm text-tertiary max-w-xs">{children}</p>
    </div>
  );
}
