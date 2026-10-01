"use client";

import { useRouter } from "next/navigation";
import { OPEN_COMMAND_PALETTE_EVENT } from "@/frontend/components/admin/CommandPalette";

export default function AdminNav({ username }: { username: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    // Not also calling router.refresh() — see LoginForm.tsx for why that
    // combination races with the pending push transition. push() alone
    // still re-runs middleware with the now-cleared cookie.
    router.push("/admin-2G/login");
  }

  return (
    // bg-black, not bg-surface-container-lowest — matches the admin
    // dashboard layout's own pure-black background exactly (see
    // admin-2G/(dashboard)/layout.tsx), same fix as the member dashboard's
    // header.
    <header className="sticky top-0 z-20 w-full bg-black border-b border-surface-variant/50">
      <div className="flex items-center justify-between gap-3 px-gutter-mobile lg:px-gutter-desktop h-16">
        <span className="font-display text-lg sm:text-xl text-on-surface uppercase tracking-wide shrink-0">
          Admin <span className="text-primary-container">Panel</span>
        </span>
        {/* Replaces the old QuickMemberSearch box outright — that was its
            own separate member-only search with its own dropdown/fetch
            logic, squeezed into a cramped fixed width that still overflowed
            on narrow phones. The command palette already does everything
            it did (member search, via the same API) plus page navigation,
            so there's no reason to keep two separate search UIs — this is
            now styled to look and fill the space like a real search bar,
            not a small icon button, since it's the header's primary
            search entry point rather than a secondary shortcut hint. */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT))}
          aria-label="Open command palette"
          className="flex-1 min-w-0 flex items-center gap-2 font-body text-sm text-tertiary hover:text-on-surface bg-surface-container border border-surface-variant hover:border-primary-container rounded-full pl-4 pr-3 py-2 transition-colors"
        >
          <span className="material-symbols-outlined text-base leading-none shrink-0">search</span>
          <span className="flex-1 min-w-0 text-left truncate">Find a member or jump to a page...</span>
          <kbd className="hidden sm:inline font-label text-[9px] uppercase border border-surface-variant rounded px-1.5 py-0.5 shrink-0">
            ⌘K
          </kbd>
        </button>
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
    </header>
  );
}
