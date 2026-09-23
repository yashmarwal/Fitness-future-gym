"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FeePaymentRow, AdminMember } from "@/types/admin";
import MemberSearchSelect from "@/frontend/components/admin/MemberSearchSelect";
import EditPaymentForm from "@/frontend/components/admin/EditPaymentForm";
import { downloadCsv } from "@/frontend/lib/csv";

type StatusFilter = "all" | "paid" | "pending";
type MethodFilter = "all" | "upi" | "cash" | "manual";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function FeesManager({ payments, members }: { payments: FeePaymentRow[]; members: AdminMember[] }) {
  const router = useRouter();
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"upi" | "cash" | "manual">("upi");
  const [durationMonths, setDurationMonths] = useState<1 | 3 | 6 | 12>(1);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (methodFilter !== "all" && p.method !== methodFilter) return false;
      if (q && !p.memberName.toLowerCase().includes(q) && !p.membershipNumber.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [payments, search, statusFilter, methodFilter]);

  const totalCollected = useMemo(
    () => filteredPayments.reduce((sum, p) => (p.status === "paid" ? sum + p.amount : sum), 0),
    [filteredPayments]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId || !amount) return;
    setSubmitting(true);
    try {
      await fetch("/api/admin/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, amount: Number(amount), method, durationMonths }),
      });
      setMemberId("");
      setAmount("");
      setDurationMonths(1);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  function handleExportCsv() {
    downloadCsv(
      `fee-payments-${new Date().toISOString().slice(0, 10)}.csv`,
      filteredPayments,
      [
        { key: "memberName", label: "Member" },
        { key: "membershipNumber", label: "Membership No." },
        { key: "amount", label: "Amount (INR)" },
        { key: "method", label: "Method" },
        { key: "status", label: "Status" },
        { key: "createdAt", label: "Date" },
      ]
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="bg-surface-container-low p-5 rounded-2xl shadow-soft flex flex-wrap items-center gap-3">
        <span className="font-label text-xs uppercase tracking-widest text-primary-container">
          Record Manual Payment
        </span>
        <MemberSearchSelect
          members={members}
          value={memberId}
          onChange={setMemberId}
          placeholder="Search member by name or membership no..."
          className="flex-1 min-w-48"
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount ₹"
          required
          className="rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container w-32"
        />
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as "upi" | "cash" | "manual")}
          className="rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
        >
          <option value="upi">UPI</option>
          <option value="cash">Cash</option>
          <option value="manual">Other</option>
        </select>
        <select
          value={durationMonths}
          onChange={(e) => setDurationMonths(Number(e.target.value) as 1 | 3 | 6 | 12)}
          title="How many months of fees this payment covers — pushes the member's next due date out by this much."
          className="rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
        >
          <option value={1}>1 Month</option>
          <option value={3}>3 Months (Quarterly)</option>
          <option value={6}>6 Months</option>
          <option value={12}>1 Year</option>
        </select>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-xs uppercase font-bold px-4 py-2 shadow-soft disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          Record
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
            placeholder="Search by member name or membership no."
            className="w-full rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body pl-10 pr-3 py-2.5 outline-none focus:border-primary-container"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body px-3 py-2.5 outline-none focus:border-primary-container"
        >
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
        </select>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value as MethodFilter)}
          className="rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body px-3 py-2.5 outline-none focus:border-primary-container"
        >
          <option value="all">All Methods</option>
          <option value="upi">UPI</option>
          <option value="cash">Cash</option>
          <option value="manual">Other</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-low px-5 py-3 rounded-xl shadow-soft">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-label text-xs uppercase tracking-wider text-outline">
            {filteredPayments.length} Payment{filteredPayments.length === 1 ? "" : "s"}
          </span>
          <span className="font-label text-xs uppercase tracking-wider text-primary-container">
            Total Collected: ₹{totalCollected.toLocaleString("en-IN")}
          </span>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={filteredPayments.length === 0}
          className="flex items-center gap-1.5 font-label text-[10px] uppercase font-bold px-3 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-sm leading-none">download</span>
          Download CSV
        </button>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="bg-surface-container-low rounded-2xl shadow-soft py-8 px-4 text-center font-body text-sm text-tertiary">
          {payments.length === 0 ? "No payments recorded yet." : "No payments match your search or filters."}
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-surface-container-low rounded-2xl shadow-soft overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-surface-variant/60">
                  <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Member</th>
                  <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Membership No.</th>
                  <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Amount</th>
                  <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Method</th>
                  <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Status</th>
                  <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Date</th>
                  <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/30">
                {filteredPayments.map((p) => (
                  <Fragment key={p.id}>
                    <tr className={editingId === p.id ? "bg-surface-container" : "hover:bg-surface-container transition-colors"}>
                      <td className="py-3 px-4 font-body text-sm text-on-surface">{p.memberName}</td>
                      <td className="py-3 px-4 font-body text-sm text-tertiary">{p.membershipNumber}</td>
                      <td className="py-3 px-4 font-body text-sm text-primary-container">₹{p.amount}</td>
                      <td className="py-3 px-4 font-body text-sm text-tertiary uppercase">{p.method}</td>
                      <td className="py-3 px-4 font-body text-sm">
                        <span className={p.status === "paid" ? "text-primary-container" : "text-tertiary"}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-body text-sm text-tertiary">{formatDate(p.createdAt)}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setEditingId(editingId === p.id ? null : p.id)}
                          className="font-label text-[10px] uppercase text-primary-container hover:text-secondary transition-colors"
                        >
                          {editingId === p.id ? "Cancel" : "Edit"}
                        </button>
                      </td>
                    </tr>
                    {editingId === p.id && (
                      <tr className="bg-surface-container">
                        <td colSpan={7} className="py-3 px-4">
                          <EditPaymentForm payment={p} onSaved={() => setEditingId(null)} onCancel={() => setEditingId(null)} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden flex flex-col gap-3">
            {filteredPayments.map((p) => (
              <div key={p.id} className="bg-surface-container-low rounded-2xl shadow-soft p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-body text-sm font-semibold text-on-surface truncate">{p.memberName}</p>
                    <span className="font-label text-[10px] uppercase tracking-widest text-tertiary">
                      {p.membershipNumber}
                    </span>
                  </div>
                  <span className="shrink-0 font-body text-base font-bold text-primary-container">₹{p.amount}</span>
                </div>
                <div className="flex items-center justify-between font-label text-[10px] uppercase tracking-wide">
                  <span className={p.status === "paid" ? "text-primary-container" : "text-tertiary"}>
                    {p.status} &middot; {p.method}
                  </span>
                  <span className="text-outline">{formatDate(p.createdAt)}</span>
                </div>
                {editingId === p.id ? (
                  <EditPaymentForm payment={p} onSaved={() => setEditingId(null)} onCancel={() => setEditingId(null)} />
                ) : (
                  <button
                    onClick={() => setEditingId(p.id)}
                    className="w-full rounded-lg font-label text-[10px] uppercase px-3 py-2.5 bg-primary-container/15 text-primary-container active:bg-primary-container/25 transition-colors border-t border-surface-variant/30 pt-3"
                  >
                    Edit / Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
