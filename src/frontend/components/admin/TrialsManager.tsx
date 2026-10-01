"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import type { TrialRegistration } from "@/types/admin";
import { GLASS_SHADOW } from "@/frontend/lib/glass";

const STATUS_STYLES: Record<string, string> = {
  active: "text-primary-container",
  converted: "text-secondary",
  expired: "text-tertiary",
};

const STATUS_CHIP_STYLES: Record<string, string> = {
  active: "border-primary-container/40 text-primary-container",
  converted: "border-secondary/40 text-secondary",
  expired: "border-surface-variant text-tertiary",
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
    return (
      <div className="bg-surface-container-low rounded-2xl shadow-soft py-10 px-4 flex flex-col items-center gap-2 text-center">
        <span className="material-symbols-outlined text-3xl text-tertiary/60 leading-none">person_add</span>
        <p className="font-body text-sm text-tertiary">No trial claims yet.</p>
      </div>
    );
  }

  // The convert form is the same markup either way — reused for both the
  // table's expanded row (desktop) and the mobile card's expanded panel.
  function ConvertForm({ id }: { id: string }) {
    return (
      <div className="bg-surface-container-high p-4 rounded-xl shadow-soft border-l-4 border-primary-container flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="font-label text-[10px] uppercase tracking-widest text-outline">Program / Plan</label>
          <input
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            placeholder="e.g. Group Training"
            className="rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container w-full sm:w-auto"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-label text-[10px] uppercase tracking-widest text-outline">Fee Amount (₹)</label>
          <input
            type="number"
            value={feeAmount}
            onChange={(e) => setFeeAmount(e.target.value)}
            placeholder="3000"
            className="rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container w-full sm:w-32"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-label text-[10px] uppercase tracking-widest text-outline">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as "upi" | "cash" | "manual")}
            disabled={!feeAmount}
            className="rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container disabled:opacity-50 w-full sm:w-auto"
          >
            <option value="upi">UPI</option>
            <option value="cash">Cash</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        <button
          onClick={() => submitConvert(id, false)}
          disabled={submitting}
          className="w-full sm:w-auto rounded-xl bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-xs uppercase font-bold px-4 py-2.5 shadow-soft disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          Convert
        </button>
        <button
          onClick={() => submitConvert(id, true)}
          disabled={submitting}
          className="w-full sm:w-auto rounded-xl bg-surface-container-highest hover:bg-surface-variant text-on-surface font-label text-xs uppercase px-4 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          Skip (Convert Without Program)
        </button>
        {error && <p className="font-body text-xs text-error w-full">{error}</p>}
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block bg-surface-container-low rounded-2xl shadow-soft overflow-x-auto">
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
                      <ConvertForm id={t.id} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-3">
        {trials.map((t) => (
          <div
            key={t.id}
            className={`bg-white/4 backdrop-blur-xl backdrop-saturate-150 border border-white/10 rounded-2xl ${GLASS_SHADOW} overflow-hidden flex flex-col`}
          >
            <div className="flex items-start justify-between gap-3 p-4 pb-3">
              <div className="min-w-0">
                <p className="font-display text-base text-on-surface uppercase tracking-wide leading-tight truncate">
                  {t.fullName}
                </p>
                <span className="font-label text-[10px] uppercase tracking-widest text-primary-container">
                  {t.trialCode}
                </span>
              </div>
              <span
                className={`shrink-0 font-label text-[9px] uppercase font-bold px-2.5 py-1 rounded-full border ${
                  STATUS_CHIP_STYLES[t.status] ?? "border-surface-variant text-tertiary"
                }`}
              >
                {t.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 pb-4 font-body text-xs text-tertiary">
              <span className="flex items-center gap-1.5 truncate">
                <span className="material-symbols-outlined text-sm leading-none text-primary-container/70">call</span>
                {t.phone}
              </span>
              <span className="flex items-center gap-1.5 truncate">
                <span className="material-symbols-outlined text-sm leading-none text-primary-container/70">mail</span>
                {t.email}
              </span>
              <span className="flex items-center gap-1.5 uppercase">
                <span className="material-symbols-outlined text-sm leading-none text-primary-container/70">schedule</span>
                {t.shift} shift
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm leading-none text-primary-container/70">
                  calendar_month
                </span>
                {t.startsAt} → {t.endsAt}
              </span>
            </div>
            {t.status === "active" && (
              <button
                onClick={() => (openId === t.id ? setOpenId(null) : openConvert(t.id))}
                className="w-full flex items-center justify-center gap-1.5 font-label text-[10px] uppercase font-bold py-3 text-primary-container border-t border-white/10 active:bg-primary-container/10 transition-colors"
              >
                <span className="material-symbols-outlined text-sm leading-none">how_to_reg</span>
                {openId === t.id ? "Cancel" : "Convert To Member"}
              </button>
            )}
            {openId === t.id && (
              <div className="p-4 border-t border-white/10">
                <ConvertForm id={t.id} />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
