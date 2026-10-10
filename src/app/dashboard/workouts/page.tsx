import Link from "next/link";
import { getMemberSession } from "@/backend/auth/session";
import { getAttendanceStatus } from "@/backend/services/attendance";
import { listWorkoutLogs } from "@/backend/services/workouts";
import { findTodaysWorkout } from "@/backend/services/workoutPlans";
import AttendanceLock from "@/frontend/components/dashboard/AttendanceLock";
import WorkoutLogForm from "@/frontend/components/dashboard/WorkoutLogForm";
import WorkoutLogHistory from "@/frontend/components/dashboard/WorkoutLogHistory";
import WorkoutTimerBar from "@/frontend/components/dashboard/WorkoutTimerBar";
import BeastModeLauncher from "@/frontend/components/dashboard/BeastMode";
import { DashboardEmptyState } from "@/frontend/components/dashboard/Primitives";

export default async function WorkoutsPage() {
  const session = await getMemberSession();
  // Checked on the server before anything is fetched, so nothing of this page
  // loads (or renders behind a lock) until the member has checked in.
  const { checkedIn } = await getAttendanceStatus(session!.memberId);
  if (!checkedIn) return <AttendanceLock />;

  const [logs, todaysPlan] = await Promise.all([
    // 400, not 30 — listWorkoutLogs caps by row count, not days, and every
    // Beast Mode set logs as its own row. 30 rows could be eaten by 2-3
    // sessions, well short of the 30-day retention window (workouts.ts);
    // 400 is the same "comfortably covers a full month" cap the dashboard,
    // achievements, and achievement-card pages already use.
    listWorkoutLogs(session!.memberId, 400),
    findTodaysWorkout(session!.memberId),
  ]);

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-2 mb-6">
        <h1 className="font-display text-lg text-on-surface uppercase tracking-wide whitespace-nowrap">Workout Log</h1>
        <div className="flex items-center gap-2.5 bg-surface-container-low border border-surface-variant rounded-full pl-2.5 pr-3 py-1.5 shrink-0">
          <Link
            href="/dashboard/playground"
            className="flex items-center gap-1 font-label text-[10px] uppercase text-primary-container hover:text-secondary transition-colors whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-sm leading-none">group</span>
            Playground
          </Link>
          <span className="w-px h-4 bg-surface-variant" aria-hidden="true" />
          <Link
            href="/dashboard/plan"
            className="flex items-center gap-1 font-label text-[10px] uppercase text-primary-container hover:text-secondary transition-colors whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-sm leading-none">event_note</span>
            Plan Workouts
          </Link>
        </div>
      </div>

      <WorkoutTimerBar />

      <div className="mb-3">
        <BeastModeLauncher />
      </div>

      <WorkoutLogForm logs={logs} todaysPlan={todaysPlan} />

      {logs.length === 0 ? (
        <DashboardEmptyState icon="fitness_center">No workouts logged yet.</DashboardEmptyState>
      ) : (
        <WorkoutLogHistory logs={logs} />
      )}
    </div>
  );
}
