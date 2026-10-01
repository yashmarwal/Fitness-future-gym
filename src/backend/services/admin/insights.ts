import "server-only";
import { previewUpcomingAutoBlocks } from "@/backend/services/admin/feeAbuse";
import type { MonthlyRevenue } from "@/backend/services/admin/feesAdmin";
import type { AdminMember } from "@/types/admin";

export type AdminInsight = { icon: string; text: string; tone: "warn" | "info" | "good"; href: string };

// Deterministic, not an actual LLM call — the same "pure, free, instant,
// can never say something the data doesn't support" approach
// memberSnapshot.ts already uses for the member dashboard's own insights.
// Framed as "AI noticed" in the UI (AiInsightsCard.tsx) because that's
// genuinely what it's doing — surfacing something the admin didn't have
// to go looking for — not because a model is actually involved. Only
// ever reads already-built functions, never writes anything.
//
// Revenue/newJoinees come in as params, already fetched by the Overview
// page for its own Revenue/New Joinees cards — refetching them here too
// would just be the same two queries running twice on every page load.
// previewUpcomingAutoBlocks is the one genuinely new query this adds.
export async function getAdminInsights(
  revenue: { months: MonthlyRevenue[] },
  newJoinees: AdminMember[]
): Promise<AdminInsight[]> {
  const upcomingBlocks = await previewUpcomingAutoBlocks();

  const insights: AdminInsight[] = [];

  if (upcomingBlocks.length > 0) {
    const names = upcomingBlocks.slice(0, 3).map((m) => m.fullName);
    const rest = upcomingBlocks.length - names.length;
    const who = rest > 0 ? `${names.join(", ")} and ${rest} other${rest === 1 ? "" : "s"}` : names.join(", ");
    insights.push({
      icon: "schedule",
      tone: "warn",
      text: `${upcomingBlocks.length === 1 ? "1 member is" : `${upcomingBlocks.length} members are`} about to be auto-blocked on tonight's sweep: ${who}.`,
      href: "/admin-2G/access-control",
    });
  }

  // Month-over-month, from the same 12-month series the Revenue card
  // already shows — no extra query. Only called out when the swing is
  // actually notable (10%+); a 2% wobble isn't worth an insight slot.
  const thisMonth = revenue.months[revenue.months.length - 1];
  const lastMonth = revenue.months[revenue.months.length - 2];
  if (thisMonth && lastMonth && lastMonth.total > 0) {
    const diffPct = Math.round(((thisMonth.total - lastMonth.total) / lastMonth.total) * 100);
    if (Math.abs(diffPct) >= 10) {
      insights.push({
        icon: diffPct > 0 ? "trending_up" : "trending_down",
        tone: diffPct > 0 ? "good" : "warn",
        text: `Revenue this month is ${diffPct > 0 ? "up" : "down"} ${Math.abs(diffPct)}% vs ${lastMonth.label} (₹${thisMonth.total.toLocaleString("en-IN")} so far).`,
        href: "/admin-2G/fees",
      });
    }
  }

  if (newJoinees.length > 0) {
    insights.push({
      icon: "person_add",
      tone: "good",
      text: `${newJoinees.length} new member${newJoinees.length === 1 ? "" : "s"} joined this month.`,
      href: "/admin-2G/members",
    });
  }

  return insights;
}
