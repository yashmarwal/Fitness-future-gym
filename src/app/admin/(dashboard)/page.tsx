import { countTodaysCheckIns } from "@/server/services/admin/attendanceAdmin";
import { sumPaidThisMonth, countOverdueMembers } from "@/server/services/admin/feesAdmin";
import { listMembers } from "@/server/services/admin/members";

export default async function AdminOverviewPage() {
  const [todaysCheckIns, revenueThisMonth, overdueCount, members] = await Promise.all([
    countTodaysCheckIns(),
    sumPaidThisMonth(),
    countOverdueMembers(),
    listMembers(),
  ]);

  const today = new Date();
  const upcomingBirthdays = members.filter((m) => {
    if (!m.dateOfBirth) return false;
    const dob = new Date(m.dateOfBirth);
    const diffDays = Math.abs(
      (new Date(today.getFullYear(), dob.getMonth(), dob.getDate()).getTime() - today.getTime()) / 86400000
    );
    return diffDays <= 7;
  });

  const activeCount = members.filter((m) => m.isActive).length;

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
        <h2 className="font-display text-xl text-on-surface uppercase tracking-wide mb-3">
          Birthdays This Week
        </h2>
        {upcomingBirthdays.length === 0 ? (
          <p className="font-body text-sm text-tertiary">None this week.</p>
        ) : (
          <div className="flex flex-col divide-y divide-surface-variant/40 bg-surface-container-low shadow-hard">
            {upcomingBirthdays.map((m) => (
              <div key={m.id} className="flex justify-between px-5 py-3">
                <span className="font-label text-sm uppercase text-on-surface">{m.fullName}</span>
                <span className="font-body text-xs text-tertiary">{m.dateOfBirth}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
