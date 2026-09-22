"use client";

import { useState } from "react";

type Result = { template: string; status: "sent" | "failed"; error?: string };

// Kept in sync by hand with whatsappTest.ts's SAMPLE_CALLS length.
const SAMPLE_COUNT = 9;

// A durable diagnostic tool, not a throwaway script — fires every template
// this app knows how to send (see whatsappTest.ts's SAMPLE_CALLS) at one
// phone number in one tap, so a template's Approved/language/variable-count
// health can be re-checked any time (e.g. after editing or recreating one
// in Meta) without triggering the real feature behind each one.
export default function WhatsAppTemplateTester() {
  const [phone, setPhone] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun(e: React.FormEvent) {
    e.preventDefault();
    setRunning(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/admin/test-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setResults(data.results);
        setSentTo(data.phone);
      } else {
        setError(data.message ?? "Something went wrong.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="bg-surface-container-low p-6 shadow-hard flex flex-col gap-4 max-w-xl">
      <div>
        <h2 className="font-display text-lg text-on-surface uppercase tracking-wide">Test WhatsApp Templates</h2>
        <p className="font-body text-xs text-tertiary mt-1">
          Sends every template this app uses — OTP, fee reminder, birthday, announcement, welcome card, trial pass,
          trial reminder, account blocked, account unblocked — to one number, with placeholder data. Useful after
          creating or editing a template in Meta to confirm it&apos;s actually approved and correctly shaped. This
          sends {SAMPLE_COUNT} real messages, so use your own number, not a member&apos;s.
        </p>
      </div>

      <form onSubmit={handleRun} className="flex items-end gap-2">
        <div className="flex-1 flex flex-col gap-1">
          <label className="font-label text-[10px] uppercase tracking-widest text-outline">Phone Number</label>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="8287470299 or +918287470299"
            className="bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
          />
        </div>
        <button
          type="submit"
          disabled={running}
          className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-xs uppercase font-bold px-4 py-2.5 shadow-hard disabled:opacity-60 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {running ? "Sending..." : "Send All"}
        </button>
      </form>

      {error && (
        <div className="bg-error-container/20 border-l-4 border-error p-3">
          <p className="font-body text-sm text-error">{error}</p>
        </div>
      )}

      {results && (
        <div className="flex flex-col gap-2">
          <p className="font-label text-[10px] uppercase tracking-widest text-outline">Sent to {sentTo}</p>
          <div className="flex flex-col divide-y divide-surface-variant/30 border border-surface-variant/30">
            {results.map((r) => (
              <div key={r.template} className="flex items-start gap-3 px-3 py-2.5">
                <span
                  className={`material-symbols-outlined text-lg leading-none shrink-0 mt-0.5 ${
                    r.status === "sent" ? "text-primary-container" : "text-error"
                  }`}
                >
                  {r.status === "sent" ? "check_circle" : "error"}
                </span>
                <div className="min-w-0">
                  <p className="font-label text-xs uppercase tracking-wide text-on-surface">{r.template}</p>
                  {r.error && <p className="font-body text-xs text-error mt-0.5 wrap-break-word">{r.error}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
