import { redirect } from "next/navigation";
import { getMemberSession } from "@/backend/auth/session";
import { getMemberById } from "@/backend/services/member";
import DashboardHeader from "@/frontend/components/dashboard/DashboardHeader";
import DashboardDesktopNav from "@/frontend/components/dashboard/DashboardDesktopNav";
import DashboardTabBar from "@/frontend/components/dashboard/DashboardTabBar";
import RestTimerAlarmWatcher from "@/frontend/components/dashboard/RestTimerAlarmWatcher";

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
    <div className="flex flex-col min-h-screen">
      {/* Watches the rest timer and shows the finish alarm no matter which
          dashboard page is currently open — see the component's own
          comment for why this can't live on the workouts page alone. */}
      <RestTimerAlarmWatcher />
      <DashboardHeader fullName={member.fullName} />
      <DashboardDesktopNav />
      <main className="flex-1 pb-20 lg:pb-8">
        {children}
      </main>
      <DashboardTabBar />
    </div>
  );
}
