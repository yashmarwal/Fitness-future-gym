"use client";

import { useEffect, useRef, useState } from "react";

const PRESETS = [30, 60, 90, 120, 180];

export default function RestTimer() {
  const [duration, setDuration] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            setRunning(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
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

  function selectPreset(seconds: number) {
    setDuration(seconds);
    setRemaining(seconds);
    setRunning(false);
  }

  function reset() {
    setRemaining(duration);
    setRunning(false);
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-md mx-auto flex flex-col items-center">
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-8 self-start">
        Rest Timer
      </h1>

      <div className="bg-surface-container-low w-full aspect-square max-w-xs flex items-center justify-center shadow-hard mb-6">
        <span className="font-display text-7xl text-primary-container tabular-nums">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2 w-full mb-6">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => selectPreset(preset)}
            className={`font-label text-xs uppercase py-2 ${
              duration === preset
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container text-on-surface-variant"
            }`}
          >
            {preset}s
          </button>
        ))}
      </div>

      <div className="flex gap-3 w-full">
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
      </div>
    </div>
  );
}
