"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { AdminMember } from "@/types/admin";
import { downloadCsv } from "@/frontend/lib/csv";

// Same rule as the Overview "Overdue Fees" count and the Alerts page's "Fee
// Overdue" list (active member, fee_due_date before today) — deliberately
// not a looser check, so the tag here can never disagree with those, and
// matches exactly which members show the "Fee Pending" tag below.
function isFeeOverdue(member: AdminMember): boolean {
  return member.isActive && member.feeDueDate != null && member.feeDueDate < new Date().toISOString().slice(0, 10);
}

// "Never billed" = no fee_due_date at all — a member who's never had a plan
// or fee assigned, as opposed to one who has a due date that just hasn't
// arrived (or has passed) yet.
function isNeverBilled(member: AdminMember): boolean {
  return member.feeDueDate == null;
}

type MemberFilter = "all" | "fee_due" | "never_billed";
const FILTER_OPTIONS: { key: MemberFilter; label: string }[] = [
  { key: "all", label: "All Members" },
  { key: "fee_due", label: "Fee Due" },
  { key: "never_billed", label: "Never Billed" },
];

function FeePendingTag({ member }: { member: AdminMember }) {
  if (!isFeeOverdue(member)) return null;
  return (
    <span
      title={`Fee due since ${member.feeDueDate}`}
      className="shrink-0 font-label text-[10px] uppercase px-2 py-1 rounded-full bg-error-container/40 text-error"
    >
      Fee Pending
    </span>
  );
}

const EMPTY_FORM = {
  membershipNumber: "",
  fullName: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  address: "",
  plan: "",
  feeAmount: "",
  feeDueDate: "",
  joinedAt: "",
};

