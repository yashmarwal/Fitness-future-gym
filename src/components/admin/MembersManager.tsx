"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminMember } from "@/server/services/admin/members";

export default function MembersManager({ members }: { members: AdminMember[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    membershipNumber: "",
    fullName: "",
    phone: "",
    dateOfBirth: "",
    plan: "",
    feeAmount: "",
    feeDueDate: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          feeAmount: form.feeAmount ? Number(form.feeAmount) : undefined,
        }),
      });
      setForm({ membershipNumber: "", fullName: "", phone: "", dateOfBirth: "", plan: "", feeAmount: "", feeDueDate: "" });
      setShowForm(false);
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

  const filtered = members.filter(
    (m) =>
      m.fullName.toLowerCase().includes(query.toLowerCase()) ||
      m.membershipNumber.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or membership number..."
          className="flex-1 bg-surface-container-low border border-surface-variant text-on-surface font-body px-4 py-2 outline-none focus:border-primary-container"
        />
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-primary-container text-on-primary-container font-label text-xs uppercase font-bold px-4 py-2 shadow-hard shrink-0"
        >
          {showForm ? "Cancel" : "+ Add Member"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-surface-container-low p-5 shadow-hard grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            required
            placeholder="Membership Number"
            value={form.membershipNumber}
            onChange={(e) => setForm({ ...form, membershipNumber: e.target.value })}
            className="bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
          />
          <input
            required
            placeholder="Full Name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
          />
          <input
            placeholder="Phone (+91XXXXXXXXXX)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
          />
          <input
            type="date"
            placeholder="Date of Birth"
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            className="bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
          />
          <input
            placeholder="Plan (e.g. Quarterly)"
            value={form.plan}
            onChange={(e) => setForm({ ...form, plan: e.target.value })}
            className="bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
          />
          <input
            type="number"
            placeholder="Fee Amount (₹)"
            value={form.feeAmount}
            onChange={(e) => setForm({ ...form, feeAmount: e.target.value })}
            className="bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
          />
          <input
            type="date"
            placeholder="Fee Due Date"
            value={form.feeDueDate}
            onChange={(e) => setForm({ ...form, feeDueDate: e.target.value })}
            className="bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
          />
          <button
            type="submit"
            disabled={submitting}
            className="sm:col-span-2 bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 shadow-hard disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create Member"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-surface-variant/50">
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-2 pr-4">No.</th>
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-2 pr-4">Name</th>
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-2 pr-4">Phone</th>
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-2 pr-4">Plan</th>
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-2 pr-4">Fee Due</th>
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-2 pr-4">Status</th>
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant/30">
            {filtered.map((m) => (
              <tr key={m.id}>
                <td className="py-2 pr-4 font-body text-sm text-primary-container">{m.membershipNumber}</td>
                <td className="py-2 pr-4 font-body text-sm text-on-surface">{m.fullName}</td>
                <td className="py-2 pr-4 font-body text-sm text-tertiary">{m.phone ?? "—"}</td>
                <td className="py-2 pr-4 font-body text-sm text-tertiary">{m.plan ?? "—"}</td>
                <td className="py-2 pr-4 font-body text-sm text-tertiary">{m.feeDueDate ?? "—"}</td>
                <td className="py-2 pr-4">
                  <button
                    onClick={() => toggleActive(m)}
                    className={`font-label text-[10px] uppercase px-2 py-1 ${
                      m.isActive ? "bg-primary-container/20 text-primary-container" : "bg-surface-container-high text-error"
                    }`}
                  >
                    {m.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="py-2">
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="font-label text-[10px] uppercase text-error"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
