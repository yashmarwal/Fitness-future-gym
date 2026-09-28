"use client";

import { useEffect, useRef, useState } from "react";
import type { BroadcastSegment, AdminMember } from "@/types/admin";
import { MAX_HOLIDAY_DAYS } from "@/frontend/lib/holidayConfig";

const TODAY = new Date().toISOString().slice(0, 10);

// Local-only helper for the "Till" date input's `max` attribute (a UX
// nicety so the picker doesn't even offer an out-of-range date) — the real
// cap is enforced server-side in IST by markHolidayRange, this just steers
// the admin away from an obviously-too-long range before they submit.
function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Search-and-tag member picker for the "Selected Members" send-to option —
// a plain <select> doesn't scale past a handful of members, and this only
// needs to live here (not the shared single-select MemberSearchSelect used
// by the attendance tools), since multi-select with removable chips is a
// different enough interaction to not force into that component's API.
function MemberMultiPicker({
  members,
  selectedIds,
  onToggle,
}: {
  members: AdminMember[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const q = query.trim().toLowerCase();
  const results = q
    ? members.filter((m) => m.fullName.toLowerCase().includes(q) || m.membershipNumber.toLowerCase().includes(q))
    : members;
  const selectedMembers = members.filter((m) => selectedIds.has(m.id));

  return (
    <div className="flex flex-col gap-2">
      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedMembers.map((m) => (
            <span
              key={m.id}
              className="flex items-center gap-1 font-label text-[10px] uppercase px-2.5 py-1.5 rounded-full bg-primary-container/15 text-primary-container"
            >
              {m.fullName}
              <button
                type="button"
                onClick={() => onToggle(m.id)}
                aria-label={`Remove ${m.fullName}`}
                className="hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined text-sm leading-none">close</span>
              </button>
            </span>
          ))}
        </div>
      )}
      <div ref={containerRef} className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search by name or membership number..."
          className="w-full rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
        />
        {open && (
          <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-surface-container-low border border-surface-variant shadow-soft-lg rounded-xl">
            {results.length === 0 ? (
              <p className="px-3 py-3 font-body text-sm text-tertiary">No members match.</p>
            ) : (
              results.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onToggle(m.id)}
                  className="w-full flex items-center justify-between gap-2 text-left px-3 py-2 font-body text-sm text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  <span>
                    {m.fullName} <span className="text-tertiary">({m.membershipNumber})</span>
                  </span>
                  {selectedIds.has(m.id) && (
                    <span className="material-symbols-outlined text-base text-primary-container leading-none shrink-0">
                      check
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BroadcastComposer({ members }: { members: AdminMember[] }) {
  const [segment, setSegment] = useState<BroadcastSegment>("all");
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  // Off by default and has no effect on its own — flipping this on and
  // picking dates only actually closes the gym once the broadcast below is
  // sent (see api/admin/broadcast/route.ts). There's no separate "mark
  // holiday" action anywhere else.
  const [isHoliday, setIsHoliday] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [tillDate, setTillDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function toggleSelectedMember(id: string) {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (isHoliday && (!fromDate || !tillDate)) {
      setResult("Pick both a from and till date for the holiday.");
      return;
    }
    if (segment === "selected" && selectedMemberIds.size === 0) {
      setResult("Pick at least one member.");
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segment,
          memberIds: segment === "selected" ? Array.from(selectedMemberIds) : undefined,
          message,
          subject: subject || undefined,
          holiday: isHoliday ? { from: fromDate, till: tillDate } : undefined,
        }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setResult(
          isHoliday
            ? `Gym marked closed ${fromDate} to ${tillDate}. Sent to ${data.sent} member(s) via WhatsApp.`
            : `Sent to ${data.sent} member(s) via WhatsApp.`
        );
        setSubject("");
        setMessage("");
        setIsHoliday(false);
        setFromDate("");
        setTillDate("");
        setSelectedMemberIds(new Set());
      } else {
        setResult(data.message ?? "Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSend} className="bg-surface-container-low p-6 rounded-2xl shadow-soft flex flex-col gap-4 max-w-xl">
      <div className="flex flex-col gap-1">
        <label className="font-label text-[10px] uppercase tracking-widest text-outline">Send To</label>
        <select
          value={segment}
          onChange={(e) => setSegment(e.target.value as BroadcastSegment)}
          className="rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
        >
          <option value="all">All Active Members</option>
          <option value="overdue">Fee Overdue</option>
          <option value="inactive_14d">Inactive 14+ Days</option>
          <option value="selected">Selected Members</option>
        </select>
      </div>

      {segment === "selected" && <MemberMultiPicker members={members} selectedIds={selectedMemberIds} onToggle={toggleSelectedMember} />}

      <div className="flex flex-col gap-1">
        <label className="font-label text-[10px] uppercase tracking-widest text-outline">
          Notification Title {isHoliday ? "(also shown to members as the closure reason)" : "(optional — WhatsApp ignores this)"}
        </label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={isHoliday ? "e.g. Diwali" : "Fitness Future Gym — Update"}
          className="rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
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
          className="rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
        />
      </div>

      <div className="flex items-center justify-between gap-4 bg-surface-container rounded-xl px-4 py-3">
        <div className="min-w-0">
          <p className="font-label text-xs uppercase tracking-wide text-on-surface">Holiday Announcement</p>
          <p className="font-body text-xs text-tertiary mt-0.5">
            Blocks attendance for the dates below (max {MAX_HOLIDAY_DAYS} days) without breaking anyone&apos;s streak.
            Only takes effect once you send this broadcast.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isHoliday}
          aria-label="Toggle holiday announcement"
          onClick={() => setIsHoliday((v) => !v)}
          className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${
            isHoliday ? "bg-primary-container" : "bg-surface-variant"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-on-primary-container transition-transform ${
              isHoliday ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>

      {isHoliday && (
        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <label className="font-label text-[10px] uppercase tracking-widest text-outline">From</label>
            <input
              type="date"
              required
              min={TODAY}
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                if (tillDate && tillDate < e.target.value) setTillDate(e.target.value);
              }}
              className="w-full min-w-0 rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <label className="font-label text-[10px] uppercase tracking-widest text-outline">Till</label>
            <input
              type="date"
              required
              min={fromDate || TODAY}
              max={fromDate ? addDaysStr(fromDate, MAX_HOLIDAY_DAYS - 1) : undefined}
              value={tillDate}
              onChange={(e) => setTillDate(e.target.value)}
              className="w-full min-w-0 rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 outline-none focus:border-primary-container"
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 shadow-soft disabled:opacity-60 disabled:cursor-not-allowed transition-colors w-fit"
      >
        {submitting ? "Sending..." : isHoliday ? "Mark Holiday & Send Broadcast" : "Send Broadcast"}
      </button>
      {result && (
        <div className="bg-surface-container border-l-4 border-primary-container p-3 rounded-lg">
          <p className="font-body text-sm text-on-surface">{result}</p>
        </div>
      )}
    </form>
  );
}
