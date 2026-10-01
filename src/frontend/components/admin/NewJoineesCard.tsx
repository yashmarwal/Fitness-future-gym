"use client";

import { useState } from "react";
import Link from "next/link";
import AdminModal from "@/frontend/components/admin/AdminModal";

type Joinee = { id: string; fullName: string; membershipNumber: string; plan: string | null; joinedAt: string };

export default function NewJoineesCard({ joinees }: { joinees: Joinee[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-left bg-surface-container-low p-5 rounded-2xl shadow-soft hover:shadow-soft-lg hover:border-primary-container border border-transparent flex flex-col gap-3 transition-all"
      >
        <div className="flex items-center justify-between">
          <p className="font-label text-[10px] uppercase tracking-wider text-tertiary">New Joinees This Month</p>
          <span className="material-symbols-outlined text-lg leading-none text-on-surface">person_add</span>
        </div>
        <span className="font-display text-3xl text-on-surface">{joinees.length}</span>
      </button>

      {open && (
        <AdminModal title="New Joinees This Month" onClose={() => setOpen(false)}>
          {joinees.length === 0 ? (
            <p className="font-body text-sm text-tertiary">Nobody&apos;s joined yet this month.</p>
          ) : (
            <div className="flex flex-col divide-y divide-surface-variant/40">
              {joinees.map((m) => (
                <Link
                  key={m.id}
                  href={`/admin-2G/members/${m.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-3 py-3 hover:bg-surface-container-high rounded-lg px-2 -mx-2 transition-colors"
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
