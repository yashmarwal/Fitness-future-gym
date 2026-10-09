import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/backend/auth/session";
import AdminNav from "@/frontend/components/admin/AdminNav";
import AdminSidebar from "@/frontend/components/admin/AdminSidebar";
import AdminTabBar from "@/frontend/components/admin/AdminTabBar";
import CommandPalette from "@/frontend/components/admin/CommandPalette";

// Overrides the root layout's manifest link (which points at
// admin-manifest.json — start_url "/admin-2G" instead of "/dashboard" — the
// root manifest.json's start_url is member-facing). Without this, "Add to
// Home Screen" from anywhere in the admin panel installs a shortcut that
// still launches to the member dashboard, since Chrome/Android read
// whichever manifest is linked on the page you tapped install from, not
// the URL of that page itself. Only the `manifest` field is set here —
// Next.js metadata fields aren't deep-merged, so redefining `appleWebApp`
// or `icons` here too would silently drop the rest of what root layout.tsx
// sets on them.
export const metadata: Metadata = {
  manifest: "/admin-manifest.json",
};

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin-2G/login");

  return (
    // h-dvh, not min-h-dvh: a MINIMUM still let this grow taller than the
    // viewport whenever a page's content (the AI chat's message list,
    // chiefly) needed more room than that — and since AdminTabBar is
    // `fixed` (pinned to the real viewport, oblivious to page scroll),
    // once the page grew past the point the bar sits at, that content
    // scrolled up BEHIND the bar instead of the chat's own internal
    // flex-1/min-h-0/overflow-y-auto ever kicking in, which only works
    // when its ancestor chain has a genuinely fixed ceiling to squeeze
    // against, not just a floor. h-dvh is that real cap; every other admin
    // page keeps scrolling exactly as before (overflow here is never
    // `hidden`, so content taller than `main` still overflows visibly and
    // the page scrolls normally) — only a flex-1 child that actually wants
    // to be height-constrained, which today is only the chat, is affected.
    // dvh over vh/min-h-screen for the same original reason: vh is the
    // STATIC viewport height (still counts the area a mobile keyboard
    // covers as "visible"), dvh tracks the real, current visible viewport.
    // bg-black — same pure-black page background as the member dashboard
    // (dashboard/layout.tsx), instead of falling through to the site-wide
    // --color-background (#141311, a warm near-black) via body.
    <div className="flex flex-col h-dvh overflow-x-hidden bg-black">
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
      {/* pb-24 lg:pb-8 — same split as the member dashboard's own
          pb-20 lg:pb-8: AdminTabBar is mobile-only now (lg:hidden, see
          below), so the floating-bar clearance only needs to apply below
          `lg`. On desktop, AdminSidebar (fixed, lg:w-60) replaces it.

          The lg:pl-60 reserving the sidebar's width lives on THIS wrapper,
          not on <main> itself — <main>'s own w-full needs to resolve
          against an already-narrowed containing block for the sidebar
          offset to work at all. Putting it there instead (lg:ml-60 on a
          still-w-full <main>) doesn't reduce the width <main> computes
          100% against, so margin + full width together push its right
          edge straight past the viewport — exactly the right-side overflow
          this replaced. flex-1 min-h-0 here takes over the role <main>
          used to have directly as the outer flex-col's one flexible row;
          <main> now gets that same resolved height back via h-full.

          lg:max-w-none on <main> — the site-wide max-(--container-max)
          (1280px) is right for prose/marketing pages, but combined with
          the sidebar's 240px it left data tables (Members' 9 columns,
          chiefly) LESS room than before the sidebar existed on common
          laptop widths, tipping them into their own horizontal-scroll
          fallback. Admin is a data-dense panel, not a reading page — pages
          that genuinely want a narrower column (MemberProfileView) already
          cap themselves tighter from inside, so lifting the cap here only
          ever gives every other admin page MORE room, never less. */}
      <div className="flex-1 min-h-0 lg:pl-60">
        <main className="h-full flex flex-col min-h-0 px-gutter-mobile lg:px-gutter-desktop py-8 pb-24 lg:pb-8 max-w-(--container-max) lg:max-w-none mx-auto lg:mx-0 w-full overflow-x-hidden">
          {children}
        </main>
      </div>
      <AdminSidebar />
      <AdminTabBar />
      <CommandPalette />
    </div>
  );
}
