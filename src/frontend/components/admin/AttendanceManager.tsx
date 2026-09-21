"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminMember } from "@/types/admin";
import type { TodayAttendanceRow, FeeTag } from "@/backend/services/admin/attendanceAdmin";
import MemberSearchSelect from "@/frontend/components/admin/MemberSearchSelect";

const SECTIONS: { key: "morning" | "evening" | "other"; title: string; hint: string }[] = [
  { key: "morning", title: "Morning", hint: "6:00 AM – 12:00 PM" },
  { key: "evening", title: "Evening", hint: "4:00 PM – 10:30 PM" },
  { key: "other", title: "Other", hint: "Outside normal hours (manual entries)" },
];

export default function AttendanceManager({
  records,
  members,
}: {
  records: TodayAttendanceRow[];
  members: AdminMember[];
}) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
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

  const bySection = useMemo(() => {
    const grouped: Record<"morning" | "evening" | "other", TodayAttendanceRow[]> = {
      morning: [],
      evening: [],
      other: [],
    };
    for (const r of filteredRecords) grouped[r.shift].push(r);
    return grouped;
  }, [filteredRecords]);

  function handleRefresh() {
    startRefresh(() => router.refresh());
  }

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

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search today's check-ins by name or membership no."
            className="w-full bg-surface-container-low border border-surface-variant text-on-surface font-body pl-10 pr-3 py-2.5 outline-none focus:border-primary-container"
          />
        </div>
        {/* Manual, on-demand only — this page is not live/auto-updating.
            New check-ins from the App only show up once this is pressed. */}
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-label="Refresh attendance"
          className="flex items-center gap-2 font-label text-xs uppercase font-bold px-4 py-2.5 bg-surface-container-low border border-surface-variant text-on-surface-variant hover:text-on-surface hover:border-primary-container disabled:opacity-60 transition-colors shrink-0"
        >
          <span className={`material-symbols-outlined text-lg leading-none ${isRefreshing ? "animate-spin" : ""}`}>
            refresh
          </span>
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="bg-surface-container-low shadow-hard py-8 px-4 text-center font-body text-sm text-tertiary">
          {records.length === 0 ? "No check-ins yet today." : "No check-ins match your search."}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {SECTIONS.map((section) =>
            bySection[section.key].length === 0 ? null : (
              <AttendanceSection
                key={section.key}
                title={section.title}
                hint={section.hint}
                rows={bySection[section.key]}
                onDelete={handleDelete}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function AttendanceSection({
  title,
  hint,
  rows,
  onDelete,
}: {
  title: string;
  hint: string;
  rows: TodayAttendanceRow[];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <h2 className="font-display text-lg text-on-surface uppercase tracking-wide">{title}</h2>
        <span className="font-label text-[10px] uppercase text-tertiary">
          {hint} &middot; {rows.length}
        </span>
      </div>

      <div className="hidden md:block bg-surface-container-low shadow-hard overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-surface-variant/60">
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Member</th>
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">No.</th>
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Time</th>
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4"></th>
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant/30">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-surface-container transition-colors">
                <td className="py-3 px-4 font-body text-sm text-on-surface">{r.memberName}</td>
                <td className="py-3 px-4 font-body text-sm text-primary-container">{r.membershipNumber}</td>
                <td className="py-3 px-4 font-body text-sm text-tertiary">
                  {new Date(r.checkedInAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                </td>
                <td className="py-3 px-4">
                  <FeeTagPill tag={r.feeTag} />
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => onDelete(r.id)}
                    aria-label="Delete check-in"
                    className="flex items-center gap-1 font-label text-[10px] uppercase px-3 py-2 bg-error-container/40 text-error hover:bg-error-container/60 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm leading-none">delete</span>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.id} className="bg-surface-container-low shadow-hard p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-body text-sm font-semibold text-on-surface truncate">{r.memberName}</p>
                <FeeTagPill tag={r.feeTag} />
              </div>
              <span className="font-label text-[10px] uppercase tracking-widest text-primary-container">
                {r.membershipNumber}
              </span>
              <p className="font-body text-xs text-tertiary mt-1">
                {new Date(r.checkedInAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
            <button
              onClick={() => onDelete(r.id)}
              aria-label="Delete check-in"
              className="shrink-0 flex items-center justify-center p-2.5 bg-error-container/40 text-error active:bg-error-container/60 transition-colors"
            >
              <span className="material-symbols-outlined text-lg leading-none">delete</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeeTagPill({ tag }: { tag: FeeTag }) {
  if (!tag) return null;
  const toneClasses =
    tag.tone === "error"
      ? "bg-error-container/40 text-error"
      : "bg-transparent border border-primary-container/50 text-primary-container";
  return (
    <span className={`font-label text-[9px] uppercase tracking-wide px-2 py-1 whitespace-nowrap shrink-0 ${toneClasses}`}>
      {tag.label}
    </span>
  );
}