export default function MembersManager({ members }: { members: AdminMember[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  // Deep-linkable from the Overview page's "Overdue Fees" stat card
  // (?filter=fee_due) — read once on initial render, same as the planner's
  // ?tab=templates. Switching tabs by hand after that is plain client state.
  const [activeFilter, setActiveFilter] = useState<MemberFilter>(() => {
    const param = searchParams.get("filter");
    return param === "fee_due" || param === "never_billed" ? param : "all";
  });
  const formRef = useRef<HTMLFormElement>(null);

  // The form renders above the list, so editing a member near the bottom
  // used to open it off-screen and look like the Edit button did nothing.
  // Depends on editingId too so switching from one member's Edit to
  // another's (form already open) scrolls back up as well.
  useEffect(() => {
    if (showForm) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showForm, editingId]);

  // Deep-linkable from the member profile page's "Edit Full Details"
  // button (?edit=<id>) — same one-time-read-on-mount pattern as the
  // ?filter deep-link above. Runs once; if `members` hasn't loaded the
  // target yet (shouldn't happen, this page always gets the full list
  // server-rendered) it just quietly does nothing rather than retrying.
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId) return;
    const target = members.find((m) => m.id === editId);
    if (target) startEdit(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function startEdit(member: AdminMember) {
    setEditingId(member.id);
    setForm({
      membershipNumber: member.membershipNumber,
      fullName: member.fullName,
      phone: member.phone ?? "",
      email: member.email ?? "",
      dateOfBirth: member.dateOfBirth ?? "",
      address: member.address ?? "",
      plan: member.plan ?? "",
      feeAmount: member.feeAmount != null ? String(member.feeAmount) : "",
      feeDueDate: member.feeDueDate ?? "",
      joinedAt: member.joinedAt ?? "",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, feeAmount: form.feeAmount ? Number(form.feeAmount) : undefined };
      if (editingId) {
        await fetch(`/api/admin/members/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/admin/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      closeForm();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(member: AdminMember) {
    await fetch(`/api/admin/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !member.isActive }),
    });
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this member permanently? This cannot be undone.")) return;
    await fetch(`/api/admin/members/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function handleExportCsv() {
    downloadCsv(
      `members-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered,
      [
        { key: "membershipNumber", label: "Membership No." },
        { key: "fullName", label: "Name" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "plan", label: "Plan" },
        { key: "feeAmount", label: "Fee Amount (INR)" },
        { key: "feeDueDate", label: "Fee Due Date" },
        { key: "joinedAt", label: "Joined" },
        { key: "isActive", label: "Active" },
        { key: "isBlocked", label: "Blocked" },
      ]
    );
  }

  // Counts are always against the full member list, not the currently
  // active filter — a tab's own count shouldn't change depending on which
  // tab is selected.
  const filterCounts: Record<MemberFilter, number> = {
    all: members.length,
    fee_due: members.filter(isFeeOverdue).length,
    never_billed: members.filter(isNeverBilled).length,
  };

  const byFilter = members.filter((m) => {
    if (activeFilter === "fee_due") return isFeeOverdue(m);
    if (activeFilter === "never_billed") return isNeverBilled(m);
    return true;
  });
  const filtered = byFilter.filter(
    (m) =>
      m.fullName.toLowerCase().includes(query.toLowerCase()) ||
      m.membershipNumber.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* overflow-x-auto + shrink-0 tabs, same pattern as AdminNav's own
          tab row, so this stays usable on a narrow phone screen instead of
          the three tabs squeezing down to unreadable widths. */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`shrink-0 flex items-center gap-1.5 font-label text-xs uppercase font-bold px-4 py-2 rounded-xl transition-colors ${
              activeFilter === f.key
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container-low text-tertiary hover:text-on-surface"
            }`}
          >
            {f.label}
            <span className={activeFilter === f.key ? "opacity-80" : "opacity-60"}>({filterCounts[f.key]})</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or membership number..."
          className="flex-1 rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body px-4 py-2 outline-none focus:border-primary-container"
        />
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={filtered.length === 0}
          className="flex items-center gap-1.5 font-label text-[10px] uppercase font-bold px-3 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-sm leading-none">download</span>
          CSV
        </button>
        <button
          onClick={showForm ? closeForm : startCreate}
          className="rounded-xl bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-xs uppercase font-bold px-4 py-2 shadow-soft shrink-0 transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Member"}
        </button>
      </div>

      {showForm && (
        // scroll-mt-32 clears the sticky admin header (top bar + nav row).
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="scroll-mt-32 bg-surface-container-low p-5 rounded-2xl shadow-soft grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <span className="sm:col-span-2 font-label text-xs uppercase tracking-widest text-primary-container">
            {editingId ? "Edit Member" : "New Member"}
          </span>
          <input
            required
            placeholder="Membership Number"
            value={form.membershipNumber}
            onChange={(e) => setForm({ ...form, membershipNumber: e.target.value })}
            className="rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
          />
          <input
            required
            placeholder="Full Name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
          />
          <input
            placeholder="Phone (+91XXXXXXXXXX)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
          />
          <div className="flex flex-col gap-1">
            <label className="font-label text-[10px] uppercase tracking-widest text-outline">Date of Birth</label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              className="rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="font-label text-[10px] uppercase tracking-widest text-outline">Address</label>
            <textarea
              placeholder="House no., street, area, city"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={2}
              className="rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container resize-none"
            />
          </div>
          <input
            placeholder="Plan (e.g. Quarterly)"
            value={form.plan}
            onChange={(e) => setForm({ ...form, plan: e.target.value })}
            className="rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
          />
          <input
            type="number"
            placeholder="Fee Amount (₹)"
            value={form.feeAmount}
            onChange={(e) => setForm({ ...form, feeAmount: e.target.value })}
            className="rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
          />
          <div className="flex flex-col gap-1">
            <label className="font-label text-[10px] uppercase tracking-widest text-outline">Fee Due Date</label>
            <input
              type="date"
              value={form.feeDueDate}
              onChange={(e) => setForm({ ...form, feeDueDate: e.target.value })}
              className="rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-label text-[10px] uppercase tracking-widest text-outline">Joined Date</label>
            <input
              type="date"
              value={form.joinedAt}
              onChange={(e) => setForm({ ...form, joinedAt: e.target.value })}
              className="rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="sm:col-span-2 rounded-xl bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 shadow-soft disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Saving..." : editingId ? "Save Changes" : "Create Member"}
          </button>
        </form>
      )}

      {filtered.length === 0 ? (
        <div className="bg-surface-container-low rounded-2xl shadow-soft py-8 px-4 text-center font-body text-sm text-tertiary">
          {members.length === 0
            ? "No members yet — add one above."
            : byFilter.length === 0
              ? "No members in this filter."
              : "No members match your search."}
        </div>
      ) : (
        <>
          {/* Table — desktop/tablet. A 9-column table has no good way to
              read on a phone even with horizontal scroll, so below md it's
              replaced entirely by the card list, not just scroll-wrapped. */}
          <div className="hidden md:block bg-surface-container-low rounded-2xl shadow-soft overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-surface-variant/60">
                  <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">No.</th>
                  <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Name</th>
                  <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Phone</th>
                  <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Email</th>
                  <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Plan</th>
                  <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Joined</th>
                  <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Fee Due</th>
                  <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Status</th>
                  <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/30">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-container transition-colors">
                    <td className="py-3 px-4 font-body text-sm text-primary-container">{m.membershipNumber}</td>
                    <td className="py-3 px-4 font-body text-sm text-on-surface">{m.fullName}</td>
                    <td className="py-3 px-4 font-body text-sm text-tertiary">{m.phone ?? "—"}</td>
                    <td className="py-3 px-4 font-body text-sm text-tertiary">{m.email ?? "—"}</td>
                    <td className="py-3 px-4 font-body text-sm text-tertiary">{m.plan ?? "—"}</td>
                    <td className="py-3 px-4 font-body text-sm text-tertiary">{m.joinedAt}</td>
                    <td className="py-3 px-4 font-body text-sm text-tertiary">{m.feeDueDate ?? "—"}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => toggleActive(m)}
                          className={`font-label text-[10px] uppercase px-2 py-1 rounded-full transition-colors ${
                            m.isActive
                              ? "bg-primary-container/20 text-primary-container hover:bg-primary-container/30"
                              : "bg-surface-container-high text-error hover:bg-surface-container-highest"
                          }`}
                        >
                          {m.isActive ? "Active" : "Inactive"}
                        </button>
                        <FeePendingTag member={m} />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/members/${m.id}`}
                          aria-label="View member profile"
                          className="flex items-center gap-1 font-label text-[10px] uppercase px-3 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm leading-none">person</span>
                          View
                        </Link>
                        <button
                          onClick={() => startEdit(m)}
                          aria-label="Edit member"
                          className="flex items-center gap-1 font-label text-[10px] uppercase px-3 py-2 rounded-lg bg-primary-container/15 text-primary-container hover:bg-primary-container/25 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm leading-none">edit</span>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          aria-label="Delete member"
                          className="flex items-center gap-1 font-label text-[10px] uppercase px-3 py-2 rounded-lg bg-error-container/40 text-error hover:bg-error-container/60 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm leading-none">delete</span>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card list — mobile only. */}
          <div className="md:hidden flex flex-col gap-3">
            {filtered.map((m) => (
              <div key={m.id} className="bg-surface-container-low rounded-2xl shadow-soft p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-label text-[10px] uppercase tracking-widest text-primary-container">
                      {m.membershipNumber}
                    </span>
                    <p className="font-body text-sm font-semibold text-on-surface truncate">{m.fullName}</p>
                  </div>
                  <div className="shrink-0 flex items-center justify-end gap-1.5 flex-wrap">
                    <button
                      onClick={() => toggleActive(m)}
                      className={`shrink-0 font-label text-[10px] uppercase px-2 py-1 rounded-full transition-colors ${
                        m.isActive
                          ? "bg-primary-container/20 text-primary-container"
                          : "bg-surface-container-high text-error"
                      }`}
                    >
                      {m.isActive ? "Active" : "Inactive"}
                    </button>
                    <FeePendingTag member={m} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-body text-xs text-tertiary">
                  <span className="truncate">{m.phone ?? "—"}</span>
                  <span className="truncate">{m.plan ?? "No plan"}</span>
                  <span>Due: {m.feeDueDate ?? "—"}</span>
                  <span>Joined: {m.joinedAt}</span>
                </div>
                <div className="flex gap-2 pt-1 border-t border-surface-variant/30">
                  <Link
                    href={`/admin/members/${m.id}`}
                    className="flex-1 flex items-center justify-center gap-1 font-label text-[10px] uppercase px-3 py-2.5 rounded-lg bg-surface-container-high active:bg-surface-container-highest text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm leading-none">person</span>
                    View
                  </Link>
                  <button
                    onClick={() => startEdit(m)}
                    className="flex-1 flex items-center justify-center gap-1 font-label text-[10px] uppercase px-3 py-2.5 rounded-lg bg-primary-container/15 text-primary-container active:bg-primary-container/25 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm leading-none">edit</span>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="flex-1 flex items-center justify-center gap-1 font-label text-[10px] uppercase px-3 py-2.5 rounded-lg bg-error-container/40 text-error active:bg-error-container/60 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm leading-none">delete</span>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
