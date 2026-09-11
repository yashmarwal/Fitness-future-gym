"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
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

  if (!installEvent || dismissed) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:max-w-sm z-40 bg-surface-container-high shadow-hard-lg p-4 flex items-center justify-between gap-3">
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
    </div>
  );
}
