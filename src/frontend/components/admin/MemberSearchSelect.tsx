"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminMember } from "@/types/admin";

// A type-to-filter member picker — replaces a plain <select>, which
// becomes unusable to scroll through once a gym has more than a handful
// of members. Shared by the admin attendance tools (manual check-in form,
// per-member calendar) since both need "search for a member, pick one."
export default function MemberSearchSelect({
  members,
  value,
  onChange,
  placeholder = "Search by name or membership no...",
  className = "",
}: {
  members: AdminMember[];
  value: string;
  onChange: (memberId: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = members.find((m) => m.id === value);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const q = query.trim().toLowerCase();
  const results = q
    ? members.filter((m) => m.fullName.toLowerCase().includes(q) || m.membershipNumber.toLowerCase().includes(q))
    : members;

  function handlePick(member: AdminMember) {
    onChange(member.id);
    setQuery("");
    setOpen(false);
  }

  function handleClear() {
    onChange("");
    setQuery("");
    setOpen(true);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {selected && !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between gap-2 rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-2 text-left"
        >
          <span className="truncate">
            {selected.fullName} <span className="text-tertiary">({selected.membershipNumber})</span>
          </span>
          <span className="material-symbols-outlined text-base text-tertiary shrink-0">edit</span>
        </button>
      ) : (
        <div className="relative">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="w-full rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body pl-9 pr-8 py-2 outline-none focus:border-primary-container"
          />
          {selected && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear selection"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tertiary hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-lg leading-none">close</span>
            </button>
          )}
        </div>
      )}

      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto bg-surface-container-low border border-surface-variant shadow-soft-lg rounded-xl">
          {results.length === 0 ? (
            <p className="px-3 py-3 font-body text-sm text-tertiary">No members match.</p>
          ) : (
            results.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handlePick(m)}
                className="w-full text-left px-3 py-2 font-body text-sm text-on-surface hover:bg-surface-container-high transition-colors"
              >
                {m.fullName} <span className="text-tertiary">({m.membershipNumber})</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
