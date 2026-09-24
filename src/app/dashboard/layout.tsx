import { redirect } from "next/navigation";
import { getMemberSession } from "@/backend/auth/session";
import { getMemberById } from "@/backend/services/member";
import { listNotifications } from "@/backend/services/memberNotifications";
import { getWorkoutPromptEnabled } from "@/backend/services/workoutPrompt";
import DashboardHeader from "@/frontend/components/dashboard/DashboardHeader";
import DashboardDesktopNav from "@/frontend/components/dashboard/DashboardDesktopNav";
import DashboardTabBar from "@/frontend/components/dashboard/DashboardTabBar";
import RestTimerAlarmWatcher from "@/frontend/components/dashboard/RestTimerAlarmWatcher";
import WorkoutTimerActivityWatcher from "@/frontend/components/dashboard/WorkoutTimerActivityWatcher";
import CheckInCelebration from "@/frontend/components/dashboard/CheckInCelebration";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getMemberSession();
  if (!session) redirect("/login");

  const member = await getMemberById(session.memberId);
  if (!member) redirect("/login");

  // Blocked (fee-abuse tool, admin/feeAbuse.ts) redirects to a dedicated
  // route rather than the layout just returning different JSX — Next.js
  // resolves `children` (running whatever dashboard/page.tsx the member
  // was headed to, queries and all) as part of building that prop before
  // the layout's own body runs, regardless of whether the layout's
  // returned tree ends up using it. Only actually leaving the /dashboard
  // route tree via redirect() stops that work from happening at all.
  if (member.isBlocked) redirect("/account-blocked");

  // Fetched here (rather than only on the home page, as before) because the
  // Settings panel — Membership Card, Notifications, Sign Out — now lives in
  // DashboardHeader, which renders on every dashboard route. getMemberById
  // itself is React-cache()'d, so dashboard/page.tsx's own call for the same
  // memberId in the same request shares this one round-trip instead of
  // doubling it; these two calls are the only genuinely new queries.
  const [notifications, workoutPromptEnabled] = await Promise.all([
    listNotifications(session.memberId),
    getWorkoutPromptEnabled(session.memberId),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Watches the rest timer and shows the finish alarm no matter which
          dashboard page is currently open — see the component's own
          comment for why this can't live on the workouts page alone. */}
      <RestTimerAlarmWatcher />
      <WorkoutTimerActivityWatcher />
      <CheckInCelebration />
      <DashboardHeader
        fullName={member.fullName}
        membershipNumber={member.membershipNumber}
        plan={member.plan}
        initialPrefs={{
          water: member.notifyWater,
          mealLog: member.notifyMealLog,
          streak: member.notifyStreak,
          workout: workoutPromptEnabled,
        }}
        initialNotifications={notifications}
      />
      <DashboardDesktopNav />
      <main className="flex-1 pb-20 lg:pb-8">
        {children}
      </main>
      <DashboardTabBar />
    </div>
  );
}
