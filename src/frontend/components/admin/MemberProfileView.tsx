"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminMember, FeePaymentRow, TrialRegistration } from "@/types/admin";
import EditPaymentForm from "@/frontend/components/admin/EditPaymentForm";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const RECENT_ATTENDANCE_SHOWN = 10;

export default function MemberProfileView({
  member,
  payments,
  attendanceTimestamps,
  trial,
}: {
  member: AdminMember;
  payments: FeePaymentRow[];
  attendanceTimestamps: string[];
  trial: TrialRegistration | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(member.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  async function saveNotes() {
    setSavingNotes(true);
    setNotesSaved(false);
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setNotesSaved(true);
        router.refresh();
      }
    } finally {
      setSavingNotes(false);
    }
  }

  async function toggleActive() {
    setBusy(true);
    try {
      await fetch(`/api/admin/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !member.isActive }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleBlock() {
    setBusy(true);
    try {
      await fetch(`/api/admin/members/${member.id}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: blockReason }),
      });
      setShowBlockForm(false);
      setBlockReason("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleUnblock() {
    setBusy(true);
    try {
      await fetch(`/api/admin/members/${member.id}/unblock`, { method: "POST" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const totalPaid = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const recentAttendance = attendanceTimestamps.slice(0, RECENT_ATTENDANCE_SHOWN);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <Link
        href="/admin/members"
        className="inline-flex items-center gap-1.5 font-label text-xs uppercase tracking-wider text-tertiary hover:text-on-surface transition-colors w-fit"
      >
        <span className="material-symbols-outlined text-base leading-none">arrow_back</span>
        Back to Members
      </Link>

      {/* Header — identity, status, quick actions */}
      <div className="bg-surface-container-low rounded-2xl shadow-soft p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="font-label text-xs uppercase tracking-widest text-primary-container">
              {member.membershipNumber}
            </span>
            <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide">{member.fullName}</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-label text-[10px] uppercase px-2.5 py-1 rounded-full ${
                member.isActive ? "bg-primary-container/20 text-primary-container" : "bg-surface-container-high text-error"
              }`}
            >
              {member.isActive ? "Active" : "Inactive"}
            </span>
            {member.isBlocked && (
              <span className="font-label text-[10px] uppercase px-2.5 py-1 rounded-full bg-error-container/40 text-error">
                Blocked
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 font-body text-sm">
          <div>
            <p className="font-label text-[9px] uppercase tracking-widest text-outline mb-0.5">Phone</p>
            <p className="text-on-surface">{member.phone ?? "—"}</p>
          </div>
          <div>
            <p className="font-label text-[9px] uppercase tracking-widest text-outline mb-0.5">Email</p>
            <p className="text-on-surface truncate">{member.email ?? "—"}</p>
          </div>
          <div>
            <p className="font-label text-[9px] uppercase tracking-widest text-outline mb-0.5">Date of Birth</p>
            <p className="text-on-surface">{formatDate(member.dateOfBirth)}</p>
          </div>
          <div>
            <p className="font-label text-[9px] uppercase tracking-widest text-outline mb-0.5">Plan</p>
            <p className="text-on-surface">{member.plan ?? "—"}</p>
          </div>
          <div>
            <p className="font-label text-[9px] uppercase tracking-widest text-outline mb-0.5">Fee Amount</p>
            <p className="text-on-surface">{member.feeAmount != null ? `₹${member.feeAmount}` : "—"}</p>
          </div>
          <div>
            <p className="font-label text-[9px] uppercase tracking-widest text-outline mb-0.5">Fee Due</p>
            <p className={member.feeDueDate && member.feeDueDate < new Date().toISOString().slice(0, 10) ? "text-error" : "text-on-surface"}>
              {formatDate(member.feeDueDate)}
            </p>
          </div>
          <div>
            <p className="font-label text-[9px] uppercase tracking-widest text-outline mb-0.5">Joined</p>
            <p className="text-on-surface">{formatDate(member.joinedAt)}</p>
          </div>
          {member.address && (
            <div className="col-span-2 sm:col-span-3">
              <p className="font-label text-[9px] uppercase tracking-widest text-outline mb-0.5">Address</p>
              <p className="text-on-surface">{member.address}</p>
            </div>
          )}
          {member.isBlocked && member.blockedReason && (
            <div className="col-span-2 sm:col-span-3">
              <p className="font-label text-[9px] uppercase tracking-widest text-outline mb-0.5">Block Reason</p>
              <p className="text-error">{member.blockedReason}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-surface-variant/30">
          <Link
            href={`/admin/members?edit=${member.id}`}
            className="flex items-center gap-1.5 font-label text-[10px] uppercase font-bold px-3 py-2 rounded-lg bg-primary-container/15 text-primary-container hover:bg-primary-container/25 transition-colors"
          >
            <span className="material-symbols-outlined text-sm leading-none">edit</span>
            Edit Full Details
          </Link>
          <button
            onClick={toggleActive}
            disabled={busy}
            className="flex items-center gap-1.5 font-label text-[10px] uppercase font-bold px-3 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface disabled:opacity-60 transition-colors"
          >
            {member.isActive ? "Mark Inactive" : "Mark Active"}
          </button>
          {member.isBlocked ? (
            <button
              onClick={handleUnblock}
              disabled={busy}
              className="flex items-center gap-1.5 font-label text-[10px] uppercase font-bold px-3 py-2 rounded-lg bg-primary-container/15 text-primary-container hover:bg-primary-container/25 disabled:opacity-60 transition-colors"
            >
              <span className="material-symbols-outlined text-sm leading-none">lock_open</span>
              Unblock
            </button>
          ) : (
            <button
              onClick={() => setShowBlockForm((s) => !s)}
              disabled={busy}
              className="flex items-center gap-1.5 font-label text-[10px] uppercase font-bold px-3 py-2 rounded-lg bg-error-container/40 hover:bg-error-container/60 text-error disabled:opacity-60 transition-colors"
            >
              <span className="material-symbols-outlined text-sm leading-none">block</span>
              Block
            </button>
          )}
        </div>

        {showBlockForm && (
          <div className="flex flex-wrap items-center gap-2 bg-surface-container p-3 rounded-xl">
            <input
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Reason (shown to the member)"
              className="flex-1 min-w-48 rounded-lg bg-surface-container-low border border-surface-variant text-on-surface font-body text-sm px-3 py-2 outline-none focus:border-error"
            />
            <button
              onClick={handleBlock}
              disabled={busy}
              className="rounded-lg bg-error-container/70 hover:bg-error-container text-error font-label text-xs uppercase font-bold px-4 py-2 shadow-soft disabled:opacity-60 transition-colors"
            >
              {busy ? "Blocking..." : "Confirm Block"}
            </button>
          </div>
        )}
      </div>

      {/* Internal notes — private, never shown to the member */}
      <div className="bg-surface-container-low rounded-2xl shadow-soft p-6 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-lg leading-none text-primary-container">sticky_note_2</span>
          <h2 className="font-label text-sm uppercase tracking-widest text-on-surface font-bold">Internal Notes</h2>
          <span className="font-label text-[9px] uppercase tracking-wider text-outline">Staff-only — never shown to the member</span>
        </div>
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setNotesSaved(false);
          }}
          rows={3}
          placeholder="e.g. Asked about a locker, prefers evening slot..."
          className="rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body text-sm px-3 py-2.5 outline-none focus:border-primary-container resize-none"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={saveNotes}
            disabled={savingNotes || notes === (member.notes ?? "")}
            className="w-fit rounded-lg bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-xs uppercase font-bold px-4 py-2 shadow-soft disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {savingNotes ? "Saving..." : "Save Notes"}
          </button>
          {notesSaved && <span className="font-label text-[10px] uppercase text-primary-container">Saved</span>}
        </div>
      </div>

      {/* Trial history, if this member ever registered for one */}
      {trial && (
        <div className="bg-surface-container-low rounded-2xl shadow-soft p-6 flex flex-col gap-2">
          <h2 className="font-label text-sm uppercase tracking-widest text-on-surface font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-lg leading-none text-primary-container">person_add</span>
            Trial History
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 font-body text-sm mt-1">
            <div>
              <p className="font-label text-[9px] uppercase tracking-widest text-outline mb-0.5">Code</p>
              <p className="text-primary-container">{trial.trialCode}</p>
            </div>
            <div>
              <p className="font-label text-[9px] uppercase tracking-widest text-outline mb-0.5">Status</p>
              <p className="text-on-surface uppercase">{trial.status}</p>
            </div>
            <div>
              <p className="font-label text-[9px] uppercase tracking-widest text-outline mb-0.5">Shift</p>
              <p className="text-on-surface uppercase">{trial.shift}</p>
            </div>
            <div>
              <p className="font-label text-[9px] uppercase tracking-widest text-outline mb-0.5">Window</p>
              <p className="text-on-surface">
                {formatDate(trial.startsAt)} → {formatDate(trial.endsAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Attendance summary */}
      <div className="bg-surface-container-low rounded-2xl shadow-soft p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-label text-sm uppercase tracking-widest text-on-surface font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-lg leading-none text-primary-container">calendar_month</span>
            Attendance
          </h2>
          <span className="font-label text-[10px] uppercase tracking-wider text-tertiary">
            {attendanceTimestamps.length} check-in{attendanceTimestamps.length === 1 ? "" : "s"} in the last 30 days
          </span>
        </div>
        {recentAttendance.length === 0 ? (
          <p className="font-body text-sm text-tertiary">No check-ins in the last 30 days.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-surface-variant/30">
            {recentAttendance.map((ts) => (
              <li key={ts} className="py-2 font-body text-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-base leading-none text-primary-container">check_circle</span>
                {formatDateTime(ts)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Payment history */}
      <div className="bg-surface-container-low rounded-2xl shadow-soft p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-label text-sm uppercase tracking-widest text-on-surface font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-lg leading-none text-primary-container">payments</span>
            Payment History
          </h2>
          <span className="font-label text-[10px] uppercase tracking-wider text-primary-container">
            Total Paid: ₹{totalPaid.toLocaleString("en-IN")}
          </span>
        </div>
        {payments.length === 0 ? (
          <p className="font-body text-sm text-tertiary">No payments recorded yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-surface-variant/30">
            {payments.map((p) => (
              <li key={p.id} className="py-3 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lg text-primary-container">₹{p.amount}</span>
                    <span className="font-label text-[10px] uppercase text-tertiary">
                      {p.method} &middot; {p.status} &middot; {formatDate(p.createdAt)}
                    </span>
                  </div>
                  <button
                    onClick={() => setEditingPaymentId(editingPaymentId === p.id ? null : p.id)}
                    className="font-label text-[10px] uppercase text-primary-container hover:text-secondary transition-colors"
                  >
                    {editingPaymentId === p.id ? "Cancel" : "Edit"}
                  </button>
                </div>
                {editingPaymentId === p.id && (
                  <EditPaymentForm payment={p} onSaved={() => setEditingPaymentId(null)} onCancel={() => setEditingPaymentId(null)} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
