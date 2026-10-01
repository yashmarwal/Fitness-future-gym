"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import ExerciseSearchField from "@/frontend/components/dashboard/ExerciseSearchField";
import { NumberStepper, WeightStepper } from "@/frontend/components/dashboard/WorkoutLogForm";
import { playFinish, vibrateFinish, vibrateTick, vibrateError } from "@/frontend/lib/beep";

type PlannedSet = { weightKg: string; reps: string };
type SessionSet = {
  plannedWeightKg: number | null;
  plannedReps: number;
  actualWeightKg: number | null;
  actualReps: number;
  hit: boolean;
};
type Phase = "setup" | "confirm" | "resting" | "summary";
type GymRecord = { memberName: string; weightKg: number; reps: number } | null;

const REST_PRESETS = [30, 60, 90, 120];
const MAX_SETS = 12;
const RING_R = 90;
const RING_C = 2 * Math.PI * RING_R;

// navigator.wakeLock isn't in every TS lib target yet — kept loosely typed
// and fully feature-detected so an older browser just silently skips it
// (the session still works, the screen may sleep during a long rest).
type WakeLockSentinelLike = { release: () => Promise<void> };
type NavigatorWithWakeLock = Navigator & {
  wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
};

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function toNumberOrNull(text: string): number | null {
  return text.trim() ? Number(text) : null;
}

const LAUNCHER_PHRASES = ["BEAST MODE", "GO BEAST", "NO MERCY", "LEVEL UP", "PUSH HARD", "OWN IT", "CRUSH IT"];
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const SCRAMBLE_FRAMES = 12;
const SCRAMBLE_FRAME_MS = 35;

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Cycles the launcher button's label every 5s with a terminal-style decode
// scramble (characters resolve left-to-right through random letters) rather
// than a plain crossfade — monospace (font-beast) keeps each character the
// same width so nothing jitters horizontally while it resolves.
function useScrambleCycle(phrases: string[], intervalMs = 1800): string {
  const [text, setText] = useState(phrases[0]);
  const indexRef = useRef(0);
  const scrambleIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const cycle = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % phrases.length;
      const target = phrases[indexRef.current];

      if (scrambleIdRef.current) clearInterval(scrambleIdRef.current);
      if (prefersReducedMotion()) {
        setText(target);
        return;
      }

      let frame = 0;
      scrambleIdRef.current = setInterval(() => {
        frame++;
        const revealCount = Math.ceil((frame / SCRAMBLE_FRAMES) * target.length);
        setText(
          target
            .split("")
            .map((ch, i) => (ch === " " || i < revealCount ? ch : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]))
            .join("")
        );
        if (frame >= SCRAMBLE_FRAMES && scrambleIdRef.current) {
          clearInterval(scrambleIdRef.current);
          scrambleIdRef.current = null;
        }
      }, SCRAMBLE_FRAME_MS);
    }, intervalMs);

    return () => {
      clearInterval(cycle);
      if (scrambleIdRef.current) clearInterval(scrambleIdRef.current);
    };
  }, [phrases, intervalMs]);

  return text;
}

// Targeting-reticle corner marks — a cheap, reusable HUD framing device
// used around the main readout cards.
function CornerBrackets() {
  return (
    <>
      <span aria-hidden="true" className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-primary-container/50" />
      <span aria-hidden="true" className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-primary-container/50" />
      <span aria-hidden="true" className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-primary-container/50" />
      <span aria-hidden="true" className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-primary-container/50" />
    </>
  );
}

