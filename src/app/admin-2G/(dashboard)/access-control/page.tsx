import { listUnpaidActiveMembers, listBlockedMembers } from "@/backend/services/admin/feeAbuse";
import AccessControlManager from "@/frontend/components/admin/AccessControlManager";

export default async function AccessControlPage() {
  const [unpaidActive, blocked] = await Promise.all([listUnpaidActiveMembers(), listBlockedMembers()]);

  return (
    <div>
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-2">Access Control</h1>
      <p className="font-body text-sm text-tertiary mb-6">
        Members using the gym without a paid-up account, and members currently blocked from checking in.
        Fees overdue 5+ days block automatically; recording a payment always lifts a block.
      </p>
      <AccessControlManager unpaidActive={unpaidActive} blocked={blocked} />
    </div>
  );
}
