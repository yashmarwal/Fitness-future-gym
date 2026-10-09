"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import ExerciseSearchField from "@/frontend/components/dashboard/ExerciseSearchField";
import { NumberStepper, WeightStepper } from "@/frontend/components/dashboard/WorkoutLogForm";
import BrandLoader from "@/frontend/components/dashboard/BrandLoader";
import { fetchCardFile, shareOrDownloadCard } from "@/frontend/lib/shareCard";
import type { RoomSummary, RoomDetail, PlaygroundMode } from "@/backend/services/playground";

type SearchResult = { id: string; firstName: string; membershipNumber: string };

const DURATIONS = [15, 30, 45, 60];
const RING_R = 54;
const RING_C = 2 * Math.PI * RING_R;

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PlaygroundHub({
  initialRooms,
  myMemberId,
}: {
  initialRooms: RoomSummary[];
  myMemberId: string;
}) {
  const router = useRouter();
  const [rooms, setRooms] = useState(initialRooms);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [invitees, setInvitees] = useState<SearchResult[]>([]);
  const [roomName, setRoomName] = useState("");
  const [mode, setMode] = useState<PlaygroundMode>("xp_race");
  const [exerciseName, setExerciseName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function refreshRooms() {
    const res = await fetch("/api/dashboard/playground/rooms");
    const data = await res.json().catch(() => null);
    if (Array.isArray(data?.rooms)) setRooms(data.rooms);
  }

  useEffect(() => {
    if (query.trim().length < 2) return;
    let cancelled = false;
    const id = setTimeout(async () => {
      const res = await fetch(`/api/dashboard/playground/search?q=${encodeURIComponent(`FF-${query.trim()}`)}`);
      const data = await res.json().catch(() => null);
      if (!cancelled && Array.isArray(data?.results)) setResults(data.results);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [query]);
  // Only shown once the query is long enough to have actually searched —
  // avoids a synchronous setState([]) in the effect above just to clear it.
  const shownResults = query.trim().length >= 2 ? results : [];

  function addInvitee(result: SearchResult) {
    if (invitees.some((i) => i.id === result.id)) return;
    setInvitees((prev) => [...prev, result]);
    setQuery("");
    setResults([]);
  }

  function removeInvitee(id: string) {
    setInvitees((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleCreateRoom() {
    if (!roomName.trim()) {
      setCreateError("Give your room a name.");
      return;
    }
    if (invitees.length === 0) {
      setCreateError("Invite at least one member.");
      return;
    }
    if (mode === "common_exercise" && !exerciseName.trim()) {
      setCreateError("Pick an exercise.");
      return;
    }
    setCreateError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/dashboard/playground/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: roomName.trim(),
          mode,
          exerciseName: mode === "common_exercise" ? exerciseName : undefined,
          durationMinutes,
          inviteeIds: invitees.map((i) => i.id),
        }),
      });
      const data = await res.json().catch(() => null);
      if (data?.status !== "ok") {
        setCreateError(data?.message ?? "Couldn't create the challenge.");
        return;
      }
      setInvitees([]);
      setRoomName("");
      setExerciseName("");
      await refreshRooms();
      setActiveRoomId(data.roomId);
    } finally {
      setCreating(false);
    }
  }

  async function handleRespond(roomId: string, accept: boolean) {
    await fetch(`/api/dashboard/playground/rooms/${roomId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accept }),
    });
    await refreshRooms();
    if (accept) setActiveRoomId(roomId);
  }

  if (activeRoomId) {
    return (
      <RoomView
        roomId={activeRoomId}
        myMemberId={myMemberId}
        onExit={() => {
          setActiveRoomId(null);
          refreshRooms();
          router.refresh();
        }}
      />
    );
  }

  const pendingInvites = rooms.filter((r) => r.myStatus === "invited");
  const otherRooms = rooms.filter((r) => r.myStatus !== "invited");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 px-1">
        <span className="material-symbols-outlined text-primary-container text-base leading-none">bolt</span>
        <p className="font-body text-xs text-tertiary">You&apos;re discoverable and challengeable by any checked-in member right now.</p>
      </div>

      <div className="relative overflow-hidden card-corner-glow card-glow-border bg-surface-container-low p-4 rounded-2xl shadow-soft border flex flex-col gap-3">
        <span className="flex items-center gap-2 font-label text-xs uppercase tracking-widest text-primary-container">
          <span className="w-1 h-4 rounded-full bg-primary-container shrink-0" aria-hidden="true" />
          New Challenge
        </span>

        <div className="flex flex-col gap-1">
          <label className="font-label text-[9px] uppercase tracking-wider text-outline">Room Name</label>
          <input
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="e.g. Friday Night Showdown"
            maxLength={40}
            required
            className="w-full rounded-xl bg-surface-container border border-primary-container/40 text-on-surface font-body px-3 py-2.5 outline-none focus:border-primary-container"
          />
        </div>

        <div className="relative flex flex-col gap-1">
          <label className="font-label text-[9px] uppercase tracking-wider text-outline">Find a member (gym ID)</label>
          <div className="flex items-stretch rounded-xl overflow-hidden border border-surface-variant focus-within:border-primary-container">
            <span className="flex items-center pl-3 pr-1 bg-surface-container font-body font-bold text-on-surface/60 select-none">FF-</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="1002"
              inputMode="numeric"
              className="flex-1 min-w-0 bg-surface-container text-on-surface font-body py-2.5 pr-3 outline-none"
            />
          </div>
          {shownResults.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 z-10 bg-surface-container-low border border-primary-container/40 rounded-xl overflow-hidden shadow-soft">
              {shownResults.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => addInvitee(r)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface-container text-left"
                >
                  <span className="font-body text-sm text-on-surface">{r.firstName}</span>
                  <span className="font-label text-[10px] text-tertiary uppercase">{r.membershipNumber}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {invitees.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {invitees.map((i) => (
              <span
                key={i.id}
                className="flex items-center gap-1.5 bg-primary-container/15 text-primary-container font-label text-xs font-bold px-3 py-1.5 rounded-full"
              >
                {i.firstName}
                <button type="button" onClick={() => removeInvitee(i.id)} aria-label={`Remove ${i.firstName}`}>
                  <span className="material-symbols-outlined text-sm leading-none">close</span>
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("xp_race")}
            className={`font-label text-xs uppercase font-bold px-3 py-2.5 rounded-xl border transition-colors ${
              mode === "xp_race" ? "bg-primary-container border-primary-container text-on-primary-container" : "border-surface-variant text-tertiary"
            }`}
          >
            XP Race
          </button>
          <button
            type="button"
            onClick={() => setMode("common_exercise")}
            className={`font-label text-xs uppercase font-bold px-3 py-2.5 rounded-xl border transition-colors ${
              mode === "common_exercise"
                ? "bg-primary-container border-primary-container text-on-primary-container"
                : "border-surface-variant text-tertiary"
            }`}
          >
            Same Exercise
          </button>
        </div>

        {mode === "common_exercise" && (
          <ExerciseSearchField value={exerciseName} onChange={setExerciseName} onPick={setExerciseName} label="Exercise" showXpHint={false} />
        )}

        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDurationMinutes(d)}
              className={`font-label text-xs uppercase font-bold px-4 py-2 rounded-xl border transition-colors ${
                durationMinutes === d
                  ? "bg-primary-container border-primary-container text-on-primary-container"
                  : "border-surface-variant text-tertiary"
              }`}
            >
              {d}m
            </button>
          ))}
        </div>

        {createError && <p className="font-body text-xs text-error">{createError}</p>}

        <button
          type="button"
          onClick={handleCreateRoom}
          disabled={creating}
          className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 rounded-xl shadow-soft disabled:opacity-60 transition-colors"
        >
          {creating ? "Sending..." : "Send Challenge"}
        </button>
      </div>

      {pendingInvites.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="font-label text-xs uppercase tracking-widest text-primary-container">Invites</span>
          {pendingInvites.map((room) => (
            <div key={room.id} className="bg-surface-container-low p-4 rounded-2xl shadow-soft flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-label text-sm uppercase font-bold text-on-surface truncate">{room.name}</p>
                <p className="font-body text-xs text-tertiary mt-0.5 truncate">{room.otherMemberNames.join(", ")} challenged you</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleRespond(room.id, true)}
                  className="bg-primary-container text-on-primary-container font-label text-xs uppercase font-bold px-3 py-2 rounded-lg"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => handleRespond(room.id, false)}
                  className="bg-surface-container text-tertiary font-label text-xs uppercase font-bold px-3 py-2 rounded-lg"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {otherRooms.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="font-label text-xs uppercase tracking-widest text-primary-container">Your Challenges</span>
          {otherRooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => setActiveRoomId(room.id)}
              className="bg-surface-container-low p-4 rounded-2xl shadow-soft flex items-center justify-between gap-3 text-left hover:bg-surface-container transition-colors"
            >
              <div className="min-w-0">
                <p className="font-label text-sm uppercase font-bold text-on-surface truncate">{room.name}</p>
                <p className="font-body text-xs text-tertiary mt-0.5 truncate">vs {room.otherMemberNames.join(", ") || "..."}</p>
              </div>
              <span
                className={`font-label text-[10px] uppercase font-bold px-2.5 py-1 rounded-full shrink-0 ${
                  room.status === "active"
                    ? "bg-primary-container/15 text-primary-container"
                    : room.status === "pending"
                      ? "bg-surface-container text-tertiary"
                      : "bg-surface-container text-tertiary"
                }`}
              >
                {room.status}
              </span>
            </button>
          ))}
        </div>
      )}

      {pendingInvites.length === 0 && otherRooms.length === 0 && (
        <p className="font-body text-sm text-tertiary text-center mt-6">No challenges yet — search a member above to start one.</p>
      )}
    </div>
  );
}

// Polls the room every few seconds while open — no realtime infra in this
// app yet, and a few seconds of latency on a live scoreboard members are
// actively glancing at mid-set is fine (same tradeoff as the /tv feed).
function RoomView({ roomId, myMemberId, onExit }: { roomId: string; myMemberId: string; onExit: () => void }) {
  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  // Bumped by LogSetForm right after a successful log so the leaderboard
  // reflects it immediately instead of waiting up to 4s for the next poll —
  // changing this re-runs the effect below, which polls right away.
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const res = await fetch(`/api/dashboard/playground/rooms/${roomId}`);
      const data = await res.json().catch(() => null);
      if (!cancelled && data?.status === "ok") setRoom(data.room);
    }
    poll();
    const id = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [roomId, refreshTick]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const myMembership = room?.members.find((m) => m.memberId === myMemberId);
  const canLog = room?.status === "active" && myMembership?.status === "accepted";

  const endsAtMs = room?.endsAt ? new Date(room.endsAt).getTime() : null;
  const durationMs = room ? room.durationMinutes * 60 * 1000 : 0;
  const remainingMs = endsAtMs != null ? Math.max(0, endsAtMs - now) : 0;
  const ringProgress = durationMs > 0 ? remainingMs / durationMs : 0;
  const isWinner = room?.status === "ended" && room.winnerMemberId === myMemberId;

  // Playground keeps no history — once every accepted member has left an
  // ended room, the whole thing gets deleted server-side (leaveRoom,
  // playground.ts). Only meaningful once the room has actually ended;
  // walking away from a still-pending/active one is just a normal exit.
  async function handleBack() {
    if (room?.status === "ended") {
      fetch(`/api/dashboard/playground/rooms/${roomId}/leave`, { method: "POST" }).catch(() => {});
    }
    onExit();
  }

  async function handleShareWin() {
    setShareError(null);
    setSharing(true);
    try {
      const file = await fetchCardFile(`/api/dashboard/achievement-card?type=playground&room=${roomId}`, "fitness-future-win.png");
      await shareOrDownloadCard(file, "Playground Win at Fitness Future Gym", "Won a Playground Challenge at Fitness Future Gym 🏆");
    } catch {
      setShareError("Couldn't generate the card — try again before leaving.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <button type="button" onClick={handleBack} className="font-label text-xs uppercase text-tertiary w-fit flex items-center gap-1">
        <span className="material-symbols-outlined text-base leading-none">arrow_back</span>
        Back
      </button>

      {!room ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <BrandLoader />
          <p className="font-label text-xs uppercase tracking-wider text-tertiary">Loading Room...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5 animate-fade-in">
          <div className="relative card-corner-glow card-glow-border bg-surface-container-low p-5 rounded-2xl shadow-soft border flex flex-col items-center gap-2 text-center overflow-hidden">
            <div className="flex items-center gap-2">
              {room.status === "active" && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-container" />
                </span>
              )}
              <span className="font-display text-lg uppercase tracking-wide text-on-surface">{room.name}</span>
            </div>
            {room.mode === "common_exercise" && room.name !== room.exerciseName && (
              <span className="font-label text-[10px] uppercase tracking-widest text-primary-container">{room.exerciseName}</span>
            )}

            {room.status === "pending" && (
              <span className="font-label text-xs uppercase font-bold text-tertiary">Waiting for responses...</span>
            )}

            {room.status === "active" && endsAtMs != null && (
              <div className="relative w-28 h-28 flex items-center justify-center my-1">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                  <circle cx="60" cy="60" r={RING_R} fill="none" stroke="var(--color-surface-variant)" strokeWidth="8" />
                  <circle
                    cx="60"
                    cy="60"
                    r={RING_R}
                    fill="none"
                    stroke="var(--color-primary-container)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={RING_C}
                    strokeDashoffset={RING_C * (1 - ringProgress)}
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <span className="relative font-display text-2xl tabular-nums text-on-surface">{formatCountdown(remainingMs)}</span>
              </div>
            )}

            {room.status === "ended" && <span className="font-label text-xs uppercase font-bold text-tertiary">Finished</span>}
          </div>

          {room.status === "pending" ? (
            <div className="flex flex-col gap-2">
              {room.members.map((m) => (
                <div key={m.memberId} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low">
                  <span className="font-body text-sm text-on-surface">
                    {m.firstName}
                    {m.memberId === myMemberId ? " (You)" : ""}
                  </span>
                  <span className="font-label text-[10px] uppercase text-tertiary">{m.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <Scoreboard
              roomId={room.id}
              members={room.members.filter((m) => m.status === "accepted")}
              unit={room.mode === "xp_race" ? "XP" : "kg"}
              myMemberId={myMemberId}
              ended={room.status === "ended"}
            />
          )}

          {isWinner && (
            <div className="bg-primary-container/10 border border-primary-container/30 rounded-2xl p-4 flex flex-col gap-2">
              <span className="flex items-center gap-1.5 font-label text-xs uppercase font-bold text-primary-container">
                <span className="material-symbols-outlined text-base leading-none">emoji_events</span>
                You won — grab your card before you leave
              </span>
              <button
                type="button"
                onClick={handleShareWin}
                disabled={sharing}
                className="flex items-center justify-center gap-1.5 bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 rounded-xl shadow-soft transition-colors disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-lg leading-none">ios_share</span>
                {sharing ? "Preparing..." : "Share Your Win"}
              </button>
              {shareError && <p className="font-body text-xs text-error">{shareError}</p>}
            </div>
          )}

          {canLog && <LogSetForm room={room} onLogged={() => setRefreshTick((t) => t + 1)} />}
        </div>
      )}
    </div>
  );
}

type ScoreboardMember = { memberId: string; firstName: string; score: number | null };

// A match-style scoreboard, not just a plain list: rank badges medal-coded
// for the top 3, a relative progress bar per row (works the same whether
// it's 2 people or a dozen), a "leading" callout, and a pop-in on any score
// that changes. One column, compact rows — built for a phone screen, not a
// TV like /tv's feed. Tapping a row opens that member's set-by-set
// activity during the room as a popup — see ActivityModal.
function Scoreboard({
  roomId,
  members,
  unit,
  myMemberId,
  ended,
}: {
  roomId: string;
  members: ScoreboardMember[];
  unit: string;
  myMemberId: string;
  ended: boolean;
}) {
  const [viewingMember, setViewingMember] = useState<ScoreboardMember | null>(null);
  const ranked = [...members].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const topScore = Math.max(1, ...ranked.map((m) => m.score ?? 0));
  const leader = ranked[0];
  const isTie = ranked.length > 1 && (ranked[0].score ?? 0) === (ranked[1].score ?? 0) && (ranked[0].score ?? 0) > 0;

  return (
    <div className="flex flex-col gap-2">
      {!ended && leader && (leader.score ?? 0) > 0 && !isTie && (
        <div className="flex items-center gap-2 px-4 py-2 bg-primary-container/10 border border-primary-container/30 rounded-xl">
          <span className="material-symbols-outlined text-primary-container text-base leading-none">bolt</span>
          <span className="font-label text-xs uppercase font-bold text-primary-container">
            {leader.memberId === myMemberId ? "You're leading" : `${leader.firstName} is leading`}
          </span>
        </div>
      )}

      {ranked.map((m, i) => {
        const rank = i + 1;
        const score = m.score ?? 0;
        const barPct = topScore > 0 ? Math.max(4, Math.round((score / topScore) * 100)) : 0;
        const isMe = m.memberId === myMemberId;
        const isLeader = i === 0 && score > 0 && !isTie;

        return (
          <div
            key={m.memberId}
            className={`rounded-2xl shadow-soft transition-colors ${
              isLeader && ended ? "bg-primary-container/15 border border-primary-container/40" : "bg-surface-container-low"
            } ${isMe ? "ring-1 ring-primary-container/50" : ""}`}
          >
            <button
              type="button"
              onClick={() => setViewingMember(m)}
              className="w-full flex items-center gap-3 p-3 text-left active:scale-[0.99] transition-transform"
            >
              <RankBadge rank={rank} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="font-label text-sm uppercase font-bold text-on-surface truncate">{m.firstName}</span>
                    {isMe && (
                      <span className="shrink-0 font-label text-[8px] uppercase font-bold px-1.5 py-0.5 rounded bg-primary-container/20 text-primary-container">
                        You
                      </span>
                    )}
                    {isLeader && (
                      <span className="material-symbols-outlined shrink-0 text-primary-container text-sm leading-none">emoji_events</span>
                    )}
                  </span>
                  {/* Keyed by score — a change remounts just this number, which
                      re-triggers the same pop-in used by Beast Mode's target
                      readout (globals.css), instead of a silent number swap. */}
                  <span key={score} className="animate-beast-target-in font-display text-lg text-primary-container tabular-nums shrink-0">
                    {score} {unit}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${isLeader ? "bg-primary-container" : "bg-primary-container/50"}`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>

              <span className="material-symbols-outlined text-tertiary text-lg leading-none shrink-0">history</span>
            </button>
          </div>
        );
      })}

      {viewingMember && <ActivityModal roomId={roomId} member={viewingMember} onClose={() => setViewingMember(null)} />}
    </div>
  );
}

