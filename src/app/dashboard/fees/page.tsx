import { getMemberSession } from "@/backend/auth/session";
import { getMemberById } from "@/backend/services/member";
import UpiPayButton from "@/frontend/components/dashboard/UpiPayButton";
import { isPastDate } from "@/frontend/lib/date";

export default async function FeesPage() {
  const session = await getMemberSession();
  const member = await getMemberById(session!.memberId);

  if (!member) return null;

  const dueDate = member.feeDueDate ? new Date(member.feeDueDate) : null;
  const isOverdue = member.feeDueDate ? isPastDate(member.feeDueDate) : false;

  const upiVpa = process.env.GYM_UPI_ID;
  const upiPayeeName = process.env.GYM_UPI_PAYEE_NAME ?? "Fitness Future Gym";

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-md mx-auto">
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-6">Fee Status</h1>

      <div className="bg-surface-container-low p-6 shadow-hard flex flex-col gap-4">
        <div className="flex justify-between">
          <span className="font-label text-[10px] uppercase tracking-widest text-outline">Amount Due</span>
          <span className="font-display text-2xl text-primary-container">
            {member.feeAmount ? `₹${member.feeAmount}` : "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-label text-[10px] uppercase tracking-widest text-outline">Due Date</span>
          <span className={`font-label text-sm uppercase ${isOverdue ? "text-error" : "text-on-surface"}`}>
            {dueDate ? dueDate.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—"}
            {isOverdue ? " (Overdue)" : ""}
          </span>
        </div>

        {member.feeAmount && upiVpa ? (
          <UpiPayButton vpa={upiVpa} payeeName={upiPayeeName} amount={member.feeAmount} memberName={member.fullName} />
        ) : member.feeAmount ? (
          <p className="font-body text-sm text-tertiary">
            Online payment isn&apos;t set up yet — please pay at the front desk.
          </p>
        ) : (
          <p className="font-body text-sm text-tertiary">
            No fee amount on file yet — contact the front desk.
          </p>
        )}
      </div>
    </div>
  );
}
