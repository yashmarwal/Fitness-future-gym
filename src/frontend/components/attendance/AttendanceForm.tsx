"use client";

import { useState } from "react";
import { useDeviceMember, saveDeviceMember } from "@/frontend/lib/deviceMember";

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
  const [draftMembershipNumber, setDraftMembershipNumber] = useState("");
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
        // Re-rendering here (via setState below) makes useDeviceMember() re-read
        // localStorage and pick up the value just saved above.
        setState({ phase: "success", name: data.member.fullName });
      } else if (data.status === "cooldown") {
        setState({ phase: "cooldown", retryAfterMinutes: data.retryAfterMinutes });
      } else if (data.status === "not_found") {
        setState({ phase: "error", message: "Membership number not found. Please check with the front desk." });
      } else if (data.status === "inactive") {
        setState({ phase: "error", message: "This membership is inactive. Please see the front desk." });
      } else if (data.status === "outside_hours") {
        setState({
          phase: "error",
          message: "The floor is closed right now. Attendance can only be marked 5:00–11:00 AM or 4:00–10:30 PM.",
        });
      } else {
        setState({ phase: "error", message: data.message ?? "Something went wrong." });
      }
    } catch {
      setState({ phase: "error", message: "Network error. Please try again." });
    }
  }

  return (
    <div className="max-w-md mx-auto px-gutter-mobile lg:px-gutter-desktop py-12">
      <span className="font-label text-xs uppercase tracking-widest text-primary-container">
        Front Desk Check-In
      </span>
      <h1 className="font-display text-headline-lg-mobile text-on-surface uppercase tracking-wide mt-2 mb-6">
        Mark Attendance
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="font-label text-[10px] uppercase tracking-widest text-outline">
            Full Name
          </label>
          <input
            value={name}
            onChange={(e) => setDraftName(e.target.value)}
            disabled={locked}
            required
            placeholder="e.g. Vikram Sharma"
            className="bg-surface-container-low border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container disabled:opacity-60"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-label text-[10px] uppercase tracking-widest text-outline">
            Membership Number
          </label>
          <input
            value={membershipNumber}
            onChange={(e) => setDraftMembershipNumber(e.target.value)}
            disabled={locked}
            required
            placeholder="e.g. FF-0421"
            className="bg-surface-container-low border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          disabled={state.phase === "submitting"}
          className="mt-2 bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 shadow-hard transition-colors disabled:opacity-60"
        >
          {state.phase === "submitting" ? "Checking In..." : "Check In"}
        </button>
      </form>

      {state.phase === "success" && (
        <p className="mt-6 font-body text-sm text-primary-container">
          Welcome, {state.name}. Attendance logged.
        </p>
      )}
      {state.phase === "cooldown" && (
        <p className="mt-6 font-body text-sm text-tertiary">
          Already checked in recently. Try again in about {state.retryAfterMinutes} minutes.
        </p>
      )}
      {state.phase === "error" && (
        <p className="mt-6 font-body text-sm text-error">{state.message}</p>
      )}
    </div>
  );
}