type RoomActivityEntry = { exerciseName: string; sets: number; reps: number; weightKg: number | null; loggedAt: string };

// A popup, not an inline expand — so checking what someone else did doesn't
// push the rest of the scoreboard around underneath it.
function ActivityModal({ roomId, member, onClose }: { roomId: string; member: ScoreboardMember; onClose: () => void }) {
  const [activity, setActivity] = useState<RoomActivityEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/dashboard/playground/rooms/${roomId}/members/${member.memberId}/activity`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setActivity(Array.isArray(data?.activity) ? data.activity : []);
      })
      .catch(() => {
        if (!cancelled) setActivity([]);
      });
    return () => {
      cancelled = true;
    };
  }, [roomId, member.memberId]);

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/70 backdrop-blur-xl p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-sm bg-surface-container-lowest border border-surface-variant/50 rounded-3xl shadow-soft-lg p-5 flex flex-col gap-3 animate-beast-target-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-label text-[10px] uppercase tracking-widest text-primary-container">Activity</p>
            <h3 className="font-display text-xl uppercase text-on-surface">{member.firstName}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 text-tertiary hover:text-on-surface">
            <span className="material-symbols-outlined text-xl leading-none">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
          {activity === null ? (
            <p className="font-body text-sm text-tertiary text-center py-6">Loading...</p>
          ) : activity.length === 0 ? (
            <p className="font-body text-sm text-tertiary text-center py-6">Nothing logged yet.</p>
          ) : (
            activity.map((a, i) => (
              <div key={i} className="flex items-center justify-between gap-3 bg-surface-container-low px-3 py-2.5 rounded-xl">
                <span className="font-body text-sm text-on-surface truncate">{a.exerciseName}</span>
                <div className="text-right shrink-0">
                  <p className="font-label text-xs text-primary-container tabular-nums">
                    {a.sets}×{a.reps}
                    {a.weightKg ? ` @ ${a.weightKg}kg` : ""}
                  </p>
                  <p className="font-label text-[9px] text-tertiary tabular-nums mt-0.5">
                    {new Date(a.loggedAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function RankBadge({ rank }: { rank: number }) {
  const style =
    rank === 1
      ? "bg-[#E8C34A] text-black"
      : rank === 2
        ? "bg-[#B9BFC6] text-black"
        : rank === 3
          ? "bg-[#C98A4B] text-black"
          : "bg-surface-container text-tertiary";
  return <span className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-sm shrink-0 ${style}`}>{rank}</span>;
}

