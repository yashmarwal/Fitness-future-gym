"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Detects iOS Safari specifically — the one major mobile browser that has
// never implemented `beforeinstallprompt` and has no plans to (WebKit's
// position is that the manual Share -> Add to Home Screen flow IS the
// install mechanism, not a gap to fill). Without this, the banner below
// simply never appears on Safari at all, since installEvent never gets
// set — not a bug, just the wrong UI for a browser with no programmatic
// prompt to react to.
function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|chrome|android/i.test(ua);
  return isIos && isSafari;
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// Whether iOS is the one environment doesn't change over the component's
// lifetime, but reading navigator.userAgent during render would still
// differ between the server (no navigator at all) and the client — same
// hydration-mismatch concern as every other client-only value read this
// way elsewhere in the app (see personalNote.ts). useSyncExternalStore
// with a no-op subscribe is the SSR-safe way to read a one-time
// environment fact like this without a setState-in-effect.
function getIosInstallHintSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return !isStandalone() && isIosSafari();
}

function subscribeNoop() {
  return () => {};
}

function useShowIosInstructions(): boolean {
  return useSyncExternalStore(subscribeNoop, getIosInstallHintSnapshot, () => false);
}

export default function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const showIosInstructions = useShowIosInstructions();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    function handlePrompt(e: Event) {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  if (dismissed || (!installEvent && !showIosInstructions)) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:max-w-sm z-40 bg-surface-container-high shadow-hard-lg p-4 flex items-center justify-between gap-3">
      {installEvent ? (
        <>
          <p className="font-label text-xs uppercase tracking-wide text-on-surface">
            Add Fitness Future to your home screen
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={async () => {
                await installEvent.prompt();
                setInstallEvent(null);
              }}
              className="bg-primary-container text-on-primary-container font-label text-[10px] uppercase font-bold px-3 py-2"
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
