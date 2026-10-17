"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Detects iOS Safari specifically — the one major mobile browser that has
// never implemented `beforeinstallprompt` and has no plans to (WebKit's
// position is that the manual Share -> Add to Home Screen flow IS the
// install mechanism, not a gap to fill).
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

// Shared by every "install our app" surface — the dismissible site-wide
// banner (PwaInstallPrompt.tsx) and the permanent call-to-action on the
// attendance check-in page — so the install-capability detection only
// lives in one place. Does NOT register the service worker; that stays a
// one-time, site-wide side effect in PwaInstallPrompt.tsx alone.
export function usePwaInstall() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const showIosInstructions = useSyncExternalStore(subscribeNoop, getIosInstallHintSnapshot, () => false);

  useEffect(() => {
    function handlePrompt(e: Event) {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  async function promptInstall() {
    if (!installEvent) return;
    await installEvent.prompt();
    setInstallEvent(null);
  }

  return {
    installEvent,
    showIosInstructions,
    promptInstall,
    canInstall: installEvent !== null || showIosInstructions,
  };
}
