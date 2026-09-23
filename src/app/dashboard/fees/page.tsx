import { getMemberSession } from "@/backend/auth/session";
import { getMemberById } from "@/backend/services/member";
import { isPastDate } from "@/frontend/lib/date";

export default async function FeesPage() {
  const session = await getMemberSession();
  const member = await getMemberById(session!.memberId);

  if (!member) return null;

  const dueDate = member.feeDueDate ? new Date(member.feeDueDate) : null;
  const isOverdue = member.feeDueDate ? isPastDate(member.feeDueDate) : false;

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-md mx-auto">
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-6">Fee Status</h1>

      <div className="bg-surface-container-low p-6 shadow-soft rounded-2xl border border-surface-variant/40 flex flex-col gap-4">
        <div className="flex justify-between">
          <span className="font-label text-[10px] uppercase tracking-widest text-outline">Amount Due</span>
          <span className="font-display text-2xl text-primary-container">
            {member.feeAmount ? `₹${member.feeAmount}` : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-label text-[10px] uppercase tracking-widest text-outline">Due Date</span>
          <span className="flex items-center gap-2">
            <span className={`font-label text-sm uppercase ${isOverdue ? "text-error" : "text-on-surface"}`}>
              {dueDate ? dueDate.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" }) : "—"}
            </span>
            {isOverdue && (
              <span className="font-label text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-md bg-error-container/40 text-error">
                (Overdue)
              </span>
            )}
          </span>
        </div>

        <p className="flex items-start gap-2 font-body text-sm text-tertiary bg-surface-container p-3 rounded-xl">
          <span className="material-symbols-outlined text-base leading-none shrink-0 mt-0.5">storefront</span>
          Please pay at the front desk — cash or UPI, whichever&apos;s easiest. Staff will confirm your payment and
          update your due date right after.
        </p>
      </div>
    </div>
  );
}
