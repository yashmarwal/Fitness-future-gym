"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AttendanceRow, AdminMember } from "@/types/admin";
import MemberSearchSelect from "@/frontend/components/admin/MemberSearchSelect";

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
  const [search, setSearch] = useState("");

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) => r.memberName.toLowerCase().includes(q) || r.membershipNumber.toLowerCase().includes(q)
    );
  }, [records, search]);

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
        <MemberSearchSelect members={members} value={memberId} onChange={setMemberId} className="flex-1 min-w-48" />
        <button
          type="submit"
          disabled={submitting || !memberId}
          className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-xs uppercase font-bold px-4 py-2 shadow-hard disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </form>

      <div className="relative max-w-sm">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
          search
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search log by member name or membership no."
          className="w-full bg-surface-container-low border border-surface-variant text-on-surface font-body pl-10 pr-3 py-2.5 outline-none focus:border-primary-container"
        />
      </div>

      <div className="bg-surface-container-low shadow-hard overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-surface-variant/60">
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Member</th>
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">No.</th>
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Time</th>
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant/30">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 px-4 text-center font-body text-sm text-tertiary">
                  {records.length === 0 ? "No check-ins recorded yet." : "No check-ins match your search."}
                </td>
              </tr>
            ) : (
              filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-surface-container transition-colors">
                  <td className="py-3 px-4 font-body text-sm text-on-surface">{r.memberName}</td>
                  <td className="py-3 px-4 font-body text-sm text-primary-container">{r.membershipNumber}</td>
                  <td className="py-3 px-4 font-body text-sm text-tertiary">
                    {new Date(r.checkedInAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDelete(r.id)}
                      aria-label="Delete check-in"
                      className="flex items-center gap-1 font-label text-[10px] uppercase px-3 py-2 bg-error-container/40 text-error hover:bg-error-container/60 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm leading-none">delete</span>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
