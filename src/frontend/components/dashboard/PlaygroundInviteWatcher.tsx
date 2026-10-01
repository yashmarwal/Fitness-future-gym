"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { vibrate } from "@/frontend/lib/beep";

type Invite = {
  id: string;
  mode: "common_exercise" | "xp_race";
  exerciseName: string | null;
  otherMemberNames: string[];
};

const POLL_MS = 20000;

// Mounted once at the dashboard layout level, like CheckInCelebration and
// the rest-timer alarm watcher — so a Playground challenge shows up as a
// popup no matter which dashboard page is open, the same way a water
// reminder would. Unlike those, this has to POLL: the event that creates
// an invite happens on someone else's device, not this one, so there's no
// local event to listen for.
export default function PlaygroundInviteWatcher() {
  const router = useRouter();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [responding, setResponding] = useState(false);
  // Ref, not state — dismissing one invite shouldn't re-trigger the poll
  // effect, and this only needs to be read inside it, never rendered.
  const dismissedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/dashboard/playground/rooms");
        const data = await res.json().catch(() => null);
        if (cancelled || !Array.isArray(data?.rooms)) return;
        const pending = data.rooms.find(
          (r: { id: string; myStatus: string }) => r.myStatus === "invited" && !dismissedIds.current.has(r.id)
        );
        if (pending) {
          setInvite(pending);
          vibrate(60);
        }
      } catch {
        // Passive background watcher — a network hiccup just means it
        // tries again on the next poll, nothing to show for it.
      }
    }
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  function dismiss() {
    if (invite) dismissedIds.current.add(invite.id);
    setInvite(null);
  }

  async function respond(accept: boolean) {
    if (!invite) return;
    setResponding(true);
    try {
      await fetch(`/api/dashboard/playground/rooms/${invite.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept }),
      });
      dismissedIds.current.add(invite.id);
      setInvite(null);
      if (accept) router.push("/dashboard/playground");
    } finally {
      setResponding(false);
    }
  }

  if (!invite) return null;

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/70 backdrop-blur-xl p-4">
      <div className="relative w-full max-w-sm bg-surface-container-lowest border-2 border-primary-container rounded-3xl shadow-soft-lg p-6 flex flex-col items-center text-center gap-3 animate-beast-target-in">
        <span className="w-16 h-16 rounded-2xl flex items-center justify-center bg-primary-container text-on-primary-container shadow-soft">
          <span className="material-symbols-outlined text-3xl leading-none">group</span>
        </span>
        <div>
          <p className="font-label text-[11px] uppercase tracking-[0.2em] text-primary-container font-bold">Playground Challenge</p>
          <h2 className="font-display text-2xl text-on-surface uppercase tracking-wide leading-none mt-1">
            {invite.otherMemberNames.join(", ")}
          </h2>
          <p className="font-body text-sm text-tertiary mt-1">
            wants to race you — {invite.mode === "xp_race" ? "XP Race" : invite.exerciseName}
          </p>
        </div>

        <div className="w-full flex flex-col gap-2 mt-2">
          <button
            type="button"
            onClick={() => respond(true)}
            disabled={responding}
            className="w-full bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3.5 rounded-xl shadow-soft transition-colors active:scale-[0.98] disabled:opacity-60"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => respond(false)}
            disabled={responding}
            className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label text-sm uppercase font-bold px-6 py-3.5 rounded-xl shadow-soft transition-colors active:scale-[0.98] disabled:opacity-60"
          >
            Decline
          </button>
          <button type="button" onClick={dismiss} className="font-label text-[10px] uppercase text-tertiary hover:text-on-surface mt-1">
            Ask me later
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
