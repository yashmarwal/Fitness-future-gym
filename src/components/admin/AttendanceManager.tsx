"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AttendanceRow } from "@/server/services/admin/attendanceAdmin";
import type { AdminMember } from "@/server/services/admin/members";

export default function AttendanceManager({
  records,
  members,
}: {
  records: AttendanceRow[];
  members: AdminMember[];
}) {
  const router = useRouter();
  const [memberId, setMemberId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId) return;
    setSubmitting(true);
    try {
      await fetch("/api/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      setMemberId("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/attendance/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleAdd} className="bg-surface-container-low p-5 shadow-hard flex flex-wrap items-center gap-3">
        <span className="font-label text-xs uppercase tracking-widest text-primary-container">
          Manual Check-In
        </span>
        <select
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          required
          className="bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container flex-1 min-w-48"
        >
          <option value="">Select member...</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName} ({m.membershipNumber})
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={submitting}
          className="bg-primary-container text-on-primary-container font-label text-xs uppercase font-bold px-4 py-2 shadow-hard disabled:opacity-60"
        >
          Add
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-surface-variant/50">
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-2 pr-4">Member</th>
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-2 pr-4">No.</th>
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-2 pr-4">Time</th>
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant/30">
            {records.map((r) => (
              <tr key={r.id}>
                <td className="py-2 pr-4 font-body text-sm text-on-surface">{r.memberName}</td>
                <td className="py-2 pr-4 font-body text-sm text-primary-container">{r.membershipNumber}</td>
                <td className="py-2 pr-4 font-body text-sm text-tertiary">
                  {new Date(r.checkedInAt).toLocaleString()}
                </td>
                <td className="py-2">
                  <button onClick={() => handleDelete(r.id)} className="font-label text-[10px] uppercase text-error">
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
