import Link from "next/link";
import type { AdminInsight } from "@/backend/services/admin/insights";
import { GLASS_SHADOW } from "@/frontend/lib/glass";

const TONE_ICON_CLASS: Record<AdminInsight["tone"], string> = {
  warn: "text-error",
  good: "text-primary-container",
  info: "text-on-surface",
};

// Nothing rendered when there's nothing to say — same "an empty category
// just doesn't show a section" posture as AlertsList, rather than a
// card permanently reading "No insights right now."
export default function AiInsightsCard({ insights }: { insights: AdminInsight[] }) {
  if (insights.length === 0) return null;

  return (
    <div
      className={`bg-white/4 backdrop-blur-xl backdrop-saturate-150 border border-white/10 rounded-2xl ${GLASS_SHADOW} overflow-hidden`}
    >
      <div className="flex items-center gap-2 px-5 pt-4 pb-3">
        <span className="w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br from-primary-container to-secondary-container text-on-primary-container shrink-0">
          <span className="material-symbols-outlined text-sm leading-none">smart_toy</span>
        </span>
        <span className="font-label text-[11px] uppercase tracking-[0.2em] text-primary-container font-bold">
          Spotter Noticed
        </span>
      </div>
      <div className="flex flex-col divide-y divide-white/10">
        {insights.map((insight) => (
          <Link
            key={insight.text}
            href={insight.href}
            className="flex items-start gap-3 px-5 py-3 hover:bg-white/5 transition-colors"
          >
            <span className={`material-symbols-outlined text-lg leading-none shrink-0 mt-0.5 ${TONE_ICON_CLASS[insight.tone]}`}>
              {insight.icon}
            </span>
            <p className="font-body text-sm text-on-surface leading-snug">{insight.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
