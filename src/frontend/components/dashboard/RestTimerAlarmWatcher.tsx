"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { playTick, playFinish, vibrateTick, vibrateFinish } from "@/frontend/lib/beep";
import { useRestTimerState, tickRestTimer, resetRestTimer } from "@/frontend/lib/restTimer";

const ALARM_REPEAT_MS = 1400;

// Mounted once at the dashboard layout level (not on the workouts page
// itself) so the countdown keeps being watched — and the alarm actually
// fires — no matter which dashboard page the member is currently on.
// Previously all of this lived inside RestTimerBar.tsx, which only ran
// while that one page was mounted: navigating to Nutrition or Progress
// while resting silently stopped the countdown from being checked at all,
// so the alarm only ever went off retroactively, the moment the member
// happened to come back to the workouts page. This is the single source
// of truth for both the tick/cue sound and the finish alarm — RestTimerBar
// only renders the visible countdown bar now, it doesn't play sound itself.
export default function RestTimerAlarmWatcher() {
  const state = useRestTimerState();
  const soundOnRef = useRef(state.soundOn);
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    soundOnRef.current = state.soundOn;
  }, [state.soundOn]);

  useEffect(() => {
    if (!state.running || state.endsAt == null) return;
    const endsAt = state.endsAt;
    const id = setInterval(() => {
      const nowMs = Date.now();
      const remaining = Math.max(0, Math.ceil((endsAt - nowMs) / 1000));
      if (remaining > 0 && remaining <= 4) {
        if (soundOnRef.current) playTick();
        vibrateTick();
      }
      if (remaining <= 0) {
        tickRestTimer(nowMs);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [state.running, state.endsAt]);

  useEffect(() => {
    if (state.alarming) {
      if (soundOnRef.current) playFinish();
      vibrateFinish();
      alarmIntervalRef.current = setInterval(() => {
        if (soundOnRef.current) playFinish();
        vibrateFinish();
      }, ALARM_REPEAT_MS);
    } else if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
    }
    return () => {
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    };
  }, [state.alarming]);

  if (!state.alarming) return null;

  const minutes = Math.floor(state.duration / 60);
  const seconds = state.duration % 60;
  const durationLabel = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, "0")}` : `${seconds}s`;

  // No backdrop-click-to-dismiss on purpose — a rest timer's whole job is
  // to interrupt, so this only clears via the explicit Stop button below.
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xl p-6">
      <div className="relative w-full max-w-sm">
        <div className="absolute -inset-1 bg-primary-container/40 blur-2xl animate-pulse" aria-hidden="true" />
        <div className="relative bg-surface-container-lowest border-2 border-primary-container rounded-3xl shadow-[0_0_80px_rgba(255,90,31,0.35)] flex flex-col items-center text-center px-8 py-10 gap-5">
          <span className="w-20 h-20 rounded-2xl flex items-center justify-center bg-primary-container text-on-primary-container animate-bounce shrink-0">
            <span className="material-symbols-outlined text-4xl leading-none">notifications_active</span>
          </span>

          <div className="flex flex-col gap-1.5">
            <span className="font-label text-[11px] uppercase tracking-[0.2em] text-primary-container font-bold">
              Rest Complete
            </span>
            <h2 className="font-display text-4xl text-on-surface uppercase tracking-wide leading-none">
              Time&apos;s Up!
            </h2>
            <p className="font-body text-sm text-tertiary mt-1">Your {durationLabel} rest is over — back to it.</p>
          </div>

          <button
            type="button"
            onClick={() => resetRestTimer()}
            className="w-full flex items-center justify-center gap-2 bg-error hover:bg-error/90 text-on-error font-label text-sm uppercase font-bold px-6 py-4 rounded-xl shadow-soft transition-colors active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg leading-none">notifications_off</span>
            Stop Alarm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
