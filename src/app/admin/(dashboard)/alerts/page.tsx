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

      <div className="flex flex-col gap-6">
        <AlertsList
          title="Fee Overdue"
          tone="error"
          icon="error"
          emptyMessage="No overdue fees right now."
          members={overdue}
        />
        <AlertsList
          title="Fee Due Within 3 Days"
          tone="warning"
          icon="schedule"
          emptyMessage="Nothing due in the next 3 days."
          members={upcomingDue}
        />
        <AlertsList
          title="Inactive 4+ Months"
          tone="warning"
          icon="person_off"
          emptyMessage="No long-term inactive members."
          members={inactive}
        />
        <AlertsList
          title="Trial Over, No Plan Selected"
          tone="warning"
          icon="person_add"
          emptyMessage="No pending trial conversions."
          members={trialOver}
        />
        <AlertsList
          title="Birthdays This Week"
          tone="info"
          icon="cake"
          emptyMessage="No birthdays this week."
          members={birthdays}
        />
      </div>
    </div>
  );
}
