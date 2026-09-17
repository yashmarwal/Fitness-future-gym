import Link from "next/link";
import { getMemberSession } from "@/backend/auth/session";
import { listWorkoutLogs } from "@/backend/services/workouts";
import { findTodaysWorkout } from "@/backend/services/workoutPlans";
import WorkoutLogForm from "@/frontend/components/dashboard/WorkoutLogForm";
import { DashboardEmptyState } from "@/frontend/components/dashboard/Primitives";

export default async function WorkoutsPage() {
  const session = await getMemberSession();
  const [logs, todaysPlan] = await Promise.all([
    listWorkoutLogs(session!.memberId, 30),
    findTodaysWorkout(session!.memberId),
  ]);

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide">Workout Log</h1>
        <Link
          href="/dashboard/plan"
          className="flex items-center gap-1 font-label text-[10px] uppercase text-primary-container hover:text-secondary transition-colors"
        >
          <span className="material-symbols-outlined text-sm leading-none">event_note</span>
          Plan Workouts
        </Link>
      </div>

      <WorkoutLogForm logs={logs} todaysPlan={todaysPlan} />

      {logs.length === 0 ? (
        <DashboardEmptyState icon="fitness_center">No workouts logged yet.</DashboardEmptyState>
      ) : (
        <div className="flex flex-col divide-y divide-surface-variant/40 bg-surface-container-low shadow-hard">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center gap-3 px-5 py-3">
              <span className="material-symbols-outlined text-lg text-primary-container leading-none shrink-0">
                fitness_center
              </span>
              <div className="flex-1">
                <p className="font-label text-sm uppercase tracking-wide text-on-surface">{log.exerciseName}</p>
                <p className="font-body text-xs text-tertiary">
                  {new Date(log.loggedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                </p>
              </div>
              <p className="font-display text-lg text-primary-container">
                {log.sets}×{log.reps}
                {log.weightKg ? ` @ ${log.weightKg}kg` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
