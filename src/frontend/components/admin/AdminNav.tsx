"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MemberSearchResult } from "@/types/admin";

const LINKS = [
  { href: "/admin", label: "Overview", icon: "dashboard" },
  { href: "/admin/alerts", label: "Alerts", icon: "notifications" },
  { href: "/admin/members", label: "Members", icon: "group" },
  { href: "/admin/trials", label: "Trials", icon: "person_add" },
  { href: "/admin/attendance", label: "Attendance", icon: "event_available" },
  { href: "/admin/fees", label: "Fees", icon: "payments" },
  { href: "/admin/access-control", label: "Access Control", icon: "block" },
  { href: "/admin/broadcast", label: "Broadcast", icon: "campaign" },
  { href: "/admin/ai-assistant", label: "Ask AI", icon: "smart_toy" },
];

const SEARCH_DEBOUNCE_MS = 250;

// A global "find a member" box, available from every admin page — the
// section-local search boxes on Members/Fees/Attendance only ever search
// what that one page already has loaded, so switching sections meant
// re-searching from scratch. This jumps straight to the member profile
// page instead.
function QuickMemberSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const q = query.trim();
      if (q.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/members/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data.status === "ok") setResults(data.results);
      } finally {
        setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function goToMember(id: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/admin/members/${id}`);
  }

  const showing = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative flex-1 max-w-44 sm:max-w-xs min-w-0">
      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-base pointer-events-none">
        search
      </span>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Find a member..."
        className="w-full rounded-full bg-surface-container border border-surface-variant text-on-surface font-body text-sm pl-8 pr-3 py-1.5 outline-none focus:border-primary-container"
      />

      {showing && (
        <div className="absolute z-30 mt-1 w-64 sm:w-72 max-h-72 overflow-y-auto bg-surface-container-low border border-surface-variant shadow-soft-lg rounded-xl">
          {loading ? (
            <p className="px-3 py-3 font-body text-sm text-tertiary">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 font-body text-sm text-tertiary">No members match.</p>
          ) : (
            results.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => goToMember(m.id)}
                className="w-full text-left px-3 py-2.5 font-body text-sm text-on-surface hover:bg-surface-container-high transition-colors flex items-center justify-between gap-2"
              >
                <span className="truncate">{m.fullName}</span>
                <span className="shrink-0 font-label text-[10px] uppercase text-primary-container">
                  {m.membershipNumber}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminNav({ username }: { username: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    // Not also calling router.refresh() — see LoginForm.tsx for why that
    // combination races with the pending push transition. push() alone
    // still re-runs middleware with the now-cleared cookie.
    router.push("/admin/login");
  }

  return (
    <header className="sticky top-0 z-20 w-full bg-surface-container-lowest border-b border-surface-variant/50">
      <div className="flex items-center justify-between gap-3 px-gutter-mobile lg:px-gutter-desktop h-16">
        <span className="font-display text-xl text-on-surface uppercase tracking-wide shrink-0">
          Admin <span className="text-primary-container">Panel</span>
        </span>
        <QuickMemberSearch />
        <div className="flex items-center gap-4 shrink-0">
          <span className="font-label text-xs uppercase tracking-wider text-tertiary hidden sm:inline">
            {username}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 font-label text-xs uppercase tracking-wider text-on-surface-variant hover:text-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-base leading-none">logout</span>
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
      <nav className="flex items-center gap-1 px-gutter-mobile lg:px-gutter-desktop overflow-x-auto">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-1.5 font-label text-xs uppercase tracking-wider px-4 py-3 whitespace-nowrap border-b-2 transition-colors ${
              pathname === link.href
                ? "text-primary-container border-primary-container bg-surface-container-low/60"
                : "text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-container-low/30"
            }`}
          >
            <span className="material-symbols-outlined text-base leading-none">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
