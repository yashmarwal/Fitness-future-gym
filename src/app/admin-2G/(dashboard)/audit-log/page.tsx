import Link from "next/link";
import { listAuditLog } from "@/backend/services/admin/auditLog";
import { getMemberLabelsByIds } from "@/backend/services/admin/members";
import { DashboardEmptyState } from "@/frontend/components/dashboard/Primitives";

const LIMIT = 200;

const ACTION_META: Record<string, { icon: string; label: string; tone: string }> = {
  manual_attendance: { icon: "event_available", label: "Marked attendance", tone: "text-primary-container" },
  delete_attendance: { icon: "event_busy", label: "Deleted an attendance record", tone: "text-error" },
  broadcast: { icon: "campaign", label: "Sent a broadcast", tone: "text-primary-container" },
  manual_payment: { icon: "payments", label: "Recorded a payment", tone: "text-primary-container" },
  update_fee_payment: { icon: "edit", label: "Edited a fee payment", tone: "text-on-surface" },
  delete_fee_payment: { icon: "delete", label: "Deleted a fee payment", tone: "text-error" },
  create_member: { icon: "person_add", label: "Added a new member", tone: "text-primary-container" },
  block_member: { icon: "block", label: "Blocked a member", tone: "text-error" },
  update_member: { icon: "edit", label: "Edited a member", tone: "text-on-surface" },
  delete_member: { icon: "person_remove", label: "Deleted a member", tone: "text-error" },
  unblock_member: { icon: "lock_open", label: "Unblocked a member", tone: "text-primary-container" },
  convert_trial: { icon: "how_to_reg", label: "Converted a trial to a member", tone: "text-primary-container" },
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Everything an action's `details` might carry BESIDES the member (who's
// rendered as its own link below, not folded into this string) — read
// straight off what each route actually logs (see recordAuditLog call
// sites across api/admin/*).
function describeExtra(action: string, details: Record<string, unknown> | null): string | null {
  if (!details) return null;
  const parts: string[] = [];

  if (action === "block_member" && typeof details.reason === "string") parts.push(`— ${details.reason}`);
  if (action === "manual_payment") {
    if (typeof details.amount === "number") parts.push(`₹${details.amount}`);
    if (typeof details.durationMonths === "number") parts.push(`(${details.durationMonths}mo)`);
  }
  if (action === "convert_trial" && typeof details.plan === "string") parts.push(`→ ${details.plan}`);
  if (action === "broadcast") {
    if (typeof details.segment === "string") parts.push(`to "${details.segment}"`);
    if (typeof details.sent === "number") parts.push(`— ${details.sent} sent`);
    if (Array.isArray(details.holidayDates) && details.holidayDates.length > 0) {
      parts.push(`— marked ${details.holidayDates.length} holiday day(s)`);
    }
  }

  return parts.length > 0 ? parts.join(" ") : null;
}

export default async function AuditLogPage() {
  const entries = await listAuditLog(LIMIT);

  // Every memberId referenced across this page's entries, resolved in one
  // batch query — not one lookup per row.
  const memberIds = Array.from(
    new Set(entries.map((e) => e.details?.memberId).filter((id): id is string => typeof id === "string"))
  );
  const memberLabels = await getMemberLabelsByIds(memberIds);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-2">Activity Log</h1>
        <p className="font-body text-sm text-tertiary">
          Every block, unblock, payment, member edit, and broadcast — the last {LIMIT}, most recent first.
        </p>
      </div>

      {entries.length === 0 ? (
        <DashboardEmptyState icon="history">Nothing recorded yet.</DashboardEmptyState>
      ) : (
        <div className="flex flex-col divide-y divide-surface-variant/40 bg-surface-container-low rounded-2xl shadow-soft overflow-hidden">
          {entries.map((entry) => {
            const meta = ACTION_META[entry.action] ?? { icon: "history", label: entry.action, tone: "text-on-surface" };
            const memberIdInDetails = entry.details?.memberId;
            const memberLabel =
              typeof memberIdInDetails === "string" ? memberLabels.get(memberIdInDetails) : undefined;
            const extra = describeExtra(entry.action, entry.details);

            return (
              <div key={entry.id} className="flex items-start gap-3 px-5 py-3.5">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-surface-container-high ${meta.tone}`}
                >
                  <span className="material-symbols-outlined text-base leading-none">{meta.icon}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm text-on-surface truncate">
                    {meta.label}
                    {memberLabel && (
                      <>
                        {" — "}
                        <Link
                          href={`/admin-2G/members/${memberIdInDetails}`}
                          className="text-primary-container hover:underline"
                        >
                          {memberLabel.fullName} ({memberLabel.membershipNumber})
                        </Link>
                      </>
                    )}
                    {extra && <span className="text-tertiary"> {extra}</span>}
                  </p>
                  <p className="font-label text-[9px] uppercase tracking-wider text-outline mt-0.5">
                    {entry.adminUsername ?? "Unknown admin"} · {formatWhen(entry.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
