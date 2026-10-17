"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { usePwaInstall } from "@/frontend/lib/usePwaInstall";

export default function PwaInstallPrompt() {
  const { installEvent, showIosInstructions, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);
  // The banner's copy follows whichever manifest is actually active on this
  // page (see admin-2G/(dashboard)/layout.tsx) — installing from an admin
  // page installs the admin shortcut (start_url "/admin-2G"), so the label
  // should say so instead of always reading "Fitness Future".
  const isAdmin = usePathname()?.startsWith("/admin-2G") ?? false;
  const appLabel = isAdmin ? "Fitness Future Admin" : "Fitness Future";

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "development") {
        // sw.js cache-firsts everything under /_next/static/ on the
        // assumption that a new build always means a new (content-hashed)
        // URL — true for a real `next build`, not for `next dev`, where a
        // chunk's URL can stay the same across an edit. Registered here
        // during dev, it would keep serving a stale cached JS chunk from
        // Cache Storage forever, no matter how many times the source
        // changes underneath it (this is exactly why an edited sound
        // effect kept playing its old version). Actively unregister/clear
        // anything already cached from before this guard existed, not just
        // skip registering going forward.
        navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister())).catch(() => {});
        if ("caches" in window) {
          caches.keys().then((keys) => keys.forEach((key) => caches.delete(key))).catch(() => {});
        }
      } else {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      }
    }
  }, []);

  if (dismissed || (!installEvent && !showIosInstructions)) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:max-w-sm z-40 bg-surface-container-high rounded-2xl shadow-soft-lg p-4 flex items-center justify-between gap-3">
      {installEvent ? (
        <>
          <p className="font-label text-xs uppercase tracking-wide text-on-surface">
            Add {appLabel} to your home screen
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={promptInstall}
              className="rounded-lg bg-primary-container text-on-primary-container font-label text-[10px] uppercase font-bold px-3 py-2"
            >
              Install
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="font-label text-[10px] uppercase text-on-surface-variant"
            >
              Not Now
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="font-label text-xs uppercase tracking-wide text-on-surface flex items-center gap-1.5 flex-wrap">
            Tap
            <span className="material-symbols-outlined text-base leading-none text-primary-container">ios_share</span>
            then &quot;Add to Home Screen&quot;
          </p>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="shrink-0 font-label text-[10px] uppercase text-on-surface-variant"
          >
            Not Now
          </button>
        </>
      )}
    </div>
  );
}
