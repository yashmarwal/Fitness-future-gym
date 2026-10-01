"use client";

import { useState } from "react";
import Link from "next/link";
import AdminModal from "@/frontend/components/admin/AdminModal";
import { GLASS_SHADOW } from "@/frontend/lib/glass";

type Joinee = { id: string; fullName: string; membershipNumber: string; plan: string | null; joinedAt: string };

export default function NewJoineesCard({ joinees }: { joinees: Joinee[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-left bg-white/4 backdrop-blur-xl backdrop-saturate-150 ${GLASS_SHADOW} p-5 rounded-2xl hover:bg-white/6 hover:shadow-soft-lg hover:-translate-y-0.5 flex flex-col gap-3 border border-white/10 transition-all`}
      >
        <div className="flex items-center justify-between">
          <span className="material-symbols-outlined text-xl leading-none text-on-surface">person_add</span>
          <span className="font-display text-3xl leading-none text-on-surface">{joinees.length}</span>
        </div>
        <p className="font-label text-[10px] uppercase tracking-wider text-tertiary leading-snug">New Joinees This Month</p>
      </button>

      {open && (
        <AdminModal title="New Joinees This Month" icon="person_add" onClose={() => setOpen(false)}>
          {joinees.length === 0 ? (
            <p className="font-body text-sm text-tertiary">Nobody&apos;s joined yet this month.</p>
          ) : (
            <div className="flex flex-col divide-y divide-white/10">
              {joinees.map((m, i) => (
                <Link
                  key={m.id}
                  href={`/admin-2G/members/${m.id}`}
                  onClick={() => setOpen(false)}
                  style={{ animationDelay: `${i * 30}ms` }}
                  className="flex items-center justify-between gap-3 py-3 hover:bg-white/5 rounded-lg px-2 -mx-2 transition-colors animate-snap-tick"
                >
                  <div className="min-w-0">
                    <p className="font-label text-sm uppercase tracking-wide text-on-surface truncate">{m.fullName}</p>
                    <p className="font-body text-xs text-tertiary">
                      {m.membershipNumber}
                      {m.plan ? ` · ${m.plan}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-label text-[10px] uppercase text-tertiary">
                    {new Date(`${m.joinedAt}T12:00:00+05:30`).toLocaleDateString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </AdminModal>
      )}
    </>
  );
}
