"use client";

import { useEffect, useRef, useState } from "react";
import { playTick, playFinish, vibrateTick, vibrateFinish } from "@/frontend/lib/beep";

const PRESETS = [30, 60, 90, 120, 180];

const ALARM_REPEAT_MS = 1400;

export default function RestTimer() {
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

  // Keeps chiming until dismissed (Stop Alarm / Reset / a new preset), not
  // just once — that's the whole point of a rest-timer alarm, easy to miss
  // a single beep mid-set.
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
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-md mx-auto flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide">Rest Timer</h1>
        <button
          onClick={() => setSoundOn((s) => !s)}
          aria-label={soundOn ? "Mute sound" : "Unmute sound"}
          className="flex items-center gap-1.5 bg-surface-container-high hover:bg-surface-container-highest text-tertiary hover:text-on-surface font-label text-[10px] uppercase tracking-widest px-3 py-2 transition-colors"
        >
          <span className="material-symbols-outlined text-base leading-none">
            {soundOn ? "volume_up" : "volume_off"}
          </span>
          Sound: {soundOn ? "On" : "Off"}
        </button>
      </div>

      <div
        className={`w-full aspect-square max-w-xs flex flex-col items-center justify-center shadow-hard mb-6 ${
          alarming ? "bg-primary-container animate-pulse" : "bg-surface-container-low"
        }`}
      >
        <span
          className={`font-display text-7xl tabular-nums ${
            alarming ? "text-on-primary-container" : "text-primary-container"
          }`}
        >
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
        {alarming && (
          <span className="font-label text-xs uppercase tracking-widest text-on-primary-container mt-2">
            Time&apos;s Up!
          </span>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2 w-full mb-6">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => selectPreset(preset)}
            className={`font-label text-xs uppercase py-2.5 transition-colors ${
              duration === preset
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {preset}s
          </button>
        ))}
      </div>

      <div className="flex gap-3 w-full">
        {alarming ? (
          <button
            onClick={reset}
            className="flex-1 bg-error text-on-error font-label text-sm uppercase font-bold px-6 py-3 shadow-hard"
          >
            Stop Alarm
          </button>
        ) : (
          <>
            <button
              onClick={() => setRunning((r) => !r)}
              disabled={remaining === 0}
              className="flex-1 bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 shadow-hard disabled:opacity-60"
            >
              {running ? "Pause" : "Start"}
            </button>
            <button
              onClick={reset}
              className="flex-1 bg-surface-container-high text-on-surface font-label text-sm uppercase px-6 py-3"
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}
