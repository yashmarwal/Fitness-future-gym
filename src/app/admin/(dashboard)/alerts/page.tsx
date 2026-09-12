import {
  listOverdueFeeMembers,
  listUpcomingDueMembers,
  listInactiveMembers,
  listTrialOverMembers,
  listUpcomingBirthdays,
} from "@/backend/services/admin/alerts";
import AlertsList from "@/frontend/components/admin/AlertsList";

export default async function AdminAlertsPage() {
  const [overdue, upcomingDue, inactive, trialOver, birthdays] = await Promise.all([
    listOverdueFeeMembers(),
    listUpcomingDueMembers(),
    listInactiveMembers(),
    listTrialOverMembers(),
    listUpcomingBirthdays(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide">Alerts &amp; Needs Attention</h1>

      <AlertsList
        title="Fee Overdue"
        tone="error"
        emptyMessage="No overdue fees right now."
        members={overdue}
      />
      <AlertsList
        title="Fee Due Within 3 Days"
        tone="warning"
        emptyMessage="Nothing due in the next 3 days."
        members={upcomingDue}
      />
      <AlertsList
        title="Inactive 4+ Months"
        tone="warning"
        emptyMessage="No long-term inactive members."
        members={inactive}
      />
      <AlertsList
        title="Trial Over, No Plan Selected"
        tone="warning"
        emptyMessage="No pending trial conversions."
        members={trialOver}
      />
      <AlertsList
        title="Birthdays This Week"
        tone="info"
        emptyMessage="No birthdays this week."
        members={birthdays}
      />
    </div>
  );
}
