"use client";

import { useMemo, useState } from "react";
import type { AdminMember } from "@/types/admin";
import MemberSearchSelect from "@/frontend/components/admin/MemberSearchSelect";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateStrFor(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Converts a UTC timestamp to the LOCAL calendar date it falls on for
// whoever's viewing — a check-in just before midnight UTC could otherwise
// land on the "wrong" day for an Indian admin's screen.
function localDateStr(iso: string): string {
  const d = new Date(iso);
  return dateStrFor(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function MemberAttendanceCalendar({ members }: { members: AdminMember[] }) {
  const [memberId, setMemberId] = useState("");
  const [timestamps, setTimestamps] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  async function handleSelectMember(id: string) {
    setMemberId(id);
    setSelectedDay(null);
    setViewDate(new Date());
    setError(null);
    if (!id) {
      setTimestamps(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/attendance/member/${id}`);
      const data = await res.json();
      if (data.status === "ok") {
        setTimestamps(data.timestamps);
      } else {
        setError("Couldn't load this member's attendance.");
        setTimestamps(null);
      }
    } catch {
      setError("Network error. Please try again.");
      setTimestamps(null);
    } finally {
      setLoading(false);
    }
  }

  const byDay = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const ts of timestamps ?? []) {
      const day = localDateStr(ts);
      const existing = map.get(day);
      if (existing) existing.push(ts);
      else map.set(day, [ts]);
    }
    return map;
  }, [timestamps]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstOfMonth.getDay();

  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = viewDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const checkInsThisMonth = cells.filter(
    (day) => day !== null && byDay.has(dateStrFor(year, month, day))
  ).length;

  function changeMonth(delta: number) {
    setViewDate(new Date(year, month + delta, 1));
    setSelectedDay(null);
  }

  const selectedTimes = selectedDay ? byDay.get(selectedDay) : undefined;
  const selectedMember = members.find((m) => m.id === memberId);

  return (
    <div className="flex flex-col gap-4">
      <MemberSearchSelect members={members} value={memberId} onChange={handleSelectMember} className="w-full max-w-sm" />

      {!memberId && (
        <p className="font-body text-sm text-tertiary">Pick a member to see their check-in calendar.</p>
      )}

      {loading && <p className="font-body text-sm text-tertiary">Loading...</p>}
      {error && <p className="font-body text-sm text-error">{error}</p>}

      {memberId && !loading && timestamps !== null && (
        <div className="bg-surface-container-low p-4 shadow-hard max-w-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label text-xs uppercase tracking-widest text-primary-container">
              {selectedMember?.fullName}
            </span>
            <span className="font-label text-[10px] uppercase text-tertiary">
              {checkInsThisMonth} check-in{checkInsThisMonth === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex items-center justify-between mb-3 mt-2">
            <button
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
              className="flex items-center justify-center w-9 h-9 bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-lg leading-none">chevron_left</span>
            </button>
            <span className="font-label text-xs uppercase tracking-widest text-on-surface">{monthLabel}</span>
            <button
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              className="flex items-center justify-center w-9 h-9 bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-lg leading-none">chevron_right</span>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className="font-label text-[9px] uppercase text-outline text-center">
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={`blank-${i}`} />;
              const dateStr = dateStrFor(year, month, day);
              const dayTimestamps = byDay.get(dateStr);
              const checkedIn = Boolean(dayTimestamps);
              const isSelected = selectedDay === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDay(checkedIn ? (isSelected ? null : dateStr) : null)}
                  disabled={!checkedIn}
                  aria-label={checkedIn ? `Checked in on ${dateStr}` : undefined}
                  className={`aspect-square flex items-center justify-center font-label text-xs relative
                    ${checkedIn ? "bg-primary-container text-on-primary-container font-bold cursor-pointer" : "bg-surface-container text-on-surface cursor-default"}
                    ${isSelected ? "ring-2 ring-inset ring-on-surface" : ""}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {selectedDay && selectedTimes && (
            <div className="mt-3 pt-3 border-t border-surface-variant/40">
              <p className="font-label text-[10px] uppercase tracking-widest text-tertiary mb-1">
                {(() => {
                  // Built from the y/m/d parts (not `new Date(selectedDay)`)
                  // since that string-form parse is UTC, which can land on
                  // the wrong calendar day for timezones behind UTC.
                  const [y, m, d] = selectedDay.split("-").map(Number);
                  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  });
                })()}
              </p>
              <div className="flex flex-col gap-1">
                {selectedTimes.map((ts) => (
                  <span key={ts} className="font-body text-sm text-on-surface">
                    Checked in at{" "}
                    {new Date(ts).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
