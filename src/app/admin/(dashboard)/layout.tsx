import { redirect } from "next/navigation";
import { getAdminSession } from "@/backend/auth/session";
import AdminNav from "@/frontend/components/admin/AdminNav";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    // dvh, not vh/min-h-screen: vh is the STATIC viewport height (the area
    // a mobile keyboard would cover is still counted as "visible"), so
    // anything sized off it doesn't shrink when the keyboard opens — which
    // is exactly why the AI assistant's input could end up stuck behind
    // the keyboard. dvh tracks the real, current visible viewport.
    <div className="flex flex-col min-h-dvh">
      <AdminNav username={session.username} />
      <main className="flex-1 flex flex-col min-h-0 px-gutter-mobile lg:px-gutter-desktop py-8 max-w-(--container-max) mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
