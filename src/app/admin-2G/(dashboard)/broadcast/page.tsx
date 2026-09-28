import BroadcastComposer from "@/frontend/components/admin/BroadcastComposer";
import { listMembers } from "@/backend/services/admin/members";

export default async function AdminBroadcastPage() {
  // Needed for the "Selected Members" send-to option's search picker — the
  // fixed segments (all/overdue/inactive) don't need this, but hand-picking
  // specific members does.
  const members = await listMembers();

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-2">Broadcast</h1>
        <p className="font-body text-sm text-tertiary mb-6">
          Sends over WhatsApp only — members with a phone number on file get it there; no email is sent.
        </p>
        <BroadcastComposer members={members} />
      </div>
    </div>
  );
}
