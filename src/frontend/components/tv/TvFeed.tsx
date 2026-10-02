"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import TvLoader from "@/frontend/components/tv/TvLoader";

const SPLASH_MS = 3000;

// hotUntil is computed client-side in the rooms-poll effect (not sent by
// the API) and stored directly on room state — render reads it as plain
// state, never a ref (`react-hooks/refs` forbids reading ref.current
// during render; this is what that rule is steering toward instead).
type LiveRoomMember = { firstName: string; score: number | null; hotUntil?: number };
type LiveRoom = {
  id: string;
  name: string;
  mode: "common_exercise" | "xp_race";
  exerciseName: string | null;
  startedAt: string | null;
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

// How long a member's score flashes a "momentum" flame after the exact
// poll that caught their score increasing — not tied to the poll interval
// itself (ROOMS_POLL_MS), a fixed wall-clock window so the flame reads
// consistently regardless of how often polling happens to land near it.
const HOT_STREAK_MS = 4500;

// The person currently in first — same "highest score wins" ranking every
// card uses, pulled out so the lead-change detector below and every
// scoreboard agree on who's actually leading. Needs at least two people to
// call it a "lead" at all; a solo room has nobody to overtake.
function leaderOf(room: LiveRoom): string | null {
  if (room.members.length < 2) return null;
  const ranked = [...room.members].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return ranked[0]?.firstName ?? null;
}

// Gap between 1st and 2nd place — works for a room of any size, not just a
// 2-person one, so a close 3-or-more-way race is just as eligible to be
// the Spotlight match as a 1v1 is.
function topGap(room: LiveRoom): number {
  const scores = room.members.map((m) => m.score ?? 0).sort((a, b) => b - a);
  return scores.length >= 2 ? scores[0] - scores[1] : Infinity;
}

// Real crowd reaction clips (public/sounds/, royalty-free from Mixkit) for
// a lead change or a match win — a synthesized beep would read as a
// notification chime, not a crowd reacting. Four distinct clips, picked at
// random each time, instead of one clip replayed identically every time —
// a dozen alerts in a row all sounding exactly the same stops reading as
// "a crowd reacting" and starts reading as "a notification sound effect."
const CROWD_SOUNDS = ["/sounds/cheer.mp3", "/sounds/clap.mp3", "/sounds/applause.mp3", "/sounds/laugh-applause.mp3"];

// A fresh Audio() per call rather than one shared/reused element: two
// alerts can fire close together, and reusing one element would cut the
// first play off to restart it instead of letting both overlap like a
// real crowd would.
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

function unitFor(mode: LiveRoom["mode"]): string {
  return mode === "xp_race" ? "XP" : "kg";
}

function modeIcon(mode: LiveRoom["mode"]): string {
  return mode === "xp_race" ? "bolt" : "fitness_center";
}

function modeLabel(room: LiveRoom): string {
  return room.mode === "xp_race" ? "XP Race" : (room.exerciseName ?? "Challenge");
}

// xp_race and common_exercise get distinct but same-family accent colors
// (both already part of this app's orange palette, see globals.css) — a
// genuinely different hue (blue, green) would clash with the rest of the
// black-and-orange brand identity the whole gym app uses.
function modeColorClass(mode: LiveRoom["mode"]): string {
  return mode === "xp_race"
    ? "text-primary-container border-primary-container/40 bg-primary-container/10"
    : "text-secondary border-secondary/40 bg-secondary/10";
}

// Counts up/down from wherever it's CURRENTLY displayed (not from the prop
// value an effect closed over) to the new value over 500ms — so a score
// that changes again before the previous tween finishes smoothly redirects
// instead of jumping. This is what makes the scoreboard feel like it's
// actually ticking over, the same way a real broadcast's score graphics
// animate, rather than snapping to each new number.
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    const from = displayRef.current;
    const to = value;
    if (from === to) return;
    const duration = 500;
    const startedAt = performance.now();

    function tick(t: number) {
      const progress = Math.min(1, (t - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + (to - from) * eased);
      displayRef.current = next;
      setDisplay(next);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return <span className={className}>{display}</span>;
}

// The small flame badge next to whoever just scored — a lightweight
// "momentum" indicator real sports broadcasts use (a hot-hand marker),
// reusing Tailwind's built-in pulse rather than a new keyframe.
function HotBadge() {
  return (
    <span className="material-symbols-outlined text-[13px] sm:text-base leading-none text-secondary animate-pulse" aria-hidden="true">
      local_fire_department
    </span>
  );
}

function PlayerSlot({
  name,
  score,
  unit,
  isLeader,
  hot,
  trailingBy,
  featured,
  align = "left",
}: {
  name: string;
  score: number;
  unit: string;
  isLeader: boolean;
  hot: boolean;
  trailingBy: number | null;
  featured: boolean;
  align?: "left" | "right";
}) {
  const alignCls = align === "right" ? "items-end text-right" : "items-start text-left";
  return (
    <div className={`flex-1 min-w-0 flex flex-col gap-0.5 ${alignCls}`}>
      <div className={`flex items-center gap-1 sm:gap-1.5 ${align === "right" ? "flex-row-reverse" : ""}`}>
        {isLeader && (
          <span className="material-symbols-outlined text-primary-container text-sm sm:text-lg leading-none shrink-0">
            workspace_premium
          </span>
        )}
        <span
          className={`font-label uppercase font-bold truncate ${featured ? "text-sm sm:text-xl" : "text-xs sm:text-base"} ${
            isLeader ? "text-white" : "text-white/55"
          }`}
        >
          {name}
        </span>
        {hot && <HotBadge />}
      </div>
      <div className="flex items-baseline gap-1">
        <AnimatedNumber
          value={score}
          className={`font-beast tabular-nums ${featured ? "text-xl sm:text-4xl" : "text-lg sm:text-2xl"} ${
            isLeader ? "text-primary-container" : "text-white/45"
          }`}
        />
        <span className="font-label text-[9px] sm:text-xs text-white/35">{unit}</span>
      </div>
      {trailingBy != null && trailingBy > 0 && (
        <span className="font-label text-[9px] sm:text-[10px] uppercase tracking-wide text-white/30">
          trails by {trailingBy} {unit}
        </span>
      )}
    </div>
  );
}

// The head-to-head layout for a 2-person room — two score slots either
// side of a "VS" divider, plus a tug-of-war bar beneath showing each
// side's share of the combined score. This is the shape a real 1v1 match
// graphic takes; a plain ranked list (still used for 3+ person rooms
// below) doesn't convey "these two are racing each other" nearly as well.
function HeadToHead({ room, now, featured }: { room: LiveRoom; now: number; featured: boolean }) {
  const [a, b] = room.members;
  const scoreA = a.score ?? 0;
  const scoreB = b.score ?? 0;
  const total = scoreA + scoreB;
  // A true tie (0-0 at the very start, or any genuine dead heat) renders
  // as one flat neutral bar, not a 50/50 orange-vs-grey split — splitting
  // it still reads as "the left side is ahead" to the eye even at an
  // exact half, which is exactly backwards when nobody actually has a
  // lead yet.
  const isTied = scoreA === scoreB;
  const pctA = total > 0 ? (scoreA / total) * 100 : 50;
  const unit = unitFor(room.mode);

  function isHot(m: LiveRoomMember): boolean {
    return m.hotUntil != null && now < m.hotUntil;
  }

  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      <div className="flex items-stretch gap-2 sm:gap-4">
        <PlayerSlot
          name={a.firstName}
          score={scoreA}
          unit={unit}
          isLeader={scoreA > scoreB}
          hot={isHot(a)}
          trailingBy={scoreB > scoreA ? scoreB - scoreA : null}
          featured={featured}
        />
        <div className="flex flex-col items-center justify-center shrink-0">
          <span className={`font-display text-white/20 ${featured ? "text-base sm:text-xl" : "text-xs sm:text-sm"}`}>VS</span>
        </div>
        <PlayerSlot
          name={b.firstName}
          score={scoreB}
          unit={unit}
          isLeader={scoreB > scoreA}
          hot={isHot(b)}
          trailingBy={scoreA > scoreB ? scoreA - scoreB : null}
          featured={featured}
          align="right"
        />
      </div>
      <div className="h-1.5 sm:h-2 rounded-full bg-white/10 overflow-hidden flex">
        {isTied ? (
          <div className="h-full w-full bg-white/15" />
        ) : (
          <>
            <div className="h-full bg-primary-container transition-all duration-700 ease-out" style={{ width: `${pctA}%` }} />
            <div className="h-full bg-white/20 transition-all duration-700 ease-out" style={{ width: `${100 - pctA}%` }} />
          </>
        )}
      </div>
    </div>
  );
}

// Fallback for a 3+ person room — a ranked list, same shape the page used
// before, upgraded with ticking numbers, a crown on #1, and a muted
// gold/silver/bronze tint through the top 3 (the same convention a real
// leaderboard uses) instead of only highlighting #1.
const RANK_TINT = ["text-primary-container", "text-white/50", "text-secondary/70"];

function RankedList({ room, now }: { room: LiveRoom; now: number }) {
  const ranked = [...room.members].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const unit = unitFor(room.mode);

  return (
    <div className="flex flex-col gap-1.5 sm:gap-2">
      {ranked.map((m, i) => {
        const hot = m.hotUntil != null && now < m.hotUntil;
        return (
          <div
            key={`${m.firstName}-${i}`}
            className={`flex items-center gap-2 sm:gap-3 rounded-xl px-3 py-2 sm:px-4 sm:py-3 ${
              i === 0 ? "bg-primary-container/15 border border-primary-container/30" : "bg-white/5"
            }`}
          >
            {i === 0 ? (
              <span className="material-symbols-outlined text-primary-container text-base sm:text-xl w-5 sm:w-6 shrink-0 leading-none">
                workspace_premium
              </span>
            ) : (
              <span className={`font-display text-base sm:text-xl w-5 sm:w-6 shrink-0 ${RANK_TINT[i] ?? "text-white/30"}`}>{i + 1}</span>
            )}
            <span className="flex-1 min-w-0 font-label text-sm sm:text-base uppercase font-bold truncate flex items-center gap-1.5">
              {m.firstName}
              {hot && <HotBadge />}
            </span>
            <span className="flex items-baseline gap-1 shrink-0">
              <AnimatedNumber value={m.score ?? 0} className="font-beast text-lg sm:text-2xl text-primary-container tabular-nums" />
              <span className="font-label text-[10px] text-white/40">{unit}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// One live scoreboard card — mode badge, a per-card live dot (reinforcing
// "this one's live too" across a grid of several simultaneous matches), a
// game-clock countdown pill, the head-to-head/ranked scoreboard body, and
// a time-elapsed bar along the bottom (a visual countdown to complement
// the digital one above it).
function MatchCard({ room, now, featured = false }: { room: LiveRoom; now: number; featured?: boolean }) {
  const endsAtMs = room.endsAt ? new Date(room.endsAt).getTime() : null;
  const startedAtMs = room.startedAt ? new Date(room.startedAt).getTime() : null;
  const remainingMs = endsAtMs != null ? Math.max(0, endsAtMs - now) : 0;
  const elapsedPct =
    startedAtMs != null && endsAtMs != null && endsAtMs > startedAtMs
      ? Math.min(100, Math.max(0, ((now - startedAtMs) / (endsAtMs - startedAtMs)) * 100))
      : null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl flex flex-col gap-2.5 sm:gap-3 border ${
        featured
          ? "p-4 sm:p-6 bg-gradient-to-br from-primary-container/10 via-white/5 to-transparent border-primary-container/40 animate-ai-avatar-glow"
          : "p-4 sm:p-6 bg-white/5 border-white/10"
      }`}
    >
      {featured && (
        <span className="absolute top-3 right-4 sm:top-5 sm:right-6 font-label text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-primary-container flex items-center gap-1">
          <span className="material-symbols-outlined text-xs sm:text-sm leading-none">star</span>
          Spotlight
        </span>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-primary-container" />
          </span>
          <div className="min-w-0">
            <p
              className={`font-display uppercase tracking-wide truncate leading-none ${
                featured ? "text-lg sm:text-2xl" : "text-base sm:text-xl"
              }`}
            >
              {room.name}
            </p>
            <span
              className={`inline-flex items-center gap-1 mt-1 font-label text-[9px] sm:text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded border ${modeColorClass(room.mode)}`}
            >
              <span className="material-symbols-outlined text-[10px] sm:text-xs leading-none">{modeIcon(room.mode)}</span>
              {modeLabel(room)}
            </span>
          </div>
        </div>
        {endsAtMs != null && (
          <span className="shrink-0 font-beast tabular-nums bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-sm sm:text-lg text-white/80">
            {formatCountdown(remainingMs)}
          </span>
        )}
      </div>

      {room.members.length === 2 ? (
        <HeadToHead room={room} now={now} featured={featured} />
      ) : (
        <RankedList room={room} now={now} />
      )}

      {elapsedPct != null && (
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-white/30 transition-all duration-1000 ease-linear" style={{ width: `${elapsedPct}%` }} />
        </div>
      )}
    </div>
  );
}

// The top CTA banner — one copy of the text, sliding from fully off the
// right edge to fully off the left (see the tv-banner-slide keyframe,
// globals.css, for why this handles short text on a wide banner correctly
// where the duplicate-content marquee trick didn't visibly move). Explicit
// height since the sliding text is absolutely positioned and would
// otherwise collapse its own container.
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
// — a short banner and a long concatenated ticker need different speeds,
// but deriving that from a scrollWidth measurement added a real failure
// mode: if that measurement ever landed on a stuck or oversized value, the
// animation could end up effectively frozen. A plain number the caller
// picks is simple and impossible to get stuck.
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

type Alert = { key: number; kind: "lead" | "win"; title: string; message: string };

// Shared banner for both a lead change (orange, mid-match) and a match
// win (gold, final) — one component instead of two near-duplicate popups,
// themed by `kind`. Anchored to `top-full` of its `relative` parent (see
// where this is rendered below) rather than a fixed pixel guess from the
// viewport top — that hardcoded offset was the actual bug: on a wide
// screen the header's title can run long enough that a fixed top-14/top-20
// guess lands ON the title instead of below it. Anchoring to the header's
// own rendered bottom edge means it can never overlap the header, no
// matter how the title wraps or how wide the screen is.
function AlertBanner({ alert }: { alert: Alert }) {
  const theme =
    alert.kind === "win"
      ? { bg: "bg-gradient-to-r from-secondary-container to-primary-container", icon: "emoji_events", label: "Match Won" }
      : { bg: "bg-primary-container", icon: "bolt", label: "Lead Change" };
  return (
    <div
      key={alert.key}
      className="absolute top-full left-1/2 mt-3 z-50 animate-tv-lead-alert px-4 pointer-events-none"
      style={{ transform: "translateX(-50%)" }}
    >
      <div
        className={`flex items-center gap-3 ${theme.bg} text-on-primary-container px-5 py-3 rounded-2xl shadow-[0_8px_30px_rgba(255,90,31,0.45)] border border-black/20`}
      >
        <span className="material-symbols-outlined text-xl sm:text-2xl leading-none shrink-0">{theme.icon}</span>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="font-label text-[9px] sm:text-[10px] uppercase tracking-widest opacity-80">{theme.label}</span>
          <span className="font-display text-sm sm:text-lg uppercase tracking-wide truncate">{alert.title}</span>
          {alert.message && <span className="font-body text-[10px] sm:text-xs opacity-80 truncate">{alert.message}</span>}
        </div>
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
  // A fixed 3s brand splash whenever this page is opened — not tied to
  // the rooms/feed fetches finishing (those run in parallel underneath
  // it regardless), since the point is a deliberate opening moment for a
  // display meant to be glanced at across a gym, not a "data is loading"
  // spinner that'd otherwise flash by almost instantly on a fast network.
  const [showSplash, setShowSplash] = useState(true);
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [clockNow, setClockNow] = useState(() => new Date());
  const [page, setPage] = useState(0);
  const [alert, setAlert] = useState<Alert | null>(null);

  // Refs, not state — all three are only ever read/written inside poll
  // callbacks and should never themselves trigger a re-render.
  // prevLeadersRef/prevScoresRef key by room id / `${roomId}:${firstName}`
  // respectively, so every room is compared regardless of which page is
  // currently on screen (see ROOMS_PER_PAGE below) — a lead change or
  // score bump in a room sitting on a page that isn't visible right now
  // still gets caught here.
  const prevLeadersRef = useRef<Map<string, string>>(new Map());
  const prevScoresRef = useRef<Map<string, number>>(new Map());
  // Persists across polls (unlike a per-poll local) so an already-hot
  // member keeps their flame on the next poll too, not just the one poll
  // where the bump happened — read fresh each poll and attached directly
  // onto room state below (see the comment on LiveRoomMember's hotUntil).
  const hotUntilRef = useRef<Map<string, number>>(new Map());
  const prevFeedIdsRef = useRef<Set<string> | null>(null);
  const alertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alertKeyRef = useRef(0);

  function fireAlert(next: Omit<Alert, "key">) {
    alertKeyRef.current += 1;
    setAlert({ ...next, key: alertKeyRef.current });
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    alertTimeoutRef.current = setTimeout(() => setAlert(null), 5500);
  }

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/tv/rooms", { cache: "no-store" });
        const data = await res.json();
        if (cancelled || !Array.isArray(data?.rooms)) return;
        const rawRooms: LiveRoom[] = data.rooms;

        const prevScores = prevScoresRef.current;
        const nextScores = new Map<string, number>();
        const bumpedAt = Date.now();

        // Attaches hotUntil to each member HERE, inside the effect, rather
        // than reading a ref during render — render only ever sees plain
        // state afterward.
        const enrichedRooms: LiveRoom[] = rawRooms.map((room) => ({
          ...room,
          members: room.members.map((m) => {
            const key = `${room.id}:${m.firstName}`;
            const score = m.score ?? 0;
            nextScores.set(key, score);
            const prevScore = prevScores.get(key);
            if (prevScore != null && score > prevScore) hotUntilRef.current.set(key, bumpedAt + HOT_STREAK_MS);
            return { ...m, hotUntil: hotUntilRef.current.get(key) };
          }),
        }));
        setRooms(enrichedRooms);

        const prevLeaders = prevLeadersRef.current;
        const nextLeaders = new Map<string, string>();
        for (const room of enrichedRooms) {
          const leader = leaderOf(room);
          if (leader) nextLeaders.set(room.id, leader);
          // Only alert when this room already had a known leader that's
          // now different — a brand-new room (not yet in prevLeaders) just
          // seeds its first leader silently, no false "lead change" the
          // moment a match starts.
          const previousLeader = prevLeaders.get(room.id);
          if (leader && previousLeader && previousLeader !== leader) {
            playCrowdReaction();
            fireAlert({ kind: "lead", title: `${leader} takes the lead in ${room.name}!`, message: "" });
          }
        }
        prevLeadersRef.current = nextLeaders;
        prevScoresRef.current = nextScores;
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
        if (cancelled || !Array.isArray(data?.items)) return;
        const freshItems: FeedItem[] = data.items;
        setItems(freshItems);

        // Skip the very first poll — every item on it is "new" relative to
        // an empty starting set, which would fire a win celebration for
        // matches that actually ended before this page was even opened.
        if (prevFeedIdsRef.current) {
          const prevIds = prevFeedIdsRef.current;
          const firstNew = freshItems.find((item) => !prevIds.has(item.id));
          if (firstNew) {
            playCrowdReaction();
            fireAlert({
              kind: "win",
              title: `${firstNew.firstName} wins!`,
              message:
                firstNew.playgroundMode === "xp_race" ? "XP Race Champion" : `${firstNew.exerciseName} Challenge Winner`,
            });
          }
        }
        prevFeedIdsRef.current = new Set(freshItems.map((item) => item.id));
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

  const clock = clockNow.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateLabel = clockNow.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  useEffect(() => {
    const id = setTimeout(() => setShowSplash(false), SPLASH_MS);
    return () => clearTimeout(id);
  }, []);

  // The single most compelling match right now — closest race (by any
  // room size, not just a 1v1 — see topGap), tie-broken toward whichever
  // has more total activity (more meaningful than everyone still sitting
  // at 0) — featured bigger, above the regular grid, the same "top story"
  // treatment a sports app gives its marquee game. Only kicks in once
  // there are at least 2 live matches; with just one match running, the
  // whole page IS already the spotlight.
  const spotlightRoom = useMemo(() => {
    if (rooms.length < 2) return null;
    const eligible = rooms.filter((r) => r.members.length >= 2);
    if (eligible.length === 0) return null;
    return [...eligible].sort((a, b) => {
      const gapA = topGap(a);
      const gapB = topGap(b);
      if (gapA !== gapB) return gapA - gapB;
      const totalA = a.members.reduce((sum, m) => sum + (m.score ?? 0), 0);
      const totalB = b.members.reduce((sum, m) => sum + (m.score ?? 0), 0);
      return totalB - totalA;
    })[0];
  }, [rooms]);

  // Excludes the spotlight room from the regular grid — it's already
  // shown big, up top; repeating it small right below would just read as
  // a duplicate rather than a "top story + full schedule" split.
  const gridRooms = useMemo(
    () => (spotlightRoom ? rooms.filter((r) => r.id !== spotlightRoom.id) : rooms),
    [rooms, spotlightRoom]
  );

  // Fewer regular-grid slots per page when the Spotlight card is also on
  // screen — a TV has a fixed, finite height and nobody to scroll it (see
  // the root container's overflow-hidden below), so adding a big featured
  // card on top of a still-full 4-up grid would just push the bottom row
  // off-screen instead of actually fitting. Swapping 2 of those 4 slots
  // for the 1 bigger Spotlight card keeps the page's total height roughly
  // where it was without one.
  const roomsPerPage = spotlightRoom ? ROOMS_PER_PAGE - 2 : ROOMS_PER_PAGE;

  useEffect(() => {
    if (gridRooms.length <= roomsPerPage) return;
    const id = setInterval(() => setPage((p) => p + 1), PAGE_ROTATE_MS);
    return () => clearInterval(id);
  }, [gridRooms.length, roomsPerPage]);

  const totalPages = Math.max(1, Math.ceil(gridRooms.length / roomsPerPage));
  const safePage = page % totalPages;
  const visibleRooms = gridRooms.slice(safePage * roomsPerPage, safePage * roomsPerPage + roomsPerPage);

  return (
    // h-screen + overflow-hidden, not min-h-screen — nobody is standing at
    // a gym TV to scroll it, so content has to actually FIT one screen
    // rather than silently growing past it and relying on a scrollbar
    // nobody will ever use.
    <div className="h-screen overflow-hidden bg-black text-white flex flex-col">
      {/* A plain opaque overlay, not a conditional unmount of everything
          below — the rooms/feed fetches underneath keep running the whole
          3s so real content is already in place the instant this lifts,
          instead of the splash finishing into a second, separate loading
          state. */}
      {showSplash && (
        <div className="fixed inset-0 z-60 bg-black flex flex-col items-center justify-center gap-6" aria-hidden="true">
          <TvLoader size={96} />
          <p className="font-display text-2xl uppercase tracking-widest text-white/80">Fitness Future Gym</p>
        </div>
      )}

      <TopBanner text="Mark your attendance to join a room — Playground is live for anyone checked in" />

      {/* relative wrapper is what fixes the overlap: the alert is anchored
          to THIS element's actual bottom edge (top-full), not a hardcoded
          viewport offset, so it can never land on top of the header no
          matter how the title wraps. */}
      <div className="relative z-10 border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 sm:px-6 lg:px-10 py-3 sm:py-5">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-primary-container" />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-lg sm:text-2xl lg:text-3xl uppercase tracking-wide leading-none truncate">
                Fitness Future Gym
              </h1>
              <p className="font-label text-[9px] sm:text-xs uppercase tracking-[0.3em] text-primary-container mt-1">
                Playground Live
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-5 shrink-0">
            {rooms.length > 0 && (
              <span className="flex items-center gap-1.5 font-label text-[10px] sm:text-xs uppercase tracking-wider text-white/60 bg-white/5 border border-white/10 rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5">
                <span className="material-symbols-outlined text-xs sm:text-sm leading-none text-primary-container">sports_score</span>
                {rooms.length} Live Match{rooms.length > 1 ? "es" : ""}
              </span>
            )}
            <div className="text-right leading-none">
              <span className="font-beast text-base sm:text-2xl tabular-nums text-white/80 block">{clock}</span>
              <span className="font-label text-[9px] sm:text-[10px] uppercase tracking-wider text-white/35">{dateLabel}</span>
            </div>
          </div>
        </div>

        {alert && <AlertBanner alert={alert} />}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-3 sm:gap-4 px-4 sm:px-6 lg:px-10 py-3 sm:py-5">
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
            {spotlightRoom && <MatchCard room={spotlightRoom} now={now} featured />}

            {visibleRooms.length > 0 && (
              <div key={safePage} className="animate-tv-page-in flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5 content-start">
                {visibleRooms.map((room) => (
                  <MatchCard key={room.id} room={room} now={now} />
                ))}
              </div>
            )}
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

      {/* A real news-ticker look — a solid "BREAKING" tag anchored left,
          the scrolling content to its right — instead of the plain
          unlabeled scrolling row this used to be. */}
      <div className="flex items-stretch border-t border-white/10 bg-white/5">
        <span className="shrink-0 flex items-center gap-1.5 bg-primary-container text-on-primary-container font-label text-[10px] sm:text-sm uppercase font-bold tracking-wider px-3 sm:px-5 py-2 sm:py-3">
          <span className="material-symbols-outlined text-sm sm:text-lg leading-none">emoji_events</span>
          Wins
        </span>
        <div className="flex-1 min-w-0 py-2 sm:py-3">
          {items.length === 0 ? (
            <p className="font-body text-sm sm:text-base text-white/25 px-4 sm:px-6">Nothing to report yet today...</p>
          ) : (
            <Marquee seconds={Math.max(20, items.length * 5)}>
              {items.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-2 font-body text-sm sm:text-base text-white/70 px-4 sm:px-8"
                >
                  <span className="w-1 h-1 rounded-full bg-white/20" aria-hidden="true" />
                  {describeFeedItem(item)}
                </span>
              ))}
            </Marquee>
          )}
        </div>
      </div>
    </div>
  );
}