// A small "LIVE" telemetry badge — pulsing dot + label, used at the top of
// the live-session screens.
function LiveBadge({ label, center = true }: { label: string; center?: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded bg-white/5 border border-white/10 w-fit ${center ? "mx-auto" : ""}`}>
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-container" />
      </span>
      <span className="font-beast text-[10px] tracking-[0.2em] text-primary-container uppercase">{label}</span>
    </div>
  );
}

// Segmented set-progress bar — one rectangular block per planned set,
// filled+glowing for done, pulsing for the one in progress, dim for
// upcoming. Reads better at a glance than a dot row once there are more
// than a handful of sets.
function SegmentBar({ total, doneCount }: { total: number; doneCount: number }) {
  return (
    <div className="grid gap-1.5 w-full" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-sm transition-all duration-300 ${
            i < doneCount
              ? "bg-primary-container"
              : i === doneCount
                ? "bg-primary-container animate-beast-dot-pulse"
                : "bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}

// The entry point — a single button that, on tap, opens the full-screen
// guided session as a portal. Self-contained: unlike the normal "Log A
// Set" form, Beast Mode deliberately doesn't reuse exercise history/recent
// picks — every session starts from a clean search, matching "always new."
// Also auto-opens on a ?beastMode=open query param — Beast Mode has no
// page of its own (it's a modal, not a route), so this is what lets the
// dashboard's Quick Actions grid deep-link straight into it in one tap
// instead of landing on Workouts and requiring a second tap. Reads
// window.location directly rather than next/navigation's useSearchParams,
// which needs a Suspense boundary wherever it's used — not worth the
// extra wrapper just to read one param once on mount.
//
// Cleans the URL afterward with history.replaceState, NOT router.replace:
// router.replace() is a real Next.js navigation, which re-runs the
// Workouts page's Server Component and can remount this very component
// with the query param already stripped — closing the modal (or never
// opening it) a beat after it opened. history.replaceState only rewrites
// the URL bar; it never touches the React tree.
export default function BeastModeLauncher() {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("beastMode") === "open";
  });
  const label = useScrambleCycle(LAUNCHER_PHRASES);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("beastMode") === "open") {
      window.history.replaceState(null, "", "/dashboard/workouts");
    }
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2.5 font-label text-base uppercase font-bold px-4 py-4 rounded-full bg-black border border-primary-container text-primary-container hover:bg-primary-container/10 active:scale-[0.98] transition-all w-full"
      >
        <span className="material-symbols-outlined text-xl leading-none">bolt</span>
        <span className="font-beast tabular-nums w-[11ch] text-center">{label}</span>
      </button>
      {open && <BeastMode onClose={() => setOpen(false)} />}
    </>
  );
}

function BeastMode({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("setup");

  // Setup
  const [exerciseName, setExerciseName] = useState("");
  const [restSeconds, setRestSeconds] = useState(60);
  const [planned, setPlanned] = useState<PlannedSet[]>([{ weightKg: "", reps: "10" }]);
  // Free-typed, independent of planned.length (which it drives) — feeding
  // String(planned.length) straight back as the input's value would snap
  // an emptied field back to a real digit before the next keystroke lands,
  // the exact "125" bug NumberStepper's own string-state fix (see
  // WorkoutLogForm.tsx) was written to avoid.
  const [setCountText, setSetCountText] = useState("1");
  const [gymRecord, setGymRecord] = useState<GymRecord>(null);

  // Session
  const [setIndex, setSetIndex] = useState(0);
  const [sessionSets, setSessionSets] = useState<SessionSet[]>([]);
  const [adjusting, setAdjusting] = useState(false);
  const [actualWeight, setActualWeight] = useState("");
  const [actualReps, setActualReps] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [lastHit, setLastHit] = useState(true);
  const [restRemaining, setRestRemaining] = useState(0);
  const [prsEarned, setPrsEarned] = useState(0);
  const [newGymRecord, setNewGymRecord] = useState(false);
  const [flash, setFlash] = useState<"hit" | "fail" | null>(null);

  const restEndsAtRef = useRef<number | null>(null);
  const restFiredRef = useRef(false);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);

  // Current gym record for whatever exercise is picked, shown as something
  // to chase on the setup screen — refetched whenever the name settles.
  useEffect(() => {
    const name = exerciseName.trim();
    if (!name) return;
    let cancelled = false;
    fetch(`/api/dashboard/beast-mode/record?exercise=${encodeURIComponent(name)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setGymRecord(data?.record ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [exerciseName]);
  // Only shown once a name is actually picked — avoids a synchronous
  // setState(null) in the effect above just to clear it while typing.
  const shownGymRecord = exerciseName.trim() ? gymRecord : null;

  // Screen Wake Lock for the whole session (a full Beast Mode run can span
  // several minutes of idle rest between sets) — re-acquired on visibility
  // change since the API releases it automatically whenever the tab/screen
  // is backgrounded.
  useEffect(() => {
    if (phase === "setup" || phase === "summary") return;
    const nav = navigator as NavigatorWithWakeLock;
    let cancelled = false;
    async function acquire() {
      try {
        wakeLockRef.current = (await nav.wakeLock?.request("screen")) ?? null;
      } catch {
        // Unsupported or denied — session still runs, screen may just sleep.
      }
    }
    acquire();
    function handleVisibility() {
      if (document.visibilityState === "visible" && !cancelled) acquire();
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [phase]);

  // Rest countdown — timestamp-based (endsAt), same approach as
  // restTimer.ts, so it stays accurate even if the interval is throttled in
  // a backgrounded tab instead of drifting from naive per-tick decrements.
  useEffect(() => {
    if (phase !== "resting") return;
    restFiredRef.current = false;
    const tick = () => {
      const endsAt = restEndsAtRef.current;
      if (endsAt == null) return;
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRestRemaining(remaining);
      if (remaining <= 0 && !restFiredRef.current) {
        restFiredRef.current = true;
        playFinish();
        vibrateFinish();
        goToNextSetOrSummary();
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function handleSetCountChange(text: string) {
    setSetCountText(text);
    const n = Math.trunc(Number(text));
    if (!Number.isFinite(n) || n < 1) return;
    const count = Math.min(MAX_SETS, n);
    setPlanned((prev) => {
      const next = [...prev];
      while (next.length < count) next.push({ ...next[next.length - 1] });
      next.length = count;
      return next;
    });
  }

  function updatePlannedSet(index: number, patch: Partial<PlannedSet>) {
    setPlanned((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function resetConfirmFields(index: number, source: PlannedSet[] = planned) {
    setAdjusting(false);
    setActualWeight(source[index].weightKg);
    setActualReps(source[index].reps);
  }

  function canStart(): boolean {
    if (!exerciseName.trim()) return false;
    return planned.every((s) => Math.trunc(Number(s.reps)) >= 1);
  }

  function handleStart() {
    if (!canStart()) return;
    setSetIndex(0);
    resetConfirmFields(0);
    setSessionSets([]);
    setPrsEarned(0);
    setNewGymRecord(false);
    setPhase("confirm");
  }

  function goToNextSetOrSummary() {
    const next = setIndex + 1;
    if (next < planned.length) {
      setSetIndex(next);
      resetConfirmFields(next);
      setPhase("confirm");
    } else {
      finishSession();
    }
  }

  async function confirmSet() {
    if (confirming) return;
    const weight = toNumberOrNull(actualWeight);
    const reps = Math.trunc(Number(actualReps)) || 0;
    const plannedSet = planned[setIndex];
    const plannedWeight = toNumberOrNull(plannedSet.weightKg);
    const plannedReps = Math.trunc(Number(plannedSet.reps)) || 0;
    const hit = reps >= plannedReps && (plannedWeight == null || (weight ?? 0) >= plannedWeight);

    setConfirming(true);
    try {
      const res = await fetch("/api/dashboard/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseName, sets: 1, reps, weightKg: weight ?? undefined }),
      });
      const data = await res.json().catch(() => null);
      if (data?.pr?.isPr && !data.pr.isFirstTime) setPrsEarned((n) => n + 1);
    } catch {
      // The set still counts toward this Beast Mode session below even if
      // this particular write to shared workout history failed — a member
      // mid-session should never get stranded by one flaky request.
    } finally {
      setConfirming(false);
    }

    const updatedSets = [
      ...sessionSets,
      { plannedWeightKg: plannedWeight, plannedReps, actualWeightKg: weight, actualReps: reps, hit },
    ];
    setSessionSets(updatedSets);
    setLastHit(hit);
    setFlash(hit ? "hit" : "fail");
    setTimeout(() => setFlash(null), 550);
    if (hit) vibrateTick();
    else vibrateError();

    if (setIndex + 1 < planned.length) {
      restEndsAtRef.current = Date.now() + restSeconds * 1000;
      setRestRemaining(restSeconds);
      setPhase("resting");
    } else {
      await finishSession(updatedSets);
    }
  }

  async function finishSession(finalSets: SessionSet[] = sessionSets) {
    if (finalSets.length > 0) {
      try {
        const res = await fetch("/api/dashboard/beast-mode/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exerciseName, restSeconds, sets: finalSets }),
        });
        const data = await res.json().catch(() => null);
        if (data?.isNewGymRecord) setNewGymRecord(true);
      } catch {
        // Best-effort — every set is already safely logged via
        // /api/dashboard/workouts above; this only costs the Beast Mode
        // history entry / gym record check for this one session.
      }
    }
    router.refresh();
    setPhase("summary");
  }

  async function handleExit() {
    if (sessionSets.length === 0) {
      onClose();
      return;
    }
    if (!window.confirm("End Beast Mode? Sets you've already done are saved.")) return;
    await finishSession();
  }

  const doneCount = phase === "resting" ? setIndex + 1 : setIndex;
  const totalVolume = sessionSets.reduce((sum, s) => sum + (s.actualWeightKg ?? 0) * s.actualReps, 0);
  const setsHit = sessionSets.filter((s) => s.hit).length;
  // Real, computed from the plan — no invented/estimated numbers.
  const projectedVolume = planned.reduce((sum, s) => {
    const w = toNumberOrNull(s.weightKg) ?? 0;
    const r = Math.trunc(Number(s.reps)) || 0;
    return sum + w * r;
  }, 0);

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black text-white overflow-y-auto overscroll-contain">
      {flash && (
        <div
          key={flash}
          aria-hidden="true"
          className={`fixed inset-0 z-10000 pointer-events-none animate-beast-flash ${
            flash === "hit" ? "bg-primary-container" : "bg-error-container"
          }`}
        />
      )}

      {phase === "setup" && (
        <div className="min-h-full flex flex-col px-gutter-mobile py-6 max-w-lg mx-auto w-full gap-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-display text-3xl uppercase tracking-wide text-primary-container animate-beast-glow-text">
              <span className="material-symbols-outlined text-3xl leading-none">bolt</span>
              Beast Mode
            </span>
            <button type="button" onClick={onClose} aria-label="Close" className="p-2 text-white/70 hover:text-white">
              <span className="material-symbols-outlined text-2xl leading-none">close</span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <LiveBadge label="Session Setup" center={false} />
            <span className="font-beast text-[10px] tracking-[0.15em] text-white/40 uppercase">Manual Control</span>
          </div>

          <div className="relative bg-surface-container-lowest border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-primary-container text-base leading-none">fitness_center</span>
              <span className="font-beast text-[10px] tracking-[0.2em] text-white/50 uppercase">Target Exercise</span>
            </div>
            <ExerciseSearchField
              value={exerciseName}
              onChange={setExerciseName}
              onPick={setExerciseName}
              label="Exercise"
              showXpHint={false}
            />
          </div>

          {shownGymRecord && (
            <div className="flex items-center gap-2 bg-primary-container/10 border border-primary-container/40 rounded-xl px-4 py-3 font-body text-sm">
              <span className="material-symbols-outlined text-primary-container text-xl leading-none">emoji_events</span>
              <span>
                Gym record: <span className="font-beast font-bold text-primary-container">{shownGymRecord.weightKg}kg × {shownGymRecord.reps}</span> —
                held by <span className="font-bold">{shownGymRecord.memberName}</span>
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container-lowest border border-white/10 rounded-2xl p-4 flex flex-col gap-1">
              <span className="font-beast text-[10px] tracking-[0.15em] text-white/50 uppercase">Total Sets</span>
              <NumberStepper label="" value={setCountText} min={1} onChange={handleSetCountChange} />
            </div>
            <div className="bg-surface-container-lowest border border-white/10 rounded-2xl p-4 flex flex-col gap-1.5">
              <span className="font-beast text-[10px] tracking-[0.15em] text-white/50 uppercase">Rest Timer</span>
              <div className="grid grid-cols-4 gap-1">
                {REST_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRestSeconds(preset)}
                    className={`font-beast text-[10px] font-bold py-2 rounded-lg transition-colors ${
                      restSeconds === preset
                        ? "bg-primary-container text-on-primary-container"
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <p className="font-beast text-2xl font-extrabold text-primary-container text-center tabular-nums mt-1">
                {restSeconds}
                <span className="text-xs text-white/40 ml-1">SEC</span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="font-beast text-[10px] tracking-[0.15em] text-white/50 uppercase">Set-by-Set Targets</span>
            {projectedVolume > 0 && (
              <span className="font-beast text-[10px] tracking-widest text-primary-container uppercase">
                Projected: {projectedVolume.toLocaleString()}kg
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {planned.map((s, i) => (
              <div key={i} className="bg-surface-container-lowest border border-white/10 rounded-2xl p-4 flex items-end gap-3">
                <span className="font-beast text-xs font-bold text-white/50 bg-white/5 px-2 py-1 rounded pb-1.5 shrink-0">
                  SET {String(i + 1).padStart(2, "0")}
                </span>
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <WeightStepper value={s.weightKg} onChange={(v) => updatePlannedSet(i, { weightKg: v })} />
                  <NumberStepper label="Reps" value={s.reps} min={0} onChange={(v) => updatePlannedSet(i, { reps: v })} />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            disabled={!canStart()}
            onClick={handleStart}
            className="mt-2 bg-primary-container text-on-primary-container rounded-2xl shadow-[0_0_40px_rgba(255,90,31,0.45)] disabled:opacity-40 disabled:shadow-none active:scale-[0.98] transition-all flex items-center justify-between gap-3 px-5 py-4"
          >
            <span className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-on-primary-container/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl leading-none">bolt</span>
              </span>
              <span className="text-left">
                <span className="font-display text-lg uppercase tracking-wide block leading-none">Start Beast Mode</span>
                <span className="font-beast text-[10px] uppercase tracking-wider block mt-1 opacity-70">
                  Set 01 of {String(planned.length).padStart(2, "0")}
                </span>
              </span>
            </span>
            <span className="material-symbols-outlined text-xl">arrow_forward</span>
          </button>
        </div>
      )}

      {phase === "confirm" && (
        <div className="min-h-full flex flex-col px-gutter-mobile py-6 max-w-lg mx-auto w-full">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleExit}
              className="font-beast text-[10px] tracking-[0.15em] text-white/50 hover:text-error-container uppercase px-2 py-2"
            >
              Exit
            </button>
            <LiveBadge label={`Set ${setIndex + 1} Active`} />
            <span className="w-9" />
          </div>

          <div className="mt-4">
            <SegmentBar total={planned.length} doneCount={doneCount} />
            {sessionSets.length > 0 && (
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                {sessionSets.map((s, i) => (
                  <span
                    key={i}
                    className={`font-beast text-[10px] tracking-wide ${s.hit ? "text-primary-container" : "text-on-error-container/70"}`}
                  >
                    SET {i + 1}: {s.actualWeightKg != null ? `${s.actualWeightKg}×` : ""}
                    {s.actualReps} {s.hit ? "HIT" : "MISS"}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center text-center pt-6">
            <div key={setIndex} className="relative w-full max-w-xs bg-surface-container-lowest border border-white/10 rounded-2xl p-5 animate-beast-target-in">
              <CornerBrackets />
              <p className="font-beast text-[10px] tracking-[0.3em] text-white/50 uppercase mb-3 truncate">{exerciseName}</p>
              <div className="grid grid-cols-2 divide-x divide-white/10">
                <div className="pr-3">
                  <span className="font-beast text-[9px] tracking-wider text-white/40 uppercase block mb-0.5">Load</span>
                  <p className="font-beast text-5xl font-extrabold leading-none">
                    {toNumberOrNull(planned[setIndex].weightKg) != null ? planned[setIndex].weightKg : "BW"}
                    {toNumberOrNull(planned[setIndex].weightKg) != null && <span className="text-sm text-white/40 ml-0.5">kg</span>}
                  </p>
                </div>
                <div className="pl-3">
                  <span className="font-beast text-[9px] tracking-wider text-white/40 uppercase block mb-0.5">Reps</span>
                  <p className="font-beast text-5xl font-extrabold leading-none">{planned[setIndex].reps}</p>
                </div>
              </div>
            </div>

            {adjusting && (
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-6">
                <WeightStepper value={actualWeight} onChange={setActualWeight} />
                <NumberStepper label="Reps" value={actualReps} min={0} onChange={setActualReps} />
              </div>
            )}

            {/* my-auto centers the button in the space left below the
                target card — clear of it on any screen height, without
                pinning to the very bottom. */}
            <div className="my-auto relative flex items-center justify-center">
              {!confirming && (
                <>
                  <span className="absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-primary-container animate-beast-ping" aria-hidden="true" />
                  <span
                    className="absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-primary-container animate-beast-ping"
                    style={{ animationDelay: "0.9s" }}
                    aria-hidden="true"
                  />
                </>
              )}
              <button
                type="button"
                onClick={confirmSet}
                disabled={confirming}
                className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-primary-container text-on-primary-container font-display text-2xl uppercase tracking-wide shadow-[0_0_60px_rgba(255,90,31,0.55)] active:scale-90 active:brightness-110 transition-transform disabled:opacity-60 flex flex-col items-center justify-center gap-1 border-4 border-white/20"
              >
                <span className="material-symbols-outlined text-6xl leading-none">touch_app</span>
                {confirming ? "Saving..." : "Tap When Done"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAdjusting((v) => !v)}
              className="mb-2 font-label text-[11px] uppercase tracking-wider text-white/70 hover:text-white bg-white/5 border border-white/15 rounded-full px-5 py-2.5 transition-colors"
            >
              {adjusting ? "Cancel Adjustment" : "Didn't Go As Planned? Adjust"}
            </button>
          </div>
        </div>
      )}

      {phase === "resting" && (
        <div className="min-h-full flex flex-col px-gutter-mobile py-6 max-w-lg mx-auto w-full">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleExit}
              className="font-beast text-[10px] tracking-[0.15em] text-white/50 hover:text-error-container uppercase px-2 py-2"
            >
              Exit
            </button>
            <LiveBadge label="Resting" />
            <span className="w-9" />
          </div>

          <div className="mt-4">
            <SegmentBar total={planned.length} doneCount={doneCount} />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-8 text-center">
            <span
              key={lastHit ? "hit" : "fail"}
              className={`animate-beast-target-in flex items-center gap-2 font-beast text-xs font-bold px-4 py-2 rounded-xl uppercase tracking-wider ${
                lastHit ? "bg-primary-container/15 text-primary-container" : "bg-error-container/30 text-on-error-container"
              }`}
            >
              <span className="material-symbols-outlined text-lg leading-none">{lastHit ? "check_circle" : "cancel"}</span>
              {lastHit ? "Target Hit" : "Target Fail"}
            </span>

            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200" aria-hidden="true">
                <circle cx="100" cy="100" r={RING_R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                <circle
                  cx="100"
                  cy="100"
                  r={RING_R}
                  fill="none"
                  stroke="var(--color-primary-container)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C * (1 - (restSeconds > 0 ? restRemaining / restSeconds : 0))}
                  style={{ transition: "stroke-dashoffset 1s linear", filter: "drop-shadow(0 0 8px rgba(255,90,31,0.65))" }}
                />
              </svg>
              <p className="relative font-beast text-7xl font-extrabold tabular-nums">{formatSeconds(restRemaining)}</p>
            </div>

            <p className="font-beast text-xs text-white/50 uppercase tracking-wider">
              Next — Set {setIndex + 2}:{" "}
              <span className="text-white">
                {toNumberOrNull(planned[setIndex + 1].weightKg) != null ? `${planned[setIndex + 1].weightKg}kg × ` : ""}
                {planned[setIndex + 1].reps} reps
              </span>
            </p>

            <button
              type="button"
              onClick={goToNextSetOrSummary}
              className="mt-2 bg-white/10 border border-white/20 text-white font-label text-sm uppercase font-bold px-6 py-3 rounded-xl hover:bg-white/15 transition-colors active:scale-95"
            >
              Skip Rest
            </button>
          </div>
        </div>
      )}

      {phase === "summary" && (
        <div className="min-h-full flex flex-col px-gutter-mobile py-6 max-w-lg mx-auto w-full items-center justify-center gap-6 text-center">
          <span className="animate-beast-target-in material-symbols-outlined text-primary-container text-7xl leading-none drop-shadow-[0_0_30px_rgba(255,90,31,0.6)]">
            military_tech
          </span>
          <h2 className="font-display text-4xl uppercase tracking-wide">Session Complete</h2>
          <p className="font-beast text-xs text-white/60 uppercase tracking-wider">{exerciseName}</p>

          {newGymRecord && (
            <div className="animate-beast-target-in flex items-center gap-2 bg-primary-container/15 border border-primary-container/40 rounded-xl px-4 py-3 font-body text-sm font-bold text-primary-container shadow-[0_0_30px_rgba(255,90,31,0.35)]">
              <span className="material-symbols-outlined text-xl leading-none">emoji_events</span>
              New Gym Record!
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
            <div className="relative bg-surface-container-lowest border border-white/10 rounded-2xl p-4">
              <CornerBrackets />
              <p className="font-beast text-3xl font-extrabold tabular-nums">
                {setsHit}/{sessionSets.length}
              </p>
              <p className="font-beast text-[9px] uppercase tracking-wider text-white/50 mt-1">Sets Hit</p>
            </div>
            <div className="relative bg-surface-container-lowest border border-white/10 rounded-2xl p-4">
              <CornerBrackets />
              <p className="font-beast text-3xl font-extrabold tabular-nums">{totalVolume.toLocaleString()}</p>
              <p className="font-beast text-[9px] uppercase tracking-wider text-white/50 mt-1">kg Volume</p>
            </div>
          </div>

          {prsEarned > 0 && (
            <p className="font-body text-sm text-primary-container">
              🎉 {prsEarned} new personal record{prsEarned > 1 ? "s" : ""} this session
            </p>
          )}

          <button
            type="button"
            onClick={onClose}
            className="mt-2 bg-primary-container text-on-primary-container font-display text-lg uppercase tracking-wide px-8 py-4 rounded-2xl shadow-soft active:scale-[0.98] transition-all"
          >
            Done
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}
