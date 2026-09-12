import { getMemberSession } from "@/backend/auth/session";
import { getMemberById } from "@/backend/services/member";

export default async function MembershipCardPage() {
  const session = await getMemberSession();
  const member = await getMemberById(session!.memberId);

  if (!member) return null;

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-md mx-auto">
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-6">
        Digital Membership Card
      </h1>

      <div className="bg-surface-container-low p-6 shadow-hard-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary-container" />
        <span className="font-label text-[10px] uppercase tracking-widest text-primary-container">
          Fitness Future Gym
        </span>
        <h2 className="font-display text-3xl text-on-surface uppercase tracking-wide mt-1 mb-6">
          {member.fullName}
        </h2>

        <div className="flex justify-between items-end">
          <div>
            <span className="font-label text-[10px] uppercase tracking-widest text-outline">
              Membership No.
            </span>
            <p className="font-display text-xl text-primary-container tracking-widest">
              {member.membershipNumber}
            </p>
          </div>
          <div className="text-right">
            <span className="font-label text-[10px] uppercase tracking-widest text-outline">Plan</span>
            <p className="font-label text-sm text-on-surface uppercase">{member.plan ?? "—"}</p>
          </div>
        </div>

        <div className="flex justify-between mt-4 pt-4 border-t border-surface-variant/40">
          <div>
            <span className="font-label text-[10px] uppercase tracking-widest text-outline">Joined</span>
            <p className="font-body text-xs text-tertiary">{member.joinedAt}</p>
          </div>
          <div className="text-right">
            <span className="font-label text-[10px] uppercase tracking-widest text-outline">Status</span>
            <p className={`font-body text-xs ${member.isActive ? "text-primary-container" : "text-error"}`}>
              {member.isActive ? "Active" : "Inactive"}
            </p>
          </div>
        </div>
      </div>

      <p className="font-body text-xs text-tertiary mt-4 text-center">
        Show this card or state your membership number at the front desk for attendance check-in.
      </p>
    </div>
  );
}
