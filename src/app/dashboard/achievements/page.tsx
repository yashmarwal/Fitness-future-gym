import Link from "next/link";
import { getMemberSession } from "@/backend/auth/session";
import { getMemberById } from "@/backend/services/member";
import { listWorkoutLogs } from "@/backend/services/workouts";
import { listPersonalRecords, type PersonalRecord } from "@/backend/services/personalRecords";
import { getMemberMuscleProgress } from "@/backend/services/muscleProgress";
import { buildMemberSnapshot } from "@/frontend/lib/memberSnapshot";
import { StatCard } from "@/frontend/components/dashboard/Primitives";
import ShareAchievementsCard from "@/frontend/components/dashboard/ShareAchievementsCard";

function bestLift(records: PersonalRecord[]): PersonalRecord | null {
  let best: PersonalRecord | null = null;
  for (const r of records) {
    if (r.bestWeightKg == null) continue;
    if (!best || (best.bestWeightKg ?? 0) < r.bestWeightKg) best = r;
  }
  return best;
}

// Not attendance-gated — same exemption already made for Personal Records,
// Muscle Progress, Streak and the Snapshot bar (see the QUICK_LINKS comment
// on dashboard/page.tsx): these all look BACK at data the member already
// has, rather than opening something meant to be done on the gym floor.
export default async function AchievementsPage() {
  const session = await getMemberSession();
  const [member, workoutLogs, personalRecords, muscleProgress] = await Promise.all([
    getMemberById(session!.memberId),
    // 400 comfortably covers this week for even a heavy logger.
    listWorkoutLogs(session!.memberId, 400),
    listPersonalRecords(session!.memberId),
    getMemberMuscleProgress(session!.memberId),
  ]);

  const snapshot = buildMemberSnapshot({
    member: {
      currentStreakDays: member?.currentStreakDays ?? 0,
      longestStreakDays: member?.longestStreakDays ?? 0,
      feeDueDate: null,
      plan: null,
      joinedAt: null,
    },
    attendance: [],
    workoutLogs,
    todaysFood: [],
    personalRecords,
    muscleProgress,
  });

  const lift = bestLift(personalRecords);

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-2">Achievements</h1>
      <p className="font-body text-sm text-tertiary mb-6">
        Everything you&apos;ve earned, in one place — your best lift, streak, weekly volume and muscle rank.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          icon="emoji_events"
          label="Best Lift"
          size="md"
          value={lift ? `${lift.bestWeightKg}kg` : "—"}
        />
        <StatCard icon="local_fire_department" label="Day Streak" tone="accent" value={snapshot.streak.current} />
        <StatCard
          icon="fitness_center"
          label="Volume · 7d"
          size="md"
          value={`${snapshot.lifting.volumeKg.toLocaleString("en-IN")}kg`}
        />
        <StatCard
          icon="military_tech"
          label="Strongest"
          size="md"
          uppercase
          value={snapshot.rank ? snapshot.rank.category : "—"}
        />
      </div>

      <div className="mb-6">
        <ShareAchievementsCard />
      </div>

      <div className="flex flex-col gap-2">
        <Link
          href="/dashboard/records"
          className="flex items-center justify-between gap-3 bg-surface-container-low p-4 shadow-soft rounded-2xl hover:border-primary-container border border-transparent transition-colors"
        >
          <span className="flex items-center gap-2.5 font-label text-xs uppercase tracking-wide text-on-surface">
            <span className="material-symbols-outlined text-lg leading-none text-primary-container">emoji_events</span>
            All Personal Records
          </span>
          <span className="material-symbols-outlined text-lg leading-none text-tertiary">chevron_right</span>
        </Link>
        <Link
          href="/dashboard/progress"
          className="flex items-center justify-between gap-3 bg-surface-container-low p-4 shadow-soft rounded-2xl hover:border-primary-container border border-transparent transition-colors"
        >
          <span className="flex items-center gap-2.5 font-label text-xs uppercase tracking-wide text-on-surface">
            <span className="material-symbols-outlined text-lg leading-none text-primary-container">military_tech</span>
            Muscle Progress & Ranks
          </span>
          <span className="material-symbols-outlined text-lg leading-none text-tertiary">chevron_right</span>
        </Link>
      </div>
    </div>
  );
}
