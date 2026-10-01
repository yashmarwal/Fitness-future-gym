"use client";

import { useState } from "react";
import AdminModal from "@/frontend/components/admin/AdminModal";

type MonthlyRevenue = { month: string; label: string; total: number };

// Same visual language as the other Overview stat cards (StatCard-style
// tiles rendered inline in page.tsx) — a button instead of a Link, since
// this opens a popup rather than navigating anywhere.
export default function RevenueCard({ total, months }: { total: number; months: MonthlyRevenue[] }) {
  const [open, setOpen] = useState(false);
  const maxTotal = Math.max(1, ...months.map((m) => m.total));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-left bg-surface-container-low p-5 rounded-2xl shadow-soft hover:shadow-soft-lg hover:border-primary-container border border-transparent flex flex-col gap-3 transition-all"
      >
        <div className="flex items-center justify-between">
          <p className="font-label text-[10px] uppercase tracking-wider text-tertiary">Total Revenue · 12mo</p>
          <span className="material-symbols-outlined text-lg leading-none text-on-surface">payments</span>
        </div>
        <span className="font-display text-3xl text-on-surface">₹{total.toLocaleString("en-IN")}</span>
      </button>

      {open && (
        <AdminModal title="Revenue — Last 12 Months" onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-3">
            {months.map((m) => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="w-10 shrink-0 font-label text-[10px] uppercase tracking-wider text-tertiary">{m.label}</span>
                <div className="flex-1 h-5 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-container rounded-full"
                    style={{ width: `${Math.max(2, (m.total / maxTotal) * 100)}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right font-label text-xs text-on-surface tabular-nums">
                  ₹{m.total.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </AdminModal>
      )}
    </>
  );
}
