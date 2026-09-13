import { getMemberSession } from "@/backend/auth/session";
import { listWorkoutPlans } from "@/backend/services/workoutPlans";
import WorkoutPlanner from "@/frontend/components/dashboard/WorkoutPlanner";

export default async function WorkoutPlanPage() {
  const session = await getMemberSession();
  const plans = await listWorkoutPlans(session!.memberId);

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-(--container-max) mx-auto">
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-2">Plan Your Workouts</h1>
      <p className="font-body text-sm text-tertiary mb-6">
        Build a real split — pick your days, add real exercises with target sets and reps. Not a note-taking app.
      </p>
      <WorkoutPlanner plans={plans} />
    </div>
  );
}
