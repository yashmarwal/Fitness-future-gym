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
    <div className="flex flex-col min-h-dvh overflow-x-hidden">
      <AdminNav username={session.username} />
      {/* overflow-x-hidden here is a safety net, not a fix for anything
          specific to this file — one unshrinkable flex child anywhere
          deep in an admin page (a table row, a button row, a badge group)
          can otherwise inflate the whole page wider than the viewport,
          since nothing above this was ever clipping it. Doesn't affect any
          of the deliberate overflow-x-auto scroll strips already used
          throughout the admin panel (nav tabs, filter pills, the members
          table) — those still scroll within themselves; this only clips
          whatever manages to escape all the way up past them. */}
      <main className="flex-1 flex flex-col min-h-0 px-gutter-mobile lg:px-gutter-desktop py-8 max-w-(--container-max) mx-auto w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
