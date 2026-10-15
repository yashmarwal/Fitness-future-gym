"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// The app's one catch-all error boundary — Next.js mounts this in place of
// whatever page/layout threw, anywhere in marketing, the member dashboard,
// or the admin panel (a more specific error.tsx in any of those folders
// would take over for that subtree instead; none exists yet, so this is the
// only net right now). Same full-screen-state-card look as BlockedScreen.tsx
// (dashboard), built entirely from the shared global tokens (font-display/
// font-body/font-label, bg-surface, text-on-surface, etc.) rather than
// either zone's own typography scale, since this has to look at home in any
// of them. Never shows error.message — that's effectively a raw Postgres/
// Supabase error string, not something to put in front of a student.
export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    console.error(error);
  }, [error]);

  // Sends an admin back to the admin panel and a member back to their own
  // dashboard, not the public marketing site — a plain "/" would be a
  // confusing dead end for either of them.
  const homeHref = pathname.startsWith("/admin-2G") ? "/admin-2G" : pathname.startsWith("/dashboard") ? "/dashboard" : "/";

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-surface">
      <div className="bg-surface-container-low shadow-soft-lg rounded-3xl p-8 max-w-sm w-full flex flex-col items-center gap-4 text-center">
        <span className="material-symbols-outlined text-5xl text-error">error</span>
        <div>
          <h1 className="font-display text-xl text-on-surface uppercase tracking-wide">Something Went Wrong</h1>
          <p className="font-body text-sm text-tertiary mt-2">
            That didn&apos;t load right — it&apos;s probably temporary. Try again, or come back in a moment.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 font-label text-xs uppercase font-bold tracking-wider px-4 py-2.5 rounded-xl bg-primary-container text-on-primary-container shadow-soft hover:bg-secondary-container transition-colors"
          >
            <span className="material-symbols-outlined text-base leading-none">refresh</span>
            Try Again
          </button>
          <a
            href={homeHref}
            className="flex items-center gap-1.5 font-label text-xs uppercase tracking-wider text-tertiary hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-base leading-none">home</span>
            Go Back
          </a>
        </div>
      </div>
    </div>
  );
}
