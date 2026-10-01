"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

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

// A gym TV has nobody there to scroll it — past a comfortable grid, extra
// live rooms would just fall off the bottom of the screen and never be
// seen. Cap one screen to 4 and auto-rotate through the rest instead.
const ROOMS_PER_PAGE = 4;
const PAGE_ROTATE_MS = 10000;

// The person currently in first — same "highest score wins" ranking
// MatchCard uses, pulled out so the lead-change detector below and the
// scoreboard agree on who's actually leading. Needs at least two people to
// call it a "lead" at all; a solo room has nobody to overtake.
function leaderOf(room: LiveRoom): string | null {
  if (room.members.length < 2) return null;
  const ranked = [...room.members].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return ranked[0]?.firstName ?? null;
}

// Real crowd reaction clips (public/sounds/, royalty-free from Mixkit) for
// TvFeed's lead-change alert — a synthesized beep read as a notification
// chime, not a crowd reacting to a lead change. Four distinct clips,
// picked at random each time, instead of one clip replayed identically on
// every lead change — a dozen alerts in a row all sounding exactly the
// same stops reading as "a crowd reacting" and starts reading as "a
// notification sound effect."
const CROWD_SOUNDS = ["/sounds/cheer.mp3", "/sounds/clap.mp3", "/sounds/applause.mp3", "/sounds/laugh-applause.mp3"];

