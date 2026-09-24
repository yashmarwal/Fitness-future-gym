import Link from "next/link";
import { getMemberSession } from "@/backend/auth/session";
import { getAttendanceStatus } from "@/backend/services/attendance";
import { listWorkoutLogs } from "@/backend/services/workouts";
import { findTodaysWorkout } from "@/backend/services/workoutPlans";
import AttendanceLock from "@/frontend/components/dashboard/AttendanceLock";
import WorkoutLogForm from "@/frontend/components/dashboard/WorkoutLogForm";
import WorkoutLogHistory from "@/frontend/components/dashboard/WorkoutLogHistory";
import WorkoutTimerBar from "@/frontend/components/dashboard/WorkoutTimerBar";
import { DashboardEmptyState } from "@/frontend/components/dashboard/Primitives";

export default async function WorkoutsPage() {
  const session = await getMemberSession();
  // Checked on the server before anything is fetched, so nothing of this page
  // loads (or renders behind a lock) until the member has checked in.
  const { checkedIn } = await getAttendanceStatus(session!.memberId);
  if (!checkedIn) return <AttendanceLock />;

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

      <WorkoutTimerBar />

      <WorkoutLogForm logs={logs} todaysPlan={todaysPlan} />

      {logs.length === 0 ? (
        <DashboardEmptyState icon="fitness_center">No workouts logged yet.</DashboardEmptyState>
      ) : (
        <WorkoutLogHistory logs={logs} />
      )}
    </div>
  );
}
