import { getMemberSession } from "@/backend/auth/session";
import { getMemberMuscleProgress } from "@/backend/services/muscleProgress";
import { listWorkoutLogs } from "@/backend/services/workouts";
import { matchExerciseCategory } from "@/frontend/lib/exerciseLibrary";
import { StatCard } from "@/frontend/components/dashboard/Primitives";
import MuscleProgressBoard from "@/frontend/components/dashboard/MuscleProgressBoard";

export default async function MuscleProgressPage() {
  const session = await getMemberSession();
  const [progress, logs] = await Promise.all([
    getMemberMuscleProgress(session!.memberId),
    listWorkoutLogs(session!.memberId, 60),
  ]);

  const recentByCategory: Record<string, { exerciseName: string; sets: number; reps: number; loggedAt: string }[]> = {};
  for (const log of logs) {
    const category = matchExerciseCategory(log.exerciseName);
    if (!category) continue;
    const bucket = recentByCategory[category] ?? (recentByCategory[category] = []);
    if (bucket.length < 3) bucket.push(log);
  }

  const totalXp = progress.reduce((sum, p) => sum + p.xp, 0);
  const topMuscle = progress.reduce((best, p) => (p.rankIndex > best.rankIndex || (p.rankIndex === best.rankIndex && p.xp > best.xp) ? p : best), progress[0]);

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-(--container-max) mx-auto">
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-2">Muscle Progress</h1>
      <p className="font-body text-sm text-tertiary mb-6">
        Every set you log earns XP for that muscle group. Train it consistently and it climbs the rank ladder — tap a
        card to see what&apos;s been logged recently.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard value={totalXp.toLocaleString("en-IN")} label="Total XP" tone="accent" />
        <StatCard value={topMuscle?.rankName ?? "Bronze"} label={`Top: ${topMuscle?.category ?? "—"}`} size="md" uppercase />
      </div>

      <MuscleProgressBoard progress={progress} recentByCategory={recentByCategory} />
    </div>
  );
}