// A fresh Audio() per call rather than one shared/reused element: a lead
// change can fire again before the previous clip finishes, and reusing one
// element would cut the first play off to restart it instead of letting
// both overlap like a real crowd would.
function playCrowdReaction() {
  const src = CROWD_SOUNDS[Math.floor(Math.random() * CROWD_SOUNDS.length)];
  const audio = new Audio(src);
  audio.volume = 0.85;
  audio.play().catch(() => {
    // Autoplay can be blocked until the TV display has had some page
    // interaction (e.g. whoever set the device up tapping it once) — the
    // visual banner still shows either way, this just silently skips the
    // sound rather than erroring.
  });
}

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
    <div className="relative overflow-hidden whitespace-nowrap bg-primary-container text-on-primary-container h-9 sm:h-12">
      <span className="animate-tv-banner-slide font-label text-xs sm:text-base uppercase font-bold tracking-wide inline-block">
        {text}
      </span>
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
  const [page, setPage] = useState(0);
  const [leadAlert, setLeadAlert] = useState<{ key: number; roomName: string; leaderName: string } | null>(null);
  // Who was leading each room as of the last poll, keyed by room id — a
  // ref, not state, since it's only ever read/written inside the poll
  // callback and should never itself trigger a re-render. This is what
  // makes a lead change visible even for a room sitting on a page that
  // isn't currently on screen (see ROOMS_PER_PAGE above): every room gets
  // compared here regardless of pagination, not just visibleRooms.
  const prevLeadersRef = useRef<Map<string, string>>(new Map());
  const alertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alertKeyRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/tv/rooms", { cache: "no-store" });
        const data = await res.json();
        if (cancelled || !Array.isArray(data?.rooms)) return;
        const freshRooms: LiveRoom[] = data.rooms;
        setRooms(freshRooms);

        const prevLeaders = prevLeadersRef.current;
        const nextLeaders = new Map<string, string>();
        for (const room of freshRooms) {
          const leader = leaderOf(room);
          if (leader) nextLeaders.set(room.id, leader);
          // Only alert when this room already had a known leader that's
          // now different — a brand-new room (not yet in prevLeaders) just
          // seeds its first leader silently, no false "lead change" the
          // moment a match starts.
          const previousLeader = prevLeaders.get(room.id);
          if (leader && previousLeader && previousLeader !== leader) {
            playCrowdReaction();
            alertKeyRef.current += 1;
            setLeadAlert({ key: alertKeyRef.current, roomName: room.name, leaderName: leader });
            if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
            alertTimeoutRef.current = setTimeout(() => setLeadAlert(null), 5500);
          }
        }
        prevLeadersRef.current = nextLeaders;
      } catch {
        // Transient network hiccup — the next poll just tries again.
      }
    }
    poll();
    const id = setInterval(poll, ROOMS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
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

  useEffect(() => {
    if (rooms.length <= ROOMS_PER_PAGE) return;
    const id = setInterval(() => setPage((p) => p + 1), PAGE_ROTATE_MS);
    return () => clearInterval(id);
  }, [rooms.length]);

  const totalPages = Math.max(1, Math.ceil(rooms.length / ROOMS_PER_PAGE));
  const safePage = page % totalPages;
  const visibleRooms = rooms.slice(safePage * ROOMS_PER_PAGE, safePage * ROOMS_PER_PAGE + ROOMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <TopBanner text="Mark your attendance to join a room — Playground is live for anyone checked in" />

      {/* A breaking-news-style sting for a lead change in ANY live room —
          including one sitting on a page that isn't currently on screen
          (see the rooms-poll effect above), so a close race elsewhere in
          the gym still gets called out here instead of only being visible
          once its page happens to rotate into view. */}
      {leadAlert && (
        <div key={leadAlert.key} className="fixed top-14 sm:top-20 left-1/2 -translate-x-1/2 z-50 animate-tv-lead-alert px-4">
          <div className="flex items-center gap-3 bg-primary-container text-on-primary-container px-5 py-3 rounded-2xl shadow-[0_8px_30px_rgba(255,90,31,0.5)] border border-black/20">
            <span className="material-symbols-outlined text-xl sm:text-2xl leading-none shrink-0">bolt</span>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-label text-[9px] sm:text-[10px] uppercase tracking-widest opacity-80">Lead Change</span>
              <span className="font-display text-sm sm:text-lg uppercase tracking-wide truncate">
                {leadAlert.leaderName} takes the lead in {leadAlert.roomName}!
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-4 sm:gap-6 px-4 sm:px-6 lg:px-10 py-4 sm:py-6">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-primary-container" />
              </span>
              <h1 className="font-display text-lg sm:text-2xl lg:text-3xl uppercase tracking-wide truncate">
                Fitness Future Gym — Playground Live
              </h1>
            </div>
            <span className="font-beast text-lg sm:text-2xl tabular-nums text-white/60 shrink-0">{clock}</span>
          </div>
          {rooms.length > 0 && (
            <span className="font-label text-xs sm:text-sm uppercase tracking-wider text-white/40">
              {rooms.length} live match{rooms.length > 1 ? "es" : ""}
            </span>
          )}
        </div>

        {rooms.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <span className="material-symbols-outlined text-white/15 text-5xl sm:text-7xl leading-none">group</span>
            <p className="font-display text-xl sm:text-3xl uppercase text-white/30">No matches right now</p>
            <p className="font-body text-sm sm:text-lg text-white/20 px-4">
              Check in and start a Playground challenge from the app
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5 content-start">
              {visibleRooms.map((room) => (
                <MatchCard key={room.id} room={room} now={now} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === safePage ? "w-6 bg-primary-container" : "w-1.5 bg-white/20"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="bg-white/5 border-t border-white/10 py-2 sm:py-3">
        {items.length === 0 ? (
          <p className="font-body text-sm sm:text-base text-white/25 px-4 sm:px-8">Nothing to report yet today...</p>
        ) : (
          <Marquee seconds={Math.max(20, items.length * 5)}>
            {items.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-2 font-body text-sm sm:text-base text-white/70 px-4 sm:px-8"
              >
                <span className="material-symbols-outlined text-primary-container text-base sm:text-lg leading-none">
                  emoji_events
                </span>
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
    <div className="bg-white/5 border border-primary-container/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col gap-3 sm:gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg sm:text-2xl uppercase tracking-wide truncate">{room.name}</p>
          <p className="font-label text-[10px] sm:text-xs uppercase tracking-widest text-primary-container mt-0.5 truncate">
            {room.mode === "xp_race" ? "XP Race" : room.exerciseName}
          </p>
        </div>
        {endsAtMs != null && (
          <span className="font-beast text-lg sm:text-2xl tabular-nums text-white/70 shrink-0">{formatCountdown(remainingMs)}</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 sm:gap-2">
        {ranked.map((m, i) => (
          <div
            key={`${m.firstName}-${i}`}
            className={`flex items-center gap-2 sm:gap-3 rounded-xl px-3 py-2 sm:px-4 sm:py-3 ${i === 0 ? "bg-primary-container/15" : "bg-white/5"}`}
          >
            <span className={`font-display text-base sm:text-xl w-5 sm:w-6 shrink-0 ${i === 0 ? "text-primary-container" : "text-white/40"}`}>
              {i + 1}
            </span>
            <span className="flex-1 min-w-0 font-label text-sm sm:text-base uppercase font-bold truncate">{m.firstName}</span>
            <span
              key={m.score ?? 0}
              className="animate-beast-target-in font-display text-lg sm:text-2xl text-primary-container tabular-nums shrink-0"
            >
              {m.score ?? 0} {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
