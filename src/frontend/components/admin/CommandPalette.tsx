"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { MemberSearchResult } from "@/types/admin";
import { GLASS_SHADOW } from "@/frontend/lib/glass";

const DESTINATIONS = [
  { label: "Overview", href: "/admin-2G", icon: "dashboard" },
  { label: "Fees", href: "/admin-2G/fees", icon: "payments" },
  { label: "Members", href: "/admin-2G/members", icon: "group" },
  { label: "Alerts", href: "/admin-2G/alerts", icon: "notifications" },
  { label: "Trials", href: "/admin-2G/trials", icon: "person_add" },
  { label: "Attendance", href: "/admin-2G/attendance", icon: "event_available" },
  { label: "Access Control", href: "/admin-2G/access-control", icon: "block" },
  { label: "Broadcast", href: "/admin-2G/broadcast", icon: "campaign" },
  { label: "Activity Log", href: "/admin-2G/audit-log", icon: "history" },
  { label: "Spotter AI", href: "/admin-2G/ai-assistant", icon: "smart_toy" },
];

const SEARCH_DEBOUNCE_MS = 200;

// A plain DOM event rather than lifted state/context — CommandPalette is a
// self-contained singleton mounted once in the admin layout with no props,
// so a header button elsewhere (AdminNav's search trigger) needs some way
// to open it without wiring a shared store just for one boolean.
export const OPEN_COMMAND_PALETTE_EVENT = "ff-admin-open-command-palette";

type PaletteItem = { key: string; label: string; sublabel?: string; icon: string; onSelect: () => void };

// Global quick-nav — Cmd/Ctrl+K from anywhere, or "/" when not already
// typing in a field (same convention most command palettes use, so "/"
// never hijacks normal text entry on, say, the Broadcast composer).
// Mounted once in the admin layout, same as AdminTabBar.
export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [memberResults, setMemberResults] = useState<MemberSearchResult[]>([]);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resets query/results/highlight at the point the palette actually opens
  // (here, and in handleKey/handleOpenEvent below) rather than in a
  // separate effect reacting to `open` — a reactive effect would need to
  // call setState synchronously in its own body just to do the same reset.
  function openPalette() {
    setQuery("");
    setMemberResults([]);
    setHighlighted(0);
    setOpen(true);
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping = target ? ["INPUT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable : false;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) setOpen(false);
        else openPalette();
      } else if (e.key === "/" && !isTyping && !open) {
        e.preventDefault();
        openPalette();
      }
    }
    window.addEventListener("keydown", handleKey);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, openPalette);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, openPalette);
    };
  }, [open]);

  // Purely a DOM focus call, not setState — a legitimate effect, unlike
  // the reset above.
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    // The length check lives inside the timeout callback (same pattern as
    // AdminNav's QuickMemberSearch), not synchronously in the effect body
    // — setState there would trip the same lint rule the reset above did.
    debounceRef.current = setTimeout(async () => {
      if (q.length < 2) {
        setMemberResults([]);
        return;
      }
      try {
        const res = await fetch(`/api/admin/members/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data.status === "ok") setMemberResults(data.results);
      } catch {
        // Passive — the palette just shows nav matches only.
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const q = query.trim().toLowerCase();
  const filteredDestinations = DESTINATIONS.filter((d) => d.label.toLowerCase().includes(q));

  const items: PaletteItem[] = [
    ...filteredDestinations.map((d) => ({ key: `nav-${d.href}`, label: d.label, icon: d.icon, onSelect: () => go(d.href) })),
    ...memberResults.map((m) => ({
      key: `member-${m.id}`,
      label: m.fullName,
      sublabel: m.membershipNumber,
      icon: "person",
      onSelect: () => go(`/admin-2G/members/${m.id}`),
    })),
  ];

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function handleKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, Math.max(0, items.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[highlighted]?.onSelect();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-9999 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className={`w-full max-w-lg bg-surface-container-lowest border border-white/10 rounded-2xl ${GLASS_SHADOW} overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <span className="material-symbols-outlined text-lg leading-none text-tertiary">search</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlighted(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Jump to a page or search a member..."
            className="flex-1 bg-transparent text-on-surface font-body text-sm outline-none placeholder:text-tertiary"
          />
          <kbd className="font-label text-[9px] uppercase text-tertiary border border-surface-variant rounded px-1.5 py-0.5">Esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center font-body text-sm text-tertiary">No matches.</p>
          ) : (
            items.map((item, i) => (
              <button
                key={item.key}
                type="button"
                onClick={item.onSelect}
                onMouseEnter={() => setHighlighted(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === highlighted ? "bg-primary-container/15 text-primary-container" : "text-on-surface hover:bg-white/5"
                }`}
              >
                <span className="material-symbols-outlined text-lg leading-none">{item.icon}</span>
                <span className="flex-1 min-w-0 font-body text-sm truncate">{item.label}</span>
                {item.sublabel && (
                  <span className="shrink-0 font-label text-[10px] uppercase text-tertiary">{item.sublabel}</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
