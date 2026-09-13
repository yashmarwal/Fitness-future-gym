"use client";

import { useState } from "react";
import type { BroadcastSegment } from "@/types/admin";

export default function BroadcastComposer() {
  const [segment, setSegment] = useState<BroadcastSegment>("all");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segment, message, subject: subject || undefined }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setResult(`Sent to ${data.sent} member(s) (WhatsApp + email, whichever they have on file).`);
        setSubject("");
        setMessage("");
      } else {
        setResult(data.message ?? "Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSend} className="bg-surface-container-low p-6 shadow-hard flex flex-col gap-4 max-w-xl">
      <div className="flex flex-col gap-1">
        <label className="font-label text-[10px] uppercase tracking-widest text-outline">Send To</label>
        <select
          value={segment}
          onChange={(e) => setSegment(e.target.value as BroadcastSegment)}
          className="bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
        >
          <option value="all">All Active Members</option>
          <option value="overdue">Fee Overdue</option>
          <option value="inactive_14d">Inactive 14+ Days</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-label text-[10px] uppercase tracking-widest text-outline">
          Email Subject (WhatsApp ignores this)
        </label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Fitness Future Gym — Update"
          className="bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-label text-[10px] uppercase tracking-widest text-outline">Message</label>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Your announcement..."
          className="bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 shadow-hard disabled:opacity-60 disabled:cursor-not-allowed transition-colors w-fit"
      >
        {submitting ? "Sending..." : "Send Broadcast"}
      </button>
      {result && (
        <div className="bg-surface-container border-l-4 border-primary-container p-3">
          <p className="font-body text-sm text-on-surface">{result}</p>
        </div>
      )}
    </form>
  );
}
