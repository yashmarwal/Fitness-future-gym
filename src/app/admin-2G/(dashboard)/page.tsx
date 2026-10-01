import Link from "next/link";
import { countTodaysCheckIns } from "@/backend/services/admin/attendanceAdmin";
import { sumPaidThisMonth, countOverdueMembers, getRevenueLast12Months } from "@/backend/services/admin/feesAdmin";
import { listMembers, listNewJoineesThisMonth } from "@/backend/services/admin/members";
import RevenueCard from "@/frontend/components/admin/RevenueCard";
import NewJoineesCard from "@/frontend/components/admin/NewJoineesCard";
import { listUnpaidActiveMembers, listBlockedMembers } from "@/backend/services/admin/feeAbuse";
import {
  listOverdueFeeMembers,
  listUpcomingDueMembers,
  listRecentlyMissedMembers,
  listInactiveMembers,
  listTrialOverMembers,
  listUpcomingBirthdays,
} from "@/backend/services/admin/alerts";

export default async function AdminOverviewPage() {
  const [
    todaysCheckIns,
    revenueThisMonth,
    overdueCount,
    members,
    overdue,
    upcomingDue,
    recentlyMissed,
    inactive,
    trialOver,
    birthdays,
    unpaidActive,
    blocked,
    yearlyRevenue,
    newJoinees,
  ] = await Promise.all([
    countTodaysCheckIns(),
    sumPaidThisMonth(),
    countOverdueMembers(),
    listMembers(),
    listOverdueFeeMembers(),
    listUpcomingDueMembers(),
    listRecentlyMissedMembers(),
    listInactiveMembers(),
    listTrialOverMembers(),
    listUpcomingBirthdays(),
    listUnpaidActiveMembers(),
    listBlockedMembers(),
    getRevenueLast12Months(),
    listNewJoineesThisMonth(),
  ]);

  const activeCount = members.filter((m) => m.isActive).length;

  const statCards = [
    // Each card links to wherever that figure's actual detail already lives
    // — no new "detail view" built for any of these, they all reuse an
    // existing page rather than duplicate its list a second time.
    { label: "Check-Ins Today", value: todaysCheckIns, icon: "event_available", tone: "text-primary-container", href: "/admin-2G/attendance" },
    { label: "Revenue This Month", value: `₹${revenueThisMonth}`, icon: "payments", tone: "text-on-surface", href: "/admin-2G/fees" },
    {
      label: "Overdue Fees",
      value: overdueCount,
      icon: "error",
      tone: overdueCount > 0 ? "text-error" : "text-on-surface",
      accent: overdueCount > 0,
      href: "/admin-2G/members?filter=fee_due",
    },
    { label: "Active Members", value: activeCount, icon: "group", tone: "text-on-surface", href: "/admin-2G/members" },
  ];

  const alertCounts = [
    { label: "Fee Overdue", count: overdue.length, tone: "text-error", icon: "error", href: "/admin-2G/alerts" },
    { label: "Due Within 3 Days", count: upcomingDue.length, tone: "text-primary-container", icon: "schedule", href: "/admin-2G/alerts" },
    { label: "No Check-In 3+ Days", count: recentlyMissed.length, tone: "text-primary-container", icon: "event_busy", href: "/admin-2G/alerts" },
    { label: "Inactive 4+ Months", count: inactive.length, tone: "text-primary-container", icon: "person_off", href: "/admin-2G/alerts" },
    { label: "Trial Not Converted", count: trialOver.length, tone: "text-primary-container", icon: "person_add", href: "/admin-2G/alerts" },
    { label: "Birthdays This Week", count: birthdays.length, tone: "text-on-surface", icon: "cake", href: "/admin-2G/alerts" },
    { label: "Using Gym, Unpaid", count: unpaidActive.length, tone: "text-error", icon: "warning", href: "/admin-2G/access-control" },
    { label: "Currently Blocked", count: blocked.length, tone: "text-error", icon: "block", href: "/admin-2G/access-control" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-3">Overview</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              // The accent card's red left marker is a fixed "needs
              // attention" indicator, not a hover state — mixing Tailwind's
              // `border` shorthand (all 4 sides) with `border-l-4` on the
              // same element is a real risk of one silently overriding the
              // other, so the two never combine on one element: accent
              // cards keep their border-l-4 and only lift on hover (shadow),
              // non-accent cards get the border-color hover treatment
              // instead, matching the "Needs Attention" cards below.
              className={
                s.accent
                  ? "bg-surface-container-low p-5 rounded-2xl shadow-soft hover:shadow-soft-lg flex flex-col gap-3 border-l-4 border-l-error transition-shadow"
                  : "bg-surface-container-low p-5 rounded-2xl shadow-soft hover:shadow-soft-lg hover:border-primary-container border border-transparent flex flex-col gap-3 transition-all"
              }
            >
              <div className="flex items-center justify-between">
                <p className="font-label text-[10px] uppercase tracking-wider text-tertiary">{s.label}</p>
                <span className={`material-symbols-outlined text-lg leading-none ${s.tone}`}>{s.icon}</span>
              </div>
              <span className={`font-display text-3xl ${s.tone}`}>{s.value}</span>
            </Link>
          ))}
          {/* Popups, not Links — these two show their own detail inline
              (monthly breakdown / the actual joinee list) rather than
              reusing an existing page the way every statCards entry
              above does, since no such page exists yet for either. */}
          <RevenueCard total={yearlyRevenue.total} months={yearlyRevenue.months} />
          <NewJoineesCard joinees={newJoinees} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl text-on-surface uppercase tracking-wide">Needs Attention</h2>
          <Link
            href="/admin-2G/alerts"
            className="font-label text-xs uppercase tracking-wider text-primary-container hover:text-secondary transition-colors"
          >
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {alertCounts.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="bg-surface-container-low p-4 rounded-2xl shadow-soft hover:shadow-soft-lg hover:border-primary-container border border-transparent transition-all flex flex-col gap-2"
            >
              <span className={`material-symbols-outlined text-lg leading-none ${a.tone}`}>{a.icon}</span>
              <span className={`font-display text-2xl ${a.tone}`}>{a.count}</span>
              <p className="font-label text-[10px] uppercase tracking-wider text-tertiary">{a.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
