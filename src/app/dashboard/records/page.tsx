import { getMemberSession } from "@/backend/auth/session";
import { listPersonalRecords } from "@/backend/services/personalRecords";
import { DashboardEmptyState } from "@/frontend/components/dashboard/Primitives";

export default async function PersonalRecordsPage() {
  const session = await getMemberSession();
  const records = await listPersonalRecords(session!.memberId);

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-2">Personal Records</h1>
      <p className="font-body text-sm text-tertiary mb-6">
        Your all-time best for every exercise — heaviest weight, or most reps at that weight. Beat one and it updates
        automatically the next time you log it.
      </p>

      {records.length === 0 ? (
        <DashboardEmptyState icon="emoji_events">
          No records yet — log a set on the Workouts page to start your trophy case.
        </DashboardEmptyState>
      ) : (
        <div className="flex flex-col divide-y divide-surface-variant/40 bg-surface-container-low shadow-soft rounded-2xl border border-surface-variant/40 overflow-hidden">
          {records.map((r) => (
            <div key={r.exerciseName} className="flex items-center gap-4 px-5 py-4">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-container-high text-primary-container shrink-0">
                <span className="material-symbols-outlined text-lg leading-none">emoji_events</span>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-label text-sm uppercase tracking-wide text-on-surface truncate">
                  {r.exerciseName}
                </p>
                <p className="font-body text-xs text-tertiary mt-0.5">
                  {new Date(r.achievedAt).toLocaleDateString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <p className="font-display text-2xl text-primary-container tabular-nums shrink-0">
                {r.bestWeightKg != null ? `${r.bestWeightKg}kg × ${r.bestReps}` : `${r.bestReps} reps`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
