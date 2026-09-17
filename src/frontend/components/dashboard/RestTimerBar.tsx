"use client";

import { useEffect, useRef, useState } from "react";
import { playTick, playFinish, vibrateTick, vibrateFinish } from "@/frontend/lib/beep";

const PRESETS = [30, 60, 90, 120, 180];
const ALARM_REPEAT_MS = 1400;

// A compact, always-visible sibling to the full-page Rest Timer
// (RestTimer.tsx, /dashboard/timer — untouched, same countdown/alarm
// behavior). That page's big square dial, heading, and page padding read
// as heavy pasted inline mid-page, so this condenses the same state
// machine into a single sleek bar pinned above the log-workout form
// instead. The small amount of duplicated countdown/alarm logic is
// deliberate — keeping it self-contained means the standalone Timer page
// stays byte-for-byte untouched.
export default function RestTimerBar() {
  const [duration, setDuration] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [alarming, setAlarming] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundOnRef = useRef(soundOn);

  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            setRunning(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            setAlarming(true);
            return 0;
          }
          if (prev <= 4) {
            if (soundOnRef.current) playTick();
            vibrateTick();
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (alarming) {
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
  }, [alarming]);

  function selectPreset(seconds: number) {
    setDuration(seconds);
    setRemaining(seconds);
    setRunning(false);
    setAlarming(false);
  }

  function reset() {
    setRemaining(duration);
    setRunning(false);
    setAlarming(false);
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div
      className={`shadow-hard mb-6 flex flex-col gap-2.5 px-4 py-3 transition-colors ${
        alarming ? "bg-primary-container animate-pulse" : "bg-surface-container-low"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`material-symbols-outlined text-xl leading-none shrink-0 ${
            alarming ? "text-on-primary-container" : "text-primary-container"
          }`}
        >
          timer
        </span>
        <span
          className={`font-display text-3xl tabular-nums leading-none shrink-0 ${
            alarming ? "text-on-primary-container" : "text-primary-container"
          }`}
        >
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
        {alarming && (
          <span className="font-label text-[9px] uppercase tracking-widest text-on-primary-container hidden sm:inline">
            Time&apos;s Up!
          </span>
        )}

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setSoundOn((s) => !s)}
          aria-label={soundOn ? "Mute rest timer sound" : "Unmute rest timer sound"}
          className={`shrink-0 flex items-center justify-center w-8 h-8 transition-colors ${
            alarming ? "text-on-primary-container/70 hover:text-on-primary-container" : "text-tertiary hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-base leading-none">
            {soundOn ? "volume_up" : "volume_off"}
          </span>
        </button>

        {alarming ? (
          <button
            type="button"
            onClick={reset}
            className="shrink-0 flex items-center gap-1.5 font-label text-[10px] uppercase font-bold px-3 py-2 bg-error text-on-error transition-colors"
          >
            <span className="material-symbols-outlined text-sm leading-none">notifications_off</span>
            Stop
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setRunning((r) => !r)}
              disabled={remaining === 0}
              className="shrink-0 flex items-center gap-1.5 font-label text-[10px] uppercase font-bold px-3 py-2 bg-primary-container hover:bg-secondary-container text-on-primary-container disabled:opacity-60 transition-colors"
            >
              <span className="material-symbols-outlined text-sm leading-none">{running ? "pause" : "play_arrow"}</span>
              {running ? "Pause" : "Start"}
            </button>
            <button
              type="button"
              onClick={reset}
              aria-label="Reset rest timer"
              className="shrink-0 flex items-center justify-center w-8 h-8 bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-base leading-none">restart_alt</span>
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => selectPreset(preset)}
            className={`shrink-0 font-label text-[10px] uppercase px-2.5 py-1.5 transition-colors ${
              duration === preset
                ? alarming
                  ? "bg-on-primary-container/25 text-on-primary-container"
                  : "bg-primary-container text-on-primary-container"
                : alarming
                  ? "bg-on-primary-container/10 text-on-primary-container/80 hover:bg-on-primary-container/20"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {preset}s
          </button>
        ))}
      </div>
    </div>
  );
}
