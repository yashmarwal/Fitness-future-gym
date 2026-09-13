"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import type { TrialRegistration } from "@/types/admin";

const STATUS_STYLES: Record<string, string> = {
  active: "text-primary-container",
  converted: "text-secondary",
  expired: "text-tertiary",
};

export default function TrialsManager({ trials }: { trials: TrialRegistration[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [plan, setPlan] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cash" | "manual">("upi");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openConvert(id: string) {
    setOpenId(id);
    setPlan("");
    setFeeAmount("");
    setPaymentMethod("upi");
    setError(null);
  }

  async function submitConvert(id: string, skip: boolean) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/trials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          skip
            ? {}
            : {
                plan: plan || undefined,
                feeAmount: feeAmount ? Number(feeAmount) : undefined,
                paymentMethod: feeAmount ? paymentMethod : undefined,
              }
        ),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setOpenId(null);
        router.refresh();
      } else if (data.status === "already_member") {
        setError("This phone number is already a member — nothing to convert.");
      } else {
        setError(data.message ?? "Could not convert this trial.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (trials.length === 0) {
    return <p className="font-body text-sm text-tertiary">No trial claims yet.</p>;
  }

  return (
    <div className="bg-surface-container-low shadow-hard overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b-2 border-surface-variant/60">
            <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Name</th>
            <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Phone</th>
            <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Email</th>
            <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Shift</th>
            <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Code</th>
            <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Window</th>
            <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4">Status</th>
            <th className="font-label text-[10px] uppercase tracking-wider text-outline py-3 px-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-variant/30">
          {trials.map((t) => (
            <Fragment key={t.id}>
              <tr className={openId === t.id ? "bg-surface-container" : "hover:bg-surface-container transition-colors"}>
                <td className="py-3 px-4 font-body text-sm text-on-surface">{t.fullName}</td>
                <td className="py-3 px-4 font-body text-sm text-tertiary">{t.phone}</td>
                <td className="py-3 px-4 font-body text-sm text-tertiary">{t.email}</td>
                <td className="py-3 px-4 font-body text-sm text-tertiary uppercase">{t.shift}</td>
                <td className="py-3 px-4 font-body text-sm text-primary-container">{t.trialCode}</td>
                <td className="py-3 px-4 font-body text-sm text-tertiary">
                  {t.startsAt} → {t.endsAt}
                </td>
                <td className={`py-3 px-4 font-body text-sm uppercase ${STATUS_STYLES[t.status] ?? ""}`}>
                  {t.status}
                </td>
                <td className="py-3 px-4">
                  {t.status === "active" && (
                    <button
                      onClick={() => (openId === t.id ? setOpenId(null) : openConvert(t.id))}
                      className="font-label text-[10px] uppercase text-primary-container hover:text-secondary transition-colors"
                    >
                      {openId === t.id ? "Cancel" : "Convert"}
                    </button>
                  )}
                </td>
              </tr>
              {openId === t.id && (
                <tr className="bg-surface-container">
                  <td colSpan={8} className="py-3 px-4">
                    <div className="bg-surface-container-high p-4 shadow-hard border-l-4 border-primary-container flex flex-wrap items-end gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="font-label text-[10px] uppercase tracking-widest text-outline">
                          Program / Plan
                        </label>
                        <input
                          value={plan}
                          onChange={(e) => setPlan(e.target.value)}
                          placeholder="e.g. Group Training"
                          className="bg-surface-container-low border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label text-[10px] uppercase tracking-widest text-outline">
                          Fee Amount (₹)
                        </label>
                        <input
                          type="number"
                          value={feeAmount}
                          onChange={(e) => setFeeAmount(e.target.value)}
                          placeholder="3000"
                          className="bg-surface-container-low border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container w-32"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label text-[10px] uppercase tracking-widest text-outline">
                          Payment Method
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as "upi" | "cash" | "manual")}
                          disabled={!feeAmount}
                          className="bg-surface-container-low border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container disabled:opacity-50"
                        >
                          <option value="upi">UPI</option>
                          <option value="cash">Cash</option>
                          <option value="manual">Manual</option>
                        </select>
                      </div>
                      <button
                        onClick={() => submitConvert(t.id, false)}
                        disabled={submitting}
                        className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-xs uppercase font-bold px-4 py-2 shadow-hard disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        Convert
                      </button>
                      <button
                        onClick={() => submitConvert(t.id, true)}
                        disabled={submitting}
                        className="bg-surface-container-highest hover:bg-surface-variant text-on-surface font-label text-xs uppercase px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        Skip (Convert Without Program)
                      </button>
                      {error && <p className="font-body text-xs text-error w-full">{error}</p>}
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
