// Tiny Web Audio beep generator — no audio file/asset needed, works offline.
let sharedContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedContext) sharedContext = new Ctor();
  return sharedContext;
}

export function playBeep(frequency = 880, durationMs = 150) {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + durationMs / 1000);
}

export function playTick() {
  playBeep(660, 80);
}

// A classic phone-style "brring" — two close tones alternating fast, in a
// short 3-pulse burst — instead of the old single ascending two-note chime.
// RestTimerAlarmWatcher re-calls this every 1.4s while the alarm is going,
// so one call here is one "ring" cycle, not the whole alarm; the burst
// itself finishes well inside that window, leaving a beat of silence
// between rings like an actual phone.
export function playFinish() {
  const ring = () => {
    playBeep(950, 90);
    setTimeout(() => playBeep(750, 90), 100);
  };
  ring();
  setTimeout(ring, 220);
  setTimeout(ring, 440);
}

// Vibration API — mobile only (desktop browsers just don't have the
// method), silently a no-op everywhere else. Not gated by the sound
// toggle: it's a separate, silent channel someone might specifically want
// even with sound off.
export function vibrate(pattern: number | number[]) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  navigator.vibrate(pattern);
}

export function vibrateTick() {
  vibrate(60);
}

export function vibrateFinish() {
  vibrate([200, 100, 200, 100, 400]);
}

// A distinct "something's wrong" buzz — short double-pulse, easy to tell
// apart from the single check-in success jolt ([40, 30, 90] in
// CheckInCelebration.tsx). Used by AttendanceIssuePopup for every reason
// attendance couldn't be marked (blocked, outside hours, gym closed, etc).
export function vibrateError() {
  vibrate([60, 80, 60]);
}
