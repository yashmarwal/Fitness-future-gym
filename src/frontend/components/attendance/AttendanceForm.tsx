"use client";

import { useState } from "react";
import Image from "next/image";
import { useDeviceMember, saveDeviceMember } from "@/frontend/lib/deviceMember";
import AttendanceIssuePopup from "@/frontend/components/attendance/AttendanceIssuePopup";
import { usePwaInstall } from "@/frontend/lib/usePwaInstall";
import { vibrate } from "@/frontend/lib/beep";

type SubmitState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "success"; name: string }
  | { phase: "cooldown"; retryAfterMinutes: number }
  | { phase: "error"; message: string };

export default function AttendanceForm() {
  const deviceMember = useDeviceMember();
  const locked = deviceMember !== null;

  const [draftName, setDraftName] = useState("");
  // Pre-filled, not locked — every system-generated membership number is
  // "FF-####" (see membershipNumber.ts::generateMembershipNumber), so this
  // saves almost everyone from typing it, but a member whose number was
  // ever hand-set to something irregular by an admin can still clear/edit
  // it like a normal text field.
  const [draftMembershipNumber, setDraftMembershipNumber] = useState("FF-");
  const [state, setState] = useState<SubmitState>({ phase: "idle" });

  const name = deviceMember?.name ?? draftName;
  const membershipNumber = deviceMember?.membershipNumber ?? draftMembershipNumber;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !membershipNumber.trim()) return;

    setState({ phase: "submitting" });

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipNumber: membershipNumber.trim() }),
      });
      const data = await res.json();

      if (data.status === "success") {
        saveDeviceMember({ name: name.trim(), membershipNumber: membershipNumber.trim() });
        setState({ phase: "success", name: data.member.fullName });
        vibrate([40, 30, 90]);
      } else if (data.status === "cooldown") {
        setState({ phase: "cooldown", retryAfterMinutes: data.retryAfterMinutes });
      } else if (data.status === "not_found") {
        setState({ phase: "error", message: "Membership number not found. Please check with the front desk." });
      } else if (data.status === "inactive") {
        setState({ phase: "error", message: "This membership is inactive. Please see the front desk." });
      } else if (data.status === "blocked") {
        setState({ phase: "error", message: "This membership is on hold — please see the front desk to sort out your fee." });
      } else if (data.status === "outside_hours") {
        setState({
          phase: "error",
          message: "The floor is closed right now. Attendance can only be marked 6:00 AM–12:00 PM or 4:00–10:30 PM.",
        });
      } else if (data.status === "gym_closed") {
        setState({ phase: "error", message: data.reason ?? "The gym is closed today." });
      } else {
        setState({ phase: "error", message: data.message ?? "Something went wrong." });
      }
    } catch {
      setState({ phase: "error", message: "Network error. Please try again." });
    }
  }

  return (
    <div className="w-full flex flex-col items-center gap-5">
      <div className="relative overflow-hidden card-corner-glow card-glow-border w-full max-w-md bg-surface-container-lowest border rounded-3xl shadow-soft-lg px-6 py-10 flex flex-col items-center text-center gap-6">
        <Image src="/icon-192.png" alt="" width={72} height={72} className="rounded-2xl shadow-soft" priority />

        <div>
          <span className="font-label text-xs uppercase tracking-widest text-primary-container">Front Desk Check-In</span>
          <h1 className="font-display text-3xl text-on-surface uppercase tracking-wide mt-2">Mark Attendance</h1>
        </div>

        {state.phase === "success" ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <span className="w-16 h-16 rounded-2xl flex items-center justify-center bg-primary-container/15 text-primary-container">
              <span className="material-symbols-outlined text-4xl leading-none">check_circle</span>
            </span>
            <p className="font-display text-xl text-on-surface uppercase tracking-wide">Welcome, {state.name}</p>
            <p className="font-body text-sm text-tertiary">Attendance logged — see you on the floor!</p>
          </div>
        ) : state.phase === "cooldown" ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <span className="w-16 h-16 rounded-2xl flex items-center justify-center bg-surface-container-high text-tertiary">
              <span className="material-symbols-outlined text-4xl leading-none">schedule</span>
            </span>
            <p className="font-body text-sm text-tertiary">
              Already checked in recently. Try again in about {state.retryAfterMinutes} minutes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <label className="font-label text-[10px] uppercase tracking-widest text-outline">Full Name</label>
              <input
                value={name}
                onChange={(e) => setDraftName(e.target.value)}
                disabled={locked}
                required
                placeholder="e.g. Vikram Sharma"
                className="bg-surface-container border border-surface-variant text-on-surface font-body px-4 py-3 rounded-xl outline-none focus:border-primary-container disabled:opacity-60"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label text-[10px] uppercase tracking-widest text-outline">Membership Number</label>
              <input
                value={membershipNumber}
                onChange={(e) => setDraftMembershipNumber(e.target.value)}
                disabled={locked}
                required
                placeholder="e.g. FF-0421"
                className="bg-surface-container border border-surface-variant text-on-surface font-body px-4 py-3 rounded-xl outline-none focus:border-primary-container disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={state.phase === "submitting"}
              className="mt-2 bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3.5 rounded-xl shadow-soft transition-colors disabled:opacity-60 active:scale-[0.99]"
            >
              {state.phase === "submitting" ? "Checking In..." : "Check In"}
            </button>
          </form>
        )}
      </div>

      <DownloadAppSection />

      {state.phase === "error" && (
        <AttendanceIssuePopup message={state.message} onDismiss={() => setState({ phase: "idle" })} />
      )}
    </div>
  );
}

// Permanent, not dismissible — unlike the site-wide PwaInstallPrompt banner
// (which a "Not Now" tap hides forever), this is meant to sit on the one
// page every member and prospective member hits on every single gym visit
// (the QR poster points here), so it reappears every time rather than
// being tapped away once and never seen again. Hidden when there's genuinely
// nothing to offer — already installed (standalone), or a browser with
// neither the programmatic install prompt nor the iOS share-sheet path.
function DownloadAppSection() {
  const { installEvent, showIosInstructions, promptInstall } = usePwaInstall();

  if (!installEvent && !showIosInstructions) return null;

  return (
    <div className="w-full max-w-md bg-surface-container-low border border-primary-container/30 rounded-2xl shadow-soft px-5 py-4 flex items-center gap-4">
      <span className="w-11 h-11 rounded-xl flex items-center justify-center bg-primary-container/15 text-primary-container shrink-0">
        <span className="material-symbols-outlined text-xl leading-none">smartphone</span>
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-label text-xs uppercase tracking-wide text-on-surface">Get The Fitness Future App</p>
        <p className="font-body text-xs text-tertiary mt-0.5">Compete for gym records, keep your streak alive, never miss a PR.</p>
      </div>
      {installEvent ? (
        <button
          onClick={promptInstall}
          className="shrink-0 rounded-xl bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-[10px] uppercase font-bold px-4 py-2.5 transition-colors"
        >
          Install
        </button>
      ) : (
        <span className="shrink-0 flex items-center gap-1 font-label text-[9px] uppercase text-tertiary text-right">
          Tap <span className="material-symbols-outlined text-sm leading-none text-primary-container">ios_share</span> → Add
        </span>
      )}
    </div>
  );
}
