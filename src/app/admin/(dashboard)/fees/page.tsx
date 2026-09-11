import { listFeePayments } from "@/backend/services/admin/feesAdmin";
import { listMembers } from "@/backend/services/admin/members";
import FeesManager from "@/frontend/components/admin/FeesManager";

export default async function AdminFeesPage() {
  const [payments, members] = await Promise.all([listFeePayments(100), listMembers()]);

  return (
    <div>
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-6">Fee Payments</h1>
      <FeesManager payments={payments} members={members} />
    </div>
  );
}
