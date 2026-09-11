import { listMembers } from "@/backend/services/admin/members";
import MembersManager from "@/frontend/components/admin/MembersManager";

export default async function AdminMembersPage() {
  const members = await listMembers();

  return (
    <div>
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-6">Members</h1>
      <MembersManager members={members} />
    </div>
  );
}
