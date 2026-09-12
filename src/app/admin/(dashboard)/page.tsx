import Link from "next/link";
import { countTodaysCheckIns } from "@/backend/services/admin/attendanceAdmin";
import { sumPaidThisMonth, countOverdueMembers } from "@/backend/services/admin/feesAdmin";
import { listMembers } from "@/backend/services/admin/members";
import {
  listOverdueFeeMembers,
  listUpcomingDueMembers,
  listInactiveMembers,
  listTrialOverMembers,
  listUpcomingBirthdays,
} from "@/backend/services/admin/alerts";

export default async function AdminOverviewPage() {
  const [todaysCheckIns, revenueThisMonth, overdueCount, members, overdue, upcomingDue, inactive, trialOver, birthdays] =
    await Promise.all([
      countTodaysCheckIns(),
      sumPaidThisMonth(),
      countOverdueMembers(),
      listMembers(),
      listOverdueFeeMembers(),
      listUpcomingDueMembers(),
      listInactiveMembers(),
      listTrialOverMembers(),
      listUpcomingBirthdays(),
    ]);

  const activeCount = members.filter((m) => m.isActive).length;

  const alertCounts = [
    { label: "Fee Overdue", count: overdue.length, tone: "text-error" },
    { label: "Due Within 3 Days", count: upcomingDue.length, tone: "text-primary-container" },
    { label: "Inactive 4+ Months", count: inactive.length, tone: "text-primary-container" },
    { label: "Trial Not Converted", count: trialOver.length, tone: "text-primary-container" },
    { label: "Birthdays This Week", count: birthdays.length, tone: "text-on-surface" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface-container-low p-5 shadow-hard">
          <span className="font-display text-3xl text-primary-container">{todaysCheckIns}</span>
          <p className="font-label text-[10px] uppercase tracking-wider text-tertiary mt-1">Check-Ins Today</p>
        </div>
        <div className="bg-surface-container-low p-5 shadow-hard">
          <span className="font-display text-3xl text-on-surface">₹{revenueThisMonth}</span>
          <p className="font-label text-[10px] uppercase tracking-wider text-tertiary mt-1">Revenue This Month</p>
        </div>
        <div className="bg-surface-container-low p-5 shadow-hard">
          <span className={`font-display text-3xl ${overdueCount > 0 ? "text-error" : "text-on-surface"}`}>
            {overdueCount}
          </span>
          <p className="font-label text-[10px] uppercase tracking-wider text-tertiary mt-1">Overdue Fees</p>
        </div>
        <div className="bg-surface-container-low p-5 shadow-hard">
          <span className="font-display text-3xl text-on-surface">{activeCount}</span>
          <p className="font-label text-[10px] uppercase tracking-wider text-tertiary mt-1">Active Members</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl text-on-surface uppercase tracking-wide">Needs Attention</h2>
          <Link href="/admin/alerts" className="font-label text-xs uppercase tracking-wider text-primary-container">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {alertCounts.map((a) => (
            <Link
              key={a.label}
              href="/admin/alerts"
              className="bg-surface-container-low p-4 shadow-hard hover:border-primary-container border border-transparent transition-colors"
            >
              <span className={`font-display text-2xl ${a.tone}`}>{a.count}</span>
              <p className="font-label text-[10px] uppercase tracking-wider text-tertiary mt-1">{a.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
