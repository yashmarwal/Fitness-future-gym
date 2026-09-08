import { redirect } from "next/navigation";
import { getAdminSession } from "@/server/auth/session";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="flex flex-col min-h-screen">
      <AdminNav username={session.username} />
      <main className="flex-1 px-gutter-mobile lg:px-gutter-desktop py-8 max-w-(--container-max) mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
