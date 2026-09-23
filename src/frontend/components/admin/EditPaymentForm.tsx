"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FeePaymentRow } from "@/types/admin";

// The inline correction form for one fee payment — shared by FeesManager's
// expanded table row/card AND the member profile page's payment history,
// same "one component, several call sites" pattern already used elsewhere
// in this admin panel (e.g. TrialsManager's ConvertForm). Scope is
// deliberately narrow (amount + method only, see
// feesAdmin.ts::updateFeePayment) — this fixes a typo on the record, it
// doesn't re-derive the member's due date.
export default function EditPaymentForm({
  payment,
  onSaved,
  onCancel,
}: {
  payment: FeePaymentRow;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(payment.amount));
  const [method, setMethod] = useState<"upi" | "cash" | "manual">(
    payment.method === "upi" || payment.method === "cash" ? payment.method : "manual"
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/fees/${payment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), method }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        onSaved();
        router.refresh();
      } else {
        setError(data.message ?? "Could not save.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete this ₹${payment.amount} payment from ${payment.memberName}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/fees/${payment.id}`, { method: "DELETE" });
      onSaved();
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="bg-surface-container-high p-4 rounded-xl flex flex-col sm:flex-row sm:items-end gap-3">
      <div className="flex flex-wrap gap-3 flex-1">
        <div className="flex flex-col gap-1">
          <label className="font-label text-[10px] uppercase tracking-widest text-outline">Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container w-32"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-label text-[10px] uppercase tracking-widest text-outline">Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as "upi" | "cash" | "manual")}
            className="rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
          >
            <option value="upi">UPI</option>
            <option value="cash">Cash</option>
            <option value="manual">Other</option>
          </select>
        </div>
      </div>

      {/* Its own row, items-center — decoupled from the fields' height above
          so Save/Delete/Cancel always align with EACH OTHER, not with
          whatever the tallest label+input group happens to be. All three
          share the same fixed width + centered content, so they're
          identically sized rectangles regardless of "Save" vs "Delete"
          (icon + longer word) vs "Cancel" having different natural text
          widths. */}
      <div className="flex items-center gap-2 w-full sm:w-auto sm:shrink-0">
        <button
          onClick={handleSave}
          disabled={saving || deleting || !amount}
          className="flex-1 sm:flex-none sm:w-32 h-10 min-w-0 flex items-center justify-center whitespace-nowrap overflow-hidden rounded-lg bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-xs uppercase font-bold px-2 shadow-soft disabled:opacity-60 transition-colors"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={handleDelete}
          disabled={saving || deleting}
          className="flex-1 sm:flex-none sm:w-32 h-10 min-w-0 flex items-center justify-center gap-1 whitespace-nowrap overflow-hidden rounded-lg bg-error-container/40 hover:bg-error-container/60 text-error font-label text-xs uppercase font-bold px-2 shadow-soft disabled:opacity-60 transition-colors"
        >
          <span className="material-symbols-outlined text-sm leading-none shrink-0">delete</span>
          {deleting ? "Deleting..." : "Delete"}
        </button>
        <button
          onClick={onCancel}
          disabled={saving || deleting}
          className="flex-1 sm:flex-none sm:w-32 h-10 min-w-0 flex items-center justify-center whitespace-nowrap overflow-hidden rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-label text-xs uppercase font-bold px-2 shadow-soft disabled:opacity-60 transition-colors"
        >
          Cancel
        </button>
      </div>
      {error && <p className="font-body text-xs text-error w-full">{error}</p>}
    </div>
  );
}
