import { redirect } from "next/navigation";
import { getMemberSession } from "@/backend/auth/session";
import { getMemberById } from "@/backend/services/member";
import BlockedScreen from "@/frontend/components/dashboard/BlockedScreen";

// A dedicated route, not a conditional inside dashboard/layout.tsx — using
// redirect() here (rather than the layout just returning different JSX)
// actually halts the render pipeline. Next.js resolves a layout's
// `children` prop (running dashboard/page.tsx's own queries) as part of
// building that prop BEFORE the layout's own logic runs, regardless of
// whether the layout's returned JSX ends up using it — so a layout-level
// conditional alone doesn't stop the wasted work, only redirecting away
// from the dashboard route tree entirely does.
export default async function AccountBlockedPage() {
  const session = await getMemberSession();
  if (!session) redirect("/login");

  const member = await getMemberById(session.memberId);
  if (!member) redirect("/login");

  // Re-verified here, not just trusted from wherever the redirect came
  // from — if someone got unblocked and this URL is stale (bookmarked,
  // browser back button), send them back to the real dashboard instead of
  // stranding them on a blocked screen that's no longer true.
  if (!member.isBlocked) redirect("/dashboard");

  return <BlockedScreen fullName={member.fullName} />;
}
