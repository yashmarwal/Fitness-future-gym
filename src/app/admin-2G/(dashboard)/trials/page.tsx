import { listTrialRegistrations } from "@/backend/services/admin/trials";
import TrialsManager from "@/frontend/components/admin/TrialsManager";

export default async function AdminTrialsPage() {
  const trials = await listTrialRegistrations();

  return (
    <div>
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-2">Free Trial Claims</h1>
      <p className="font-body text-sm text-tertiary mb-6">
        Everyone who claimed the 2-day free trial from the Membership page. One claim per phone number, ever.
      </p>
      <TrialsManager trials={trials} />
    </div>
  );
}
