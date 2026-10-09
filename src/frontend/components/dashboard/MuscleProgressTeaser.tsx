import Link from "next/link";
import Image from "next/image";
import type { MuscleProgress } from "@/backend/services/muscleProgress";
import { CATEGORY_ICON, tierClasses } from "@/frontend/lib/muscleRankStyle";

// Server-rendered preview strip on the Overview page — no client JS needed
// here at all, the interactive tap-to-expand board lives at
// /dashboard/progress (MuscleProgressBoard.tsx). This is purely a "here's
// where you stand, go see more" teaser.
export default function MuscleProgressTeaser({ progress }: { progress: MuscleProgress[] }) {
  return (
    <Link
      href="/dashboard/progress"
      className="relative overflow-hidden block bg-black p-5 shadow-soft rounded-2xl mb-6 hover:border-fuchsia-400 border border-transparent transition-colors"
    >
      <Image
        src="/images/dashboard-stats/muscle-progress.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover pointer-events-none"
        style={{ filter: "hue-rotate(-76deg) saturate(1) brightness(1.05)" }}
      />
      <div className="relative z-10 flex items-center justify-between mb-3">
        <span className="flex items-center gap-1.5 font-label text-xs uppercase tracking-widest text-fuchsia-400">
          <span className="material-symbols-outlined text-base leading-none">military_tech</span>
          Muscle Progress
        </span>
        <span className="material-symbols-outlined text-base text-white/75 leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          arrow_forward
        </span>
      </div>
      <div className="relative z-10 flex items-center gap-2 overflow-x-auto pb-0.5">
        {progress.map((p) => {
          const tier = tierClasses(p.rankIndex);
          return (
            <div key={p.category} className="flex flex-col items-center gap-1 shrink-0 w-14">
              <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center border ${tier.badge}`}
                title={`${p.category}: ${p.rankName}`}
              >
                <span className="material-symbols-outlined text-base leading-none">
                  {CATEGORY_ICON[p.category] ?? "fitness_center"}
                </span>
              </span>
              <span className="font-label text-[8px] uppercase tracking-wide text-white/75 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] truncate w-full text-center">
                {p.category}
              </span>
            </div>
          );
        })}
      </div>
    </Link>
  );
}
