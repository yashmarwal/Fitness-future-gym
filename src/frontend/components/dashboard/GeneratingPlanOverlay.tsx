"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

const TEXT = "BUILDING YOUR PLAN";
// Matches the original Uiverse loader's own stagger cadence (~0.105s per
// letter) — see the .plan-loader-* rules in globals.css.
const LETTER_DELAY_START = 0.1;
const LETTER_DELAY_STEP = 0.105;

// generatePlan() (exerciseSplits.ts) is actually instant client-side math —
// this manufactured ~5s beat is deliberate so tapping "Generate A Fresh
// Plan" feels like something is actually being built, instead of an
// instant teleport to the result. Portal + backdrop follows the same
// pattern as StreakMilestoneCelebration/AttendanceIssuePopup.
const DISPLAY_MS = 5000;

export default function GeneratingPlanOverlay({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, DISPLAY_MS);
    return () => clearTimeout(id);
  }, [onDone]);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="plan-loader-wrapper font-display">
          <span className="plan-loader-scan" aria-hidden="true" />
          {TEXT.split("").map((char, i) => (
            <span
              key={i}
              className="plan-loader-letter"
              style={{ animationDelay: `${LETTER_DELAY_START + i * LETTER_DELAY_STEP}s` }}
            >
              {char === " " ? " " : char}
            </span>
          ))}
        </div>
        <p className="font-body text-sm text-tertiary max-w-xs">
          Building your split from your goal, experience and days per week.
        </p>
      </div>
    </div>,
    document.body
  );
}
