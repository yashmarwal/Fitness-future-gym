"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminMember } from "@/types/admin";
import type { UnpaidActiveMember } from "@/backend/services/admin/feeAbuse";
import { DashboardEmptyState } from "@/frontend/components/dashboard/Primitives";

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// Categorizes a block reason into a small badge — only for the three
// automatic reasons feeAbuse.ts's blockMember calls actually produce
// ("Fee overdue N+ days (automatic)", "No check-in for N+ attendance days
// (automatic)", "Never billed — N+ days since joining (automatic)").
// Matched by keyword rather than exact string so it survives the "N" in
// each changing, and returns null for anything else (an admin's own
// free-typed reason from the manual Block flow below) rather than forcing
// a generic "Manual" pill onto text that's already self-explanatory.
type BlockReasonCategory = "never_billed" | "fee_due" | "not_checked_in";

function categorizeBlockReason(reason: string | null): BlockReasonCategory | null {
  if (!reason) return null;
  const r = reason.toLowerCase();
  if (r.includes("never billed")) return "never_billed";
  if (r.includes("overdue")) return "fee_due";
  if (r.includes("check-in") || r.includes("check in")) return "not_checked_in";
  return null;
}

const REASON_PILL: Record<BlockReasonCategory, { label: string; className: string }> = {
  never_billed: { label: "Never Billed", className: "bg-error/10 text-error border-error/40" },
  fee_due: { label: "Fee Due", className: "bg-primary-container/15 text-primary-container border-primary-container/40" },
  not_checked_in: { label: "Not Checked In", className: "bg-surface-container-high text-tertiary border-surface-variant" },
};

function BlockRow({ member, onBlocked }: { member: UnpaidActiveMember; onBlocked: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [reason, setReason] = useState(member.flagReason);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirmBlock() {
    setSubmitting(true);
    try {
      await fetch(`/api/admin/members/${member.id}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      onBlocked();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-3 border-l-4 border-l-primary-container hover:bg-surface-container transition-colors">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-label text-sm uppercase text-on-surface">{member.fullName}</p>
          <p className="font-body text-xs text-tertiary">
            {member.membershipNumber} • Last check-in {formatDate(member.lastCheckedInAt)}
          </p>
          <p className="font-body text-xs text-primary-container mt-0.5">{member.flagReason}</p>
        </div>
        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1 font-label text-[10px] uppercase px-3 py-2 rounded-lg bg-error-container/40 text-error hover:bg-error-container/60 transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-sm leading-none">block</span>
            Block
          </button>
        ) : (
          <button
            onClick={() => setExpanded(false)}
            className="font-label text-[10px] uppercase text-tertiary hover:text-on-surface transition-colors shrink-0"
          >
            Cancel
          </button>
        )}
      </div>

      {expanded && (
        <div className="flex flex-wrap items-center gap-2 bg-surface-container p-3 rounded-xl">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (shown to the member)"
            className="flex-1 min-w-48 rounded-lg bg-surface-container-low border border-surface-variant text-on-surface font-body text-sm px-3 py-2 outline-none focus:border-error"
          />
          <button
            onClick={handleConfirmBlock}
            disabled={submitting}
            className="rounded-lg bg-error-container/70 hover:bg-error-container text-error font-label text-xs uppercase font-bold px-4 py-2 shadow-soft disabled:opacity-60 transition-colors"
          >
            {submitting ? "Blocking..." : "Confirm Block"}
          </button>
        </div>
      )}
    </div>
  );
}

function BlockedRow({ member, onUnblocked }: { member: AdminMember; onUnblocked: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const category = categorizeBlockReason(member.blockedReason);
  const pill = category ? REASON_PILL[category] : null;

  async function handleUnblock() {
    setSubmitting(true);
    try {
      await fetch(`/api/admin/members/${member.id}/unblock`, { method: "POST" });
      onUnblocked();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 border-l-4 border-l-error hover:bg-surface-container transition-colors">
      <div>
        <p className="font-label text-sm uppercase text-on-surface">{member.fullName}</p>
        <p className="font-body text-xs text-tertiary">{member.membershipNumber}</p>
        {member.blockedReason && (
          <div className="flex items-center flex-wrap gap-2 mt-1">
            {pill && (
              <span className={`shrink-0 font-label text-[9px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${pill.className}`}>
                {pill.label}
              </span>
            )}
            <p className="font-body text-xs text-error">{member.blockedReason}</p>
          </div>
        )}
      </div>
      <button
        onClick={handleUnblock}
        disabled={submitting}
        className="flex items-center gap-1 font-label text-[10px] uppercase px-3 py-2 rounded-lg bg-primary-container/15 text-primary-container hover:bg-primary-container/25 transition-colors shrink-0 disabled:opacity-60"
      >
        <span className="material-symbols-outlined text-sm leading-none">lock_open</span>
        {submitting ? "Unblocking..." : "Unblock"}
      </button>
    </div>
  );
}

export default function AccessControlManager({
  unpaidActive,
  blocked,
}: {
  unpaidActive: UnpaidActiveMember[];
  blocked: AdminMember[];
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-10">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className="material-symbols-outlined text-lg leading-none text-primary-container">warning</span>
          <h2 className="font-label text-sm uppercase tracking-widest text-on-surface font-bold">
            Needs Review — Active, No Paid-Up Fees
          </h2>
          <span className="font-label text-[10px] uppercase px-2 py-0.5 rounded-full border border-primary-container text-primary-container">
            {unpaidActive.length}
          </span>
        </div>
        {unpaidActive.length === 0 ? (
          <DashboardEmptyState icon="check_circle">
            Nobody&apos;s flagged — every active, recently-checked-in member has a paid-up fee status.
          </DashboardEmptyState>
        ) : (
          <div className="flex flex-col divide-y divide-surface-variant/30 bg-surface-container-low rounded-2xl shadow-soft overflow-hidden">
            {unpaidActive.map((m) => (
              <BlockRow key={m.id} member={m} onBlocked={() => router.refresh()} />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className="material-symbols-outlined text-lg leading-none text-error">block</span>
          <h2 className="font-label text-sm uppercase tracking-widest text-on-surface font-bold">
            Currently Blocked
          </h2>
          <span className="font-label text-[10px] uppercase px-2 py-0.5 rounded-full border border-error text-error">
            {blocked.length}
          </span>
        </div>
        {blocked.length === 0 ? (
          <DashboardEmptyState icon="lock_open">No one&apos;s currently blocked.</DashboardEmptyState>
        ) : (
          <div className="flex flex-col divide-y divide-surface-variant/30 bg-surface-container-low rounded-2xl shadow-soft overflow-hidden">
            {blocked.map((m) => (
              <BlockedRow key={m.id} member={m} onUnblocked={() => router.refresh()} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
