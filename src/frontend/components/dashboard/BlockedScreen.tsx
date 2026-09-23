"use client";

async function handleSignOut() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/";
}

// A full-screen wall, not the usual attendance gate — this is a punitive
// access-control state (fee-abuse tool, admin/feeAbuse.ts), not a routine
// "haven't checked in recently" nudge, so unlike AttendanceLock it blocks
// everything, including nutrition logging. Rendered by dashboard/layout.tsx
// INSTEAD of the normal header/nav/gate shell entirely, before any of it
// mounts, so there's no route a blocked member can reach.
export default function BlockedScreen({ fullName }: { fullName: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
      <div className="bg-surface-container-low shadow-soft-lg rounded-3xl p-8 max-w-sm w-full flex flex-col items-center gap-4 text-center">
        <span className="material-symbols-outlined text-5xl text-error">block</span>
        <div>
          <h1 className="font-display text-xl text-on-surface uppercase tracking-wide">Membership On Hold</h1>
          <p className="font-body text-sm text-tertiary mt-2">
            Hi {fullName}, check-in and dashboard access are on hold for your account. This usually means an
            overdue fee — please see the front desk to sort it out.
          </p>
        </div>
        <p className="font-body text-xs text-tertiary bg-surface-container rounded-xl p-3">
          Everything reopens automatically the moment your fee is recorded as paid.
        </p>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 font-label text-xs uppercase tracking-wider text-tertiary hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-base leading-none">logout</span>
          Sign Out
        </button>
      </div>
    </div>
  );
}
