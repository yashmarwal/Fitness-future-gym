import { listFeePayments } from "@/backend/services/admin/feesAdmin";
import { listMembers } from "@/backend/services/admin/members";
import { getLegacyImportStatus } from "@/backend/services/legacyFeeImport";
import FeesManager from "@/frontend/components/admin/FeesManager";
import LegacyImportStatusCard from "@/frontend/components/admin/LegacyImportStatusCard";

export default async function AdminFeesPage() {
  const [payments, members, legacyImportStatus] = await Promise.all([
    listFeePayments(100),
    listMembers(),
    getLegacyImportStatus(),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-6">Fee Payments</h1>
      <LegacyImportStatusCard status={legacyImportStatus} />
      <FeesManager payments={payments} members={members} />
    </div>
  );
}
