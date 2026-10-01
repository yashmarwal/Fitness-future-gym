"use client";

import { useState } from "react";
import AdminModal from "@/frontend/components/admin/AdminModal";
import { GLASS_SHADOW } from "@/frontend/lib/glass";

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
        className={`text-left bg-white/4 backdrop-blur-xl backdrop-saturate-150 ${GLASS_SHADOW} p-5 rounded-2xl hover:bg-white/6 hover:shadow-soft-lg hover:-translate-y-0.5 flex flex-col gap-3 border border-white/10 transition-all`}
      >
        <div className="flex items-center justify-between">
          <span className="material-symbols-outlined text-xl leading-none text-on-surface">payments</span>
          <span className="font-display text-3xl leading-none text-on-surface">₹{total.toLocaleString("en-IN")}</span>
        </div>
        <p className="font-label text-[10px] uppercase tracking-wider text-tertiary leading-snug">Total Revenue · 12mo</p>
      </button>

      {open && (
        <AdminModal title="Revenue — Last 12 Months" icon="payments" onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-3">
            {months.map((m, i) => (
              <div
                key={m.month}
                style={{ animationDelay: `${i * 30}ms` }}
                className="flex items-center gap-3 animate-snap-tick"
              >
                <span className="w-10 shrink-0 font-label text-[10px] uppercase tracking-wider text-tertiary">{m.label}</span>
                <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
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
