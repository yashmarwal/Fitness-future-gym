import { redirect } from "next/navigation";
import { getMemberSession } from "@/backend/auth/session";
import { getMemberById } from "@/backend/services/member";
import DashboardHeader from "@/frontend/components/dashboard/DashboardHeader";
import DashboardDesktopNav from "@/frontend/components/dashboard/DashboardDesktopNav";
import DashboardTabBar from "@/frontend/components/dashboard/DashboardTabBar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getMemberSession();
  if (!session) redirect("/login");

  const member = await getMemberById(session.memberId);
  if (!member) redirect("/login");

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader fullName={member.fullName} />
      <DashboardDesktopNav />
      <main className="flex-1 pb-20 lg:pb-8">{children}</main>
      <DashboardTabBar />
    </div>
  );
}
