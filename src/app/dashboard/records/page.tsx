import { getMemberSession } from "@/backend/auth/session";
import { listPersonalRecords } from "@/backend/services/personalRecords";
import { DashboardEmptyState } from "@/frontend/components/dashboard/Primitives";
import PersonalRecordRow from "@/frontend/components/dashboard/PersonalRecordRow";

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
            <PersonalRecordRow key={r.exerciseName} record={r} />
          ))}
        </div>
      )}
    </div>
  );
}
