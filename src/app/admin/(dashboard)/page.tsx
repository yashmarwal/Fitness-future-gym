import Link from "next/link";
import { countTodaysCheckIns } from "@/backend/services/admin/attendanceAdmin";
import { sumPaidThisMonth, countOverdueMembers } from "@/backend/services/admin/feesAdmin";
import { listMembers } from "@/backend/services/admin/members";
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
  ]);

  const activeCount = members.filter((m) => m.isActive).length;

  const statCards = [
    { label: "Check-Ins Today", value: todaysCheckIns, icon: "event_available", tone: "text-primary-container" },
    { label: "Revenue This Month", value: `₹${revenueThisMonth}`, icon: "payments", tone: "text-on-surface" },
    {
      label: "Overdue Fees",
      value: overdueCount,
      icon: "error",
      tone: overdueCount > 0 ? "text-error" : "text-on-surface",
      accent: overdueCount > 0,
    },
    { label: "Active Members", value: activeCount, icon: "group", tone: "text-on-surface" },
  ];

  const alertCounts = [
    { label: "Fee Overdue", count: overdue.length, tone: "text-error", icon: "error" },
    { label: "Due Within 3 Days", count: upcomingDue.length, tone: "text-primary-container", icon: "schedule" },
    { label: "No Check-In 3+ Days", count: recentlyMissed.length, tone: "text-primary-container", icon: "event_busy" },
    { label: "Inactive 4+ Months", count: inactive.length, tone: "text-primary-container", icon: "person_off" },
    { label: "Trial Not Converted", count: trialOver.length, tone: "text-primary-container", icon: "person_add" },
    { label: "Birthdays This Week", count: birthdays.length, tone: "text-on-surface", icon: "cake" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-3">Overview</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <div
              key={s.label}
              className={`bg-surface-container-low p-5 shadow-hard flex flex-col gap-3 ${
                s.accent ? "border-l-4 border-error" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-label text-[10px] uppercase tracking-wider text-tertiary">{s.label}</p>
                <span className={`material-symbols-outlined text-lg leading-none ${s.tone}`}>{s.icon}</span>
              </div>
              <span className={`font-display text-3xl ${s.tone}`}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl text-on-surface uppercase tracking-wide">Needs Attention</h2>
          <Link
            href="/admin/alerts"
            className="font-label text-xs uppercase tracking-wider text-primary-container hover:text-secondary transition-colors"
          >
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {alertCounts.map((a) => (
            <Link
              key={a.label}
              href="/admin/alerts"
              className="bg-surface-container-low p-4 shadow-hard hover:shadow-hard-lg hover:border-primary-container border border-transparent transition-all flex flex-col gap-2"
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