// Lets a contestant log a set without leaving the room — same shared
// /api/dashboard/workouts path every other logging surface in this app
// uses (Beast Mode included), so it counts toward real history/PRs/XP and
// the room's leaderboard picks it up on the next poll. Exercise is locked
// to the room's chosen lift in common_exercise mode (that's what's being
// scored); free choice in xp_race mode, since any training earns XP.
function LogSetForm({ room, onLogged }: { room: RoomDetail; onLogged: () => void }) {
  const [exerciseName, setExerciseName] = useState(room.mode === "common_exercise" ? (room.exerciseName ?? "") : "");
  const [sets, setSets] = useState("1");
  const [reps, setReps] = useState("10");
  const [weightKg, setWeightKg] = useState("");
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justLogged, setJustLogged] = useState(false);

  async function handleSubmit() {
    const setsNum = Math.trunc(Number(sets));
    const repsNum = Math.trunc(Number(reps));
    if (!exerciseName.trim() || !Number.isFinite(setsNum) || setsNum < 1 || !Number.isFinite(repsNum) || repsNum < 1) {
      setError("Exercise, sets, and reps are required.");
      return;
    }
    setError(null);
    setLogging(true);
    try {
      const res = await fetch("/api/dashboard/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseName: exerciseName.trim(), sets: setsNum, reps: repsNum, weightKg: weightKg || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (data?.status !== "ok") {
        setError(data?.message ?? "Couldn't log that set.");
        return;
      }
      setReps("10");
      setWeightKg("");
      setJustLogged(true);
      setTimeout(() => setJustLogged(false), 1200);
      onLogged();
    } finally {
      setLogging(false);
    }
  }

  return (
    <div className="relative overflow-hidden card-corner-glow bg-surface-container-low p-4 rounded-2xl shadow-soft flex flex-col gap-3">
      <span className="flex items-center gap-2 font-label text-xs uppercase tracking-widest text-primary-container">
        <span className="w-1 h-4 rounded-full bg-primary-container shrink-0" aria-hidden="true" />
        Log A Set
      </span>

      {room.mode === "common_exercise" ? (
        <div className="flex items-center gap-2 bg-surface-container px-3 py-2.5 rounded-xl">
          <span className="material-symbols-outlined text-primary-container text-lg leading-none">fitness_center</span>
          <span className="font-body text-sm text-on-surface">{room.exerciseName}</span>
        </div>
      ) : (
        <ExerciseSearchField value={exerciseName} onChange={setExerciseName} onPick={setExerciseName} label="Exercise" showXpHint={false} />
      )}

      <div className="grid grid-cols-[1fr_1fr_1.3fr] gap-2">
        <NumberStepper label="Sets" value={sets} min={1} onChange={setSets} />
        <NumberStepper label="Reps" value={reps} min={0} onChange={setReps} />
        <WeightStepper value={weightKg} onChange={setWeightKg} />
      </div>

      {error && <p className="font-body text-xs text-error">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={logging}
        className={`font-label text-sm uppercase font-bold px-6 py-3 rounded-xl shadow-soft disabled:opacity-60 transition-colors ${
          justLogged ? "bg-primary text-on-primary" : "bg-primary-container hover:bg-secondary-container text-on-primary-container"
        }`}
      >
        {logging ? "Logging..." : justLogged ? "Logged!" : "Log Set"}
      </button>
    </div>
  );
}
