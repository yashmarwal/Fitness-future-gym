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
            className="flex items-center gap-1 font-label text-[10px] uppercase px-3 py-2 bg-error-container/40 text-error hover:bg-error-container/60 transition-colors shrink-0"
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
        <div className="flex flex-wrap items-center gap-2 bg-surface-container p-3">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (shown to the member)"
            className="flex-1 min-w-48 bg-surface-container-low border border-surface-variant text-on-surface font-body text-sm px-3 py-2 outline-none focus:border-error"
          />
          <button
            onClick={handleConfirmBlock}
            disabled={submitting}
            className="bg-error-container/70 hover:bg-error-container text-error font-label text-xs uppercase font-bold px-4 py-2 shadow-hard disabled:opacity-60 transition-colors"
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
          <p className="font-body text-xs text-error mt-0.5">{member.blockedReason}</p>
        )}
      </div>
      <button
        onClick={handleUnblock}
        disabled={submitting}
        className="flex items-center gap-1 font-label text-[10px] uppercase px-3 py-2 bg-primary-container/15 text-primary-container hover:bg-primary-container/25 transition-colors shrink-0 disabled:opacity-60"
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
          <span className="font-label text-[10px] uppercase px-2 py-0.5 border border-primary-container text-primary-container">
            {unpaidActive.length}
          </span>
        </div>
        {unpaidActive.length === 0 ? (
          <DashboardEmptyState icon="check_circle">
            Nobody&apos;s flagged — every active, recently-checked-in member has a paid-up fee status.
          </DashboardEmptyState>
        ) : (
          <div className="flex flex-col divide-y divide-surface-variant/30 bg-surface-container-low shadow-hard">
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
          <span className="font-label text-[10px] uppercase px-2 py-0.5 border border-error text-error">
            {blocked.length}
          </span>
        </div>
        {blocked.length === 0 ? (
          <DashboardEmptyState icon="lock_open">No one&apos;s currently blocked.</DashboardEmptyState>
        ) : (
          <div className="flex flex-col divide-y divide-surface-variant/30 bg-surface-container-low shadow-hard">
            {blocked.map((m) => (
              <BlockedRow key={m.id} member={m} onUnblocked={() => router.refresh()} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
