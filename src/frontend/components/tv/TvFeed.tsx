"use client";

import { useEffect, useState, type ReactNode } from "react";

type LiveRoomMember = { firstName: string; score: number | null };
type LiveRoom = {
  id: string;
  name: string;
  mode: "common_exercise" | "xp_race";
  exerciseName: string | null;
  endsAt: string | null;
  members: LiveRoomMember[];
};

type FeedItem = {
  id: string;
  firstName: string;
  at: string;
  exerciseName?: string;
  playgroundMode: "common_exercise" | "xp_race";
};

// Live matches poll fast — this is the whole point of "feels like watching
// a match," a scoreboard that visibly updates. The achievement ticker is
// background noise by comparison and can poll slower.
const ROOMS_POLL_MS = 3000;
const FEED_POLL_MS = 8000;

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function describeFeedItem(item: FeedItem): string {
  return `${item.firstName} won a Playground Challenge — ${item.playgroundMode === "xp_race" ? "XP Race" : item.exerciseName}`;
}

// The top CTA banner — a from-scratch rebuild using a different technique
// than Marquee below: one copy of the text, sliding from fully off the
// right edge to fully off the left (see the tv-banner-slide keyframe,
// globals.css, for why this handles short text on a wide banner correctly
// where the duplicate-content trick didn't visibly move). Explicit height
// since the sliding text is absolutely positioned and would otherwise
// collapse its own container.
function TopBanner({ text }: { text: string }) {
  return (
    <div className="relative overflow-hidden whitespace-nowrap bg-primary-container text-on-primary-container h-12">
      <span className="animate-tv-banner-slide font-label text-base uppercase font-bold tracking-wide inline-block">{text}</span>
    </div>
  );
}

// Explicit per-instance duration instead of measuring content width in JS
// (the previous approach) — a short banner and a long concatenated ticker
// need different speeds, but deriving that from a scrollWidth measurement
// added a real failure mode: if that measurement ever landed on a stuck or
// oversized value, the animation could end up effectively frozen. A plain
// number the caller picks is simple and impossible to get stuck.
function Marquee({ children, className, seconds = 20 }: { children: ReactNode; className?: string; seconds?: number }) {
  return (
    <div className={`overflow-hidden whitespace-nowrap ${className ?? ""}`}>
      <div className="inline-flex w-max shrink-0 animate-tv-marquee" style={{ animationDuration: `${seconds}s` }}>
        {/* shrink-0 on both copies: without it, a flex child can be
            compressed to fit an unexpectedly constrained parent, which is
            exactly what "one copy renders, the other doesn't visibly show
            up" looks like. */}
        <span className="inline-flex items-center shrink-0">{children}</span>
        <span className="inline-flex items-center shrink-0" aria-hidden="true">
          {children}
        </span>
      </div>
    </div>
  );
}

// A public, no-login display meant to run on a gym TV all day. Two
// independent data sources: live Playground matches (the main event,
// /api/tv/rooms) and a secondary achievement ticker (/api/tv/feed) —
// deliberately no attendance/check-ins in the ticker anymore, that's not
// interesting to broadcast next to an actual live match.
export default function TvFeed() {
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [clockNow, setClockNow] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/tv/rooms", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && Array.isArray(data?.rooms)) setRooms(data.rooms);
      } catch {
        // Transient network hiccup — the next poll just tries again.
      }
    }
    poll();
    const id = setInterval(poll, ROOMS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/tv/feed", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && Array.isArray(data?.items)) setItems(data.items);
      } catch {
        // Same — passive display, no error state needed.
      }
    }
    poll();
    const id = setInterval(poll, FEED_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      setClockNow(new Date());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const clock = clockNow.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <TopBanner text="Mark your attendance to join a room — Playground is live for anyone checked in" />

      <div className="flex-1 flex flex-col gap-6 px-10 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-container" />
            </span>
            <h1 className="font-display text-3xl uppercase tracking-wide">Fitness Future Gym — Playground Live</h1>
          </div>
          <span className="font-beast text-2xl tabular-nums text-white/60">{clock}</span>
        </div>

        {rooms.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <span className="material-symbols-outlined text-white/15 text-7xl leading-none">group</span>
            <p className="font-display text-3xl uppercase text-white/30">No matches right now</p>
            <p className="font-body text-lg text-white/20">Check in and start a Playground challenge from the app</p>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 content-start">
            {rooms.map((room) => (
              <MatchCard key={room.id} room={room} now={now} />
            ))}
          </div>
        )}
      </div>

      <div className="bg-white/5 border-t border-white/10 py-3">
        {items.length === 0 ? (
          <p className="font-body text-base text-white/25 px-8">Nothing to report yet today...</p>
        ) : (
          <Marquee seconds={Math.max(20, items.length * 5)}>
            {items.map((item) => (
              <span key={item.id} className="inline-flex items-center gap-2 font-body text-base text-white/70 px-8">
                <span className="material-symbols-outlined text-primary-container text-lg leading-none">emoji_events</span>
                {describeFeedItem(item)}
              </span>
            ))}
          </Marquee>
        )}
      </div>
    </div>
  );
}

// One live scoreboard — name, mode, a countdown ticking down in real time,
// and every member ranked with their score popping in on change (the same
// punch Beast Mode's target readout uses), the closest this can get on a
// static TV to an actual match broadcast.
function MatchCard({ room, now }: { room: LiveRoom; now: number }) {
  const ranked = [...room.members].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const endsAtMs = room.endsAt ? new Date(room.endsAt).getTime() : null;
  const remainingMs = endsAtMs != null ? Math.max(0, endsAtMs - now) : 0;
  const unit = room.mode === "xp_race" ? "XP" : "kg";

  return (
    <div className="bg-white/5 border border-primary-container/30 rounded-3xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-2xl uppercase tracking-wide truncate">{room.name}</p>
          <p className="font-label text-xs uppercase tracking-widest text-primary-container mt-0.5 truncate">
            {room.mode === "xp_race" ? "XP Race" : room.exerciseName}
          </p>
        </div>
        {endsAtMs != null && (
          <span className="font-beast text-2xl tabular-nums text-white/70 shrink-0">{formatCountdown(remainingMs)}</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {ranked.map((m, i) => (
          <div
            key={`${m.firstName}-${i}`}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 ${i === 0 ? "bg-primary-container/15" : "bg-white/5"}`}
          >
            <span className={`font-display text-xl w-6 shrink-0 ${i === 0 ? "text-primary-container" : "text-white/40"}`}>{i + 1}</span>
            <span className="flex-1 min-w-0 font-label text-base uppercase font-bold truncate">{m.firstName}</span>
            <span key={m.score ?? 0} className="animate-beast-target-in font-display text-2xl text-primary-container tabular-nums shrink-0">
              {m.score ?? 0} {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
