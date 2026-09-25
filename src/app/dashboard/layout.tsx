import { redirect } from "next/navigation";
import { getMemberSession } from "@/backend/auth/session";
import { getMemberById } from "@/backend/services/member";
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

  // Deliberately NOT fetching notifications/workout-prompt-pref here for
  // SettingsPanel — this layout wraps every dashboard route, so anything
  // awaited here adds latency to every single navigation (and to a cold
  // PWA launch, which already has no warm client cache to fall back on).
  // SettingsPanel almost never opens on a given page view, so it fetches
  // that data itself, lazily, only once actually opened (GET
  // /api/dashboard/notification-prefs, /api/dashboard/notifications) —
  // this used to await both eagerly and got reverted once it showed up as
  // real added latency on every dashboard page load.
  return (
    <div className="flex flex-col min-h-screen">
      {/* Watches the rest timer and shows the finish alarm no matter which
          dashboard page is currently open — see the component's own
          comment for why this can't live on the workouts page alone. */}
      <RestTimerAlarmWatcher />
      <WorkoutTimerActivityWatcher />
      <CheckInCelebration />
      <DashboardHeader fullName={member.fullName} membershipNumber={member.membershipNumber} plan={member.plan} />
      <DashboardDesktopNav />
      <main className="flex-1 pb-20 lg:pb-8">
        {children}
      </main>
      <DashboardTabBar />
    </div>
  );
}
