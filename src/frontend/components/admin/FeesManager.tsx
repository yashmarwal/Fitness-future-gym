"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FeePaymentRow, AdminMember } from "@/types/admin";

export default function FeesManager({ payments, members }: { payments: FeePaymentRow[]; members: AdminMember[] }) {
  const router = useRouter();
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"upi" | "cash" | "manual">("upi");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId || !amount) return;
    setSubmitting(true);
    try {
      await fetch("/api/admin/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, amount: Number(amount), method }),
      });
      setMemberId("");
      setAmount("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="bg-surface-container-low p-5 shadow-hard flex flex-wrap items-center gap-3">
        <span className="font-label text-xs uppercase tracking-widest text-primary-container">
          Record Manual Payment
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
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount ₹"
          required
          className="bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container w-32"
        />
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as "upi" | "cash" | "manual")}
          className="bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
        >
          <option value="upi">UPI</option>
          <option value="cash">Cash</option>
          <option value="manual">Other</option>
        </select>
        <button
          type="submit"
          disabled={submitting}
          className="bg-primary-container text-on-primary-container font-label text-xs uppercase font-bold px-4 py-2 shadow-hard disabled:opacity-60"
        >
          Record
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-surface-variant/50">
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-2 pr-4">Member</th>
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-2 pr-4">Amount</th>
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-2 pr-4">Method</th>
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-2 pr-4">Status</th>
              <th className="font-label text-[10px] uppercase tracking-wider text-outline py-2">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant/30">
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="py-2 pr-4 font-body text-sm text-on-surface">{p.memberName}</td>
                <td className="py-2 pr-4 font-body text-sm text-primary-container">₹{p.amount}</td>
                <td className="py-2 pr-4 font-body text-sm text-tertiary uppercase">{p.method}</td>
                <td className="py-2 pr-4 font-body text-sm">
                  <span className={p.status === "paid" ? "text-primary-container" : "text-tertiary"}>
                    {p.status}
                  </span>
                </td>
                <td className="py-2 font-body text-sm text-tertiary">
                  {new Date(p.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
