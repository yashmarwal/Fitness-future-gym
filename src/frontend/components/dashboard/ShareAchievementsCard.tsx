"use client";

import { useState } from "react";
import { downloadFile, fetchCardFile, shareOrDownloadCard } from "@/frontend/lib/shareCard";

const CARD_URL = "/api/dashboard/achievement-card";

const TYPES = [
  { value: "today", label: "Today" },
  { value: "lift", label: "Best Lift" },
  { value: "streak", label: "Streak" },
  { value: "volume", label: "Volume" },
  { value: "rank", label: "Rank" },
] as const;

// No cache-busting query param — the route itself is marked
// `Cache-Control: private, no-store`, which already tells the browser to
// never cache this response at all, so a query-string timestamp added
// nothing real. It also caused a genuine bug: Date.now() evaluated during
// render produced a different `src` on the server-rendered HTML than on
// the client's hydration pass, which React flags as a hydration mismatch
// (the two <img> tags disagreeing on `src`).
function cardUrl(type: string): string {
  return `${CARD_URL}?type=${type}`;
}

export default function ShareAchievementsCard() {
  const [type, setType] = useState<(typeof TYPES)[number]["value"]>("lift");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Only "today" can actually 404 (see the API route) — nothing logged yet
  // today returns one instead of a pointless "0KG" card. Every other type
  // gracefully degrades to a "—" placeholder in its own props instead of
  // failing, so this never triggers for them.
  const [previewFailed, setPreviewFailed] = useState(false);

  function handleTypeChange(value: (typeof TYPES)[number]["value"]) {
    setType(value);
    setPreviewFailed(false);
    setError(null);
  }

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
    <div className="relative overflow-hidden card-corner-glow card-glow-border bg-surface-container-low shadow-soft rounded-2xl border p-5 flex flex-col gap-4">
      <div>
        <span className="flex items-center gap-2 font-label text-xs uppercase tracking-widest text-primary-container">
          <span className="w-1 h-4 rounded-full bg-primary-container shrink-0" aria-hidden="true" />
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
            onClick={() => handleTypeChange(t.value)}
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

      <div className="mx-auto rounded-xl overflow-hidden border border-surface-variant/40 bg-surface-container-lowest aspect-3/4 max-w-55 w-full">
        {previewFailed ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-center px-4">
            <span className="material-symbols-outlined text-3xl text-tertiary leading-none">fitness_center</span>
            <p className="font-body text-xs text-tertiary">Log a workout today to unlock this card.</p>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- server-generated PNG, not a next/image-optimizable static asset
          <img
            key={type}
            src={cardUrl(type)}
            alt={`${type} achievement card preview`}
            className="w-full h-full object-cover"
            onError={() => setPreviewFailed(true)}
          />
        )}
      </div>

      {error && <p className="font-body text-xs text-error">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleShare}
          disabled={busy || previewFailed}
          className="flex-1 flex items-center justify-center gap-1.5 bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-xs uppercase font-bold px-4 py-3 rounded-xl shadow-soft disabled:opacity-60 transition-colors"
        >
          <span className="material-symbols-outlined text-base leading-none">ios_share</span>
          {busy ? "Preparing..." : "Share"}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={busy || previewFailed}
          className="flex-1 flex items-center justify-center gap-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-label text-xs uppercase font-bold px-4 py-3 rounded-xl shadow-soft disabled:opacity-60 transition-colors"
        >
          <span className="material-symbols-outlined text-base leading-none">download</span>
          Download
        </button>
      </div>
    </div>
  );
}
