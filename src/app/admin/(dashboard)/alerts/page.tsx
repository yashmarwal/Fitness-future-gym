import {
  listOverdueFeeMembers,
  listUpcomingDueMembers,
  listRecentlyMissedMembers,
  listInactiveMembers,
  listTrialOverMembers,
  listUpcomingBirthdays,
} from "@/backend/services/admin/alerts";
import AlertsList, { AlertSummaryPill } from "@/frontend/components/admin/AlertsList";

export default async function AdminAlertsPage() {
  const [overdue, upcomingDue, recentlyMissed, inactive, trialOver, birthdays] = await Promise.all([
    listOverdueFeeMembers(),
    listUpcomingDueMembers(),
    listRecentlyMissedMembers(),
    listInactiveMembers(),
    listTrialOverMembers(),
    listUpcomingBirthdays(),
  ]);

  const categories = [
    { key: "overdue", title: "Fee Overdue", tone: "error" as const, icon: "error", members: overdue },
    { key: "upcomingDue", title: "Fee Due Within 3 Days", tone: "warning" as const, icon: "schedule", members: upcomingDue },
    { key: "recentlyMissed", title: "No Check-In In 3+ Days", tone: "warning" as const, icon: "event_busy", members: recentlyMissed },
    { key: "inactive", title: "Inactive 4+ Months", tone: "warning" as const, icon: "person_off", members: inactive },
    { key: "trialOver", title: "Trial Over, No Plan", tone: "warning" as const, icon: "person_add", members: trialOver },
    { key: "birthdays", title: "Birthdays This Week", tone: "info" as const, icon: "cake", members: birthdays },
  ];

  const totalAlerts = categories.reduce((sum, c) => sum + c.members.length, 0);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide">Alerts &amp; Needs Attention</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {categories.map((c) => (
          <AlertSummaryPill key={c.key} anchorId={c.key} title={c.title} tone={c.tone} icon={c.icon} count={c.members.length} />
        ))}
      </div>

      {totalAlerts === 0 ? (
        <p className="font-body text-sm text-tertiary bg-surface-container-low/60 border border-dashed border-surface-variant px-6 py-10 text-center">
          Everything&apos;s clear — nothing needs your attention right now.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {categories.map((c) => (
            <AlertsList key={c.key} anchorId={c.key} title={c.title} tone={c.tone} icon={c.icon} members={c.members} />
          ))}
        </div>
      )}
    </div>
  );
}
