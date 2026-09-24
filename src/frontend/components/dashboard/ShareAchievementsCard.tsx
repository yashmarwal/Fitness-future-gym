"use client";

import { useState } from "react";
import { downloadFile, fetchCardFile, shareOrDownloadCard } from "@/frontend/lib/shareCard";

const CARD_URL = "/api/dashboard/achievement-card";

const TYPES = [
  { value: "lift", label: "Best Lift" },
  { value: "streak", label: "Streak" },
  { value: "volume", label: "Volume" },
  { value: "rank", label: "Rank" },
] as const;

// Cache-busted per request so the preview/download always reflects today's
// real numbers — the route itself is marked no-store, but browsers
// sometimes still cache an <img> src between navigations without this.
function cardUrl(type: string): string {
  return `${CARD_URL}?type=${type}&t=${Date.now()}`;
}

export default function ShareAchievementsCard() {
  const [type, setType] = useState<(typeof TYPES)[number]["value"]>("lift");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setError(null);
    setBusy(true);
    try {
      downloadFile(await fetchCardFile(cardUrl(type), `fitness-future-${type}.png`));
    } catch {
      setError("Couldn't download right now — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    setError(null);
    setBusy(true);
    try {
      const file = await fetchCardFile(cardUrl(type), `fitness-future-${type}.png`);
      await shareOrDownloadCard(file, "My Fitness Future Gym Achievements", "Check out my progress at Fitness Future Gym 💪");
    } catch {
      setError("Couldn't share right now — try downloading instead.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-surface-container-low shadow-soft rounded-2xl p-5 flex flex-col gap-4">
      <div>
        <span className="flex items-center gap-1.5 font-label text-xs uppercase tracking-widest text-primary-container">
          <span className="material-symbols-outlined text-base leading-none">ios_share</span>
          Share Your Achievements
        </span>
        <p className="font-body text-xs text-tertiary mt-1">
          Pick a card, then share it straight to Instagram or WhatsApp Status, or download it.
        </p>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={`font-label text-[10px] uppercase tracking-wide px-3 py-2 rounded-full border transition-colors ${
              type === t.value
                ? "bg-primary-container border-primary-container text-on-primary-container font-bold"
                : "bg-surface-container border-surface-variant text-on-surface-variant hover:border-primary-container"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden border border-surface-variant/40 bg-surface-container-lowest aspect-3/4 max-w-55">
        {/* eslint-disable-next-line @next/next/no-img-element -- server-generated PNG, not a next/image-optimizable static asset */}
        <img key={type} src={cardUrl(type)} alt={`${type} achievement card preview`} className="w-full h-full object-cover" />
      </div>

      {error && <p className="font-body text-xs text-error">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleShare}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-1.5 bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-xs uppercase font-bold px-4 py-3 rounded-xl shadow-soft disabled:opacity-60 transition-colors"
        >
          <span className="material-symbols-outlined text-base leading-none">ios_share</span>
          {busy ? "Preparing..." : "Share"}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-label text-xs uppercase font-bold px-4 py-3 rounded-xl shadow-soft disabled:opacity-60 transition-colors"
        >
          <span className="material-symbols-outlined text-base leading-none">download</span>
          Download
        </button>
      </div>
    </div>
  );
}
