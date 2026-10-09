import { redirect } from "next/navigation";
import { getMemberSession } from "@/backend/auth/session";
import { getMemberById } from "@/backend/services/member";
import DashboardHeader from "@/frontend/components/dashboard/DashboardHeader";
import DashboardTabBar from "@/frontend/components/dashboard/DashboardTabBar";
import DesktopBlockedScreen from "@/frontend/components/dashboard/DesktopBlockedScreen";
import RestTimerAlarmWatcher from "@/frontend/components/dashboard/RestTimerAlarmWatcher";
import WorkoutTimerActivityWatcher from "@/frontend/components/dashboard/WorkoutTimerActivityWatcher";
import CheckInCelebration from "@/frontend/components/dashboard/CheckInCelebration";
import PlaygroundInviteWatcher from "@/frontend/components/dashboard/PlaygroundInviteWatcher";
import EnableNotificationsPrompt from "@/frontend/components/dashboard/EnableNotificationsPrompt";

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

  return (
    // bg-black (pure #000), not the site-wide --color-background token
    // (#141311, a warm near-black used everywhere else via body's own
    // background-color in globals.css) — a deliberate, dashboard-only
    // override, not a site-wide color change.
    <div className="flex flex-col min-h-screen bg-black">
      {/* The real dashboard is mobile-only now — lg:hidden on this wrapper,
          DesktopBlockedScreen (hidden lg:flex) below is the only thing a
          wide viewport ever renders. DashboardDesktopNav, which used to
          serve exactly that lg+ range, was deleted outright rather than
          left mounted-but-dead — nothing can ever reach it once this
          wrapper hides the entire tree it lived in. */}
      <div className="lg:hidden flex flex-col min-h-screen">
        {/* Watches the rest timer and shows the finish alarm no matter which
            dashboard page is currently open — see the component's own
            comment for why this can't live on the workouts page alone. */}
        <RestTimerAlarmWatcher />
        <WorkoutTimerActivityWatcher />
        <CheckInCelebration />
        <PlaygroundInviteWatcher />
        <EnableNotificationsPrompt />
        <DashboardHeader fullName={member.fullName} />
        <main className="flex-1 pb-20">
          {children}
        </main>
        <DashboardTabBar />
      </div>
      <DesktopBlockedScreen />
    </div>
  );
}
