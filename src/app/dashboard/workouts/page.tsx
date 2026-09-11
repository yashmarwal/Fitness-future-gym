import { getMemberSession } from "@/backend/auth/session";
import { listWorkoutLogs } from "@/backend/services/workouts";
import WorkoutLogForm from "@/frontend/components/dashboard/WorkoutLogForm";

export default async function WorkoutsPage() {
  const session = await getMemberSession();
  const logs = await listWorkoutLogs(session!.memberId, 30);

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-6">Workout Log</h1>

      <WorkoutLogForm />

      {logs.length === 0 ? (
        <p className="font-body text-sm text-tertiary">No workouts logged yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-surface-variant/40 bg-surface-container-low shadow-hard">
          {logs.map((log) => (
            <div key={log.id} className="flex justify-between items-center px-5 py-3">
              <div>
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
