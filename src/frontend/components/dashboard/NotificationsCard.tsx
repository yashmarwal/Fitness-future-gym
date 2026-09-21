"use client";

import { useEffect, useState } from "react";
import { isPushSupported, subscribeToPush } from "@/frontend/lib/pushNotifications";

// AttendanceCheckInButton.tsx / AttendanceLock.tsx dispatch this on a
// genuinely fresh check-in success (not a repeat-tap "cooldown" response) —
// this card listens for it to draw attention to itself right after a
// member does something positive, rather than only nagging on page load.
export const CHECKIN_SUCCESS_EVENT = "ff-checkin-success";

type Prefs = { water: boolean; mealLog: boolean; streak: boolean; workout: boolean };
// "checking" is the only state possible during SSR (and on the client's
// first paint, before hydration) — Notification.permission genuinely can't
// be known on the server, so branching a lazy useState initializer on
// `typeof window` (the previous approach) made the server always render
// null while the client's first render immediately read the real browser
// value, a guaranteed hydration mismatch. Starting both at this one fixed,
// environment-independent value keeps first paint identical, and a mount
// effect below swaps in the real value once the client actually knows it.
type PermissionState = NotificationPermission | "unsupported" | "checking";

function ToggleSwitch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={`relative w-11 h-6 shrink-0 transition-colors ${
        checked ? "bg-primary-container" : "bg-surface-container-high border border-surface-variant/50"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-surface-container-lowest shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

const REMINDER_OPTIONS: { key: keyof Prefs; icon: string; label: string; hint: string }[] = [
  { key: "water", icon: "water_drop", label: "Water Reminders", hint: "3x a day" },
  { key: "mealLog", icon: "restaurant", label: "Meal Log Reminders", hint: "if you haven't logged today" },
  { key: "streak", icon: "local_fire_department", label: "Streak Reminders", hint: "if you haven't checked in today" },
  { key: "workout", icon: "fitness_center", label: "Workout Prompt", hint: "the moment you check in" },
];

export default function NotificationsCard({ initialPrefs }: { initialPrefs: Prefs }) {
  const [permission, setPermission] = useState<PermissionState>("checking");
  const [requesting, setRequesting] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(initialPrefs);
  const [highlighted, setHighlighted] = useState(false);

  // Reads the real, browser-only permission once mounted on the client —
  // this can only run post-hydration, so it can never disagree with what
  // the server rendered (see the PermissionState comment above). A genuine,
  // deliberate exception to the set-state-in-effect rule: unlike the
  // "derive this from already-known data" cases that rule exists to catch,
  // Notification.permission is fundamentally unreadable during SSR/first
  // paint — there's no lazy-initializer alternative that wouldn't
  // reintroduce the hydration mismatch this effect exists to avoid.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPermission(!isPushSupported() ? "unsupported" : Notification.permission);
  }, []);

  // Keep the subscription fresh in the background for a member who already
  // granted permission on a prior visit — a genuine effect (syncing an
  // external system), not deriving component state.
  useEffect(() => {
    if (permission === "granted") {
      subscribeToPush().catch(() => {});
    }
  }, [permission]);

  useEffect(() => {
    function handleCheckin() {
      if (permission !== "default") return;
      setHighlighted(true);
      const timer = setTimeout(() => setHighlighted(false), 3200);
      return () => clearTimeout(timer);
    }
    window.addEventListener(CHECKIN_SUCCESS_EVENT, handleCheckin);
    return () => window.removeEventListener(CHECKIN_SUCCESS_EVENT, handleCheckin);
  }, [permission]);

  async function handleEnable() {
    setRequesting(true);
    try {
      await subscribeToPush();
      setPermission(Notification.permission);
    } finally {
      setRequesting(false);
    }
  }

  async function togglePref(key: keyof Prefs) {
    const prevValue = prefs[key];
    const next = { ...prefs, [key]: !prevValue };
    setPrefs(next);

    const res = await fetch("/api/dashboard/notification-prefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: next[key] }),
    }).catch(() => null);

    if (!res || !res.ok) {
      setPrefs((current) => ({ ...current, [key]: prevValue }));
    }
  }

  if (permission === "unsupported" || permission === "checking") return null;

  const togglesEnabled = permission === "granted";

  return (
    <div
      className={`bg-surface-container-low border border-primary-container/40 shadow-hard p-4 mb-6 flex flex-col gap-3 ${
        highlighted ? "animate-[notif-glow_1.4s_ease-in-out_3]" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary-container text-2xl leading-none shrink-0">
          notifications_active
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-label text-xs uppercase tracking-wide text-on-surface">Notifications</p>
          <p className="font-body text-xs text-tertiary">
            {permission === "granted"
              ? "Enabled on this device."
              : permission === "denied"
                ? "Blocked — re-enable from your browser's site settings."
                : "Fee reminders, gym updates, and more — straight to your phone."}
          </p>
        </div>
        {permission === "default" && (
          <button
            onClick={handleEnable}
            disabled={requesting}
            className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-xs uppercase font-bold px-4 py-2 shadow-hard disabled:opacity-60 transition-colors shrink-0"
          >
            {requesting ? "Enabling…" : "Enable"}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-surface-variant/30">
        {REMINDER_OPTIONS.map((option) => (
          <div key={option.key} className="flex items-center gap-3">
            <span className="material-symbols-outlined text-tertiary text-lg leading-none shrink-0">{option.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-label text-[11px] uppercase tracking-wide text-on-surface">{option.label}</p>
              <p className="font-body text-[10px] text-tertiary">{option.hint}</p>
            </div>
            <ToggleSwitch
              checked={prefs[option.key]}
              onChange={() => togglePref(option.key)}
              disabled={!togglesEnabled}
              label={option.label}
            />
          </div>
        ))}
        {!togglesEnabled && (
          <p className="font-body text-[10px] text-tertiary italic">Enable notifications above to turn these on.</p>
        )}
      </div>
    </div>
  );
}
