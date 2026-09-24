"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import DateOfBirthField from "@/frontend/components/auth/DateOfBirthField";
import { parseIndianDob } from "@/frontend/lib/dateOfBirth";

export default function SignupForm() {
  const [step, setStep] = useState<"details" | "code">("details");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  // The server normalizes phone formatting (see normalizePhone) and this is
  // what actually gets staged/OTP'd — must be what verify-otp submits, not
  // necessarily the exact string the user typed.
  const [resolvedPhone, setResolvedPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  // Free-typed display text (e.g. "7/9/2003"), not the API's ISO format —
  // see DateOfBirthField/dateOfBirth.ts. Re-parsed to ISO right before
  // submitting below, since the field itself only ever deals in display text.
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  // Synchronous guards, not state — two taps landing in the same JS tick
  // (common on mobile) both start before a re-render can disable the
  // button, so relying on `loading`/`resending` state alone still lets a
  // second request slip through. Separate refs since request-code and
  // verify hit different endpoints and can't usefully block each other.
  const inFlight = useRef(false);
  const verifyInFlight = useRef(false);

  async function requestCode(): Promise<boolean> {
    if (inFlight.current) return false;
    inFlight.current = true;
    try {
      return await sendCodeRequest();
    } finally {
      inFlight.current = false;
    }
  }

  async function sendCodeRequest(): Promise<boolean> {
    // The field holds free-typed display text ("7/9/2003"); the API needs
    // ISO. A non-empty value that still fails to parse here means the
    // member never blurred out of the field (e.g. tabbed straight to
    // submit) — re-parsing at submit time, not just on blur, is what
    // actually guarantees the API only ever sees a valid ISO date or none.
    const dobIso = dateOfBirth.trim() ? parseIndianDob(dateOfBirth)?.iso : undefined;
    if (dateOfBirth.trim() && !dobIso) {
      setError("Date of birth doesn't look right — try DD/MM/YYYY, e.g. 07/09/2003.");
      return false;
    }

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, phone, email, address, dateOfBirth: dobIso }),
    });
    const data = await res.json();
    if (data.status === "sent") {
      // A dedupe response (see issueOtp) omits devCode entirely rather than
      // sending a new one — keep showing whatever was already on screen
      // instead of wiping it.
      if (data.devCode) setDevCode(data.devCode);
      setResolvedPhone(data.phone);
      return true;
    }
    if (data.status === "already_registered") {
      setError("This number is already registered — try signing in instead.");
    } else if (data.status === "email_already_registered") {
      setError("This email is already registered to another account — try signing in, or use a different email.");
    } else if (data.status === "invalid_phone") {
      setError("That doesn't look like a valid phone number — double-check it.");
    } else {
      setError(data.message ?? "Something went wrong.");
    }
    return false;
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const ok = await requestCode();
      if (ok) setStep("code");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    setResendMessage(null);
    try {
      const ok = await requestCode();
      if (ok) {
        setCode("");
        setResendMessage("A new code is on its way — check your WhatsApp and email (spam folder too).");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    // A double-tap here fires two concurrent verify requests with the
    // identical code — whichever one loses the race can come back
    // "invalid" even though the code was typed correctly, since the OTP
    // gets consumed by whichever request wins. Blocking the second tap
    // synchronously (not via `loading` state, which can't react fast
    // enough) avoids that entirely.
    if (verifyInFlight.current) return;
    verifyInFlight.current = true;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: resolvedPhone, code, isSignup: true }),
      });
      const data = await res.json();
      if (data.status === "success") {
        // A genuine hard navigation, not router.push() — see LoginForm.tsx
        // for why this is deliberately the one place that bypasses
        // Next.js's client-side router, as the most reliable way to
        // confirm the new session cookie actually landed. Goes to the
        // fitness-onboarding wizard, not straight to the dashboard — every
        // completion of this form is a brand-new account, so this is the
        // one and only moment a redirect straight to it is correct (an
        // existing member logging in never passes through here).
        window.location.href = "/onboarding";
      } else if (data.status === "invalid") {
        setError("Incorrect or expired code — double-check it, or tap Resend Code below for a fresh one.");
      } else if (data.status === "email_already_registered") {
        setError("This email got claimed by someone else in the meantime — go back and use a different one.");
      } else if (data.status === "not_found") {
        setError("This signup session expired — go back and create your account again.");
      } else {
        setError("Something went wrong.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      verifyInFlight.current = false;
    }
  }

  return (
    <div className="min-h-[calc(100dvh-64px)] flex items-center justify-center px-gutter-mobile py-12">
      <div className="w-full max-w-sm bg-surface-container-low shadow-soft-lg rounded-3xl border border-surface-variant/30 p-6 sm:p-8">
        <div
          style={{ animationDelay: "0ms" }}
          className="animate-snap-in w-14 h-14 rounded-full bg-surface-container-high shadow-soft flex items-center justify-center text-primary-container mb-5"
        >
          <span className="material-symbols-outlined text-2xl leading-none">person_add</span>
        </div>
        <span
          style={{ animationDelay: "60ms" }}
          className="animate-snap-in block font-label text-xs uppercase tracking-widest text-primary-container"
        >
          Join The Floor
        </span>
        <h1
          style={{ animationDelay: "120ms" }}
          className="animate-snap-in font-display text-headline-lg-mobile text-on-surface uppercase tracking-wide mt-2 mb-6"
        >
          Create Your Account
        </h1>

        {step === "details" ? (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div style={{ animationDelay: "160ms" }} className="animate-snap-in flex flex-col gap-1">
              <label className="font-label text-[10px] uppercase tracking-widest text-outline">Full Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg leading-none pointer-events-none">
                  person
                </span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="e.g. Vikram Sharma"
                  className="w-full rounded-2xl bg-surface-container border border-surface-variant text-on-surface font-body pl-11 pr-4 py-3.5 outline-none transition-colors focus:border-primary-container"
                />
              </div>
            </div>
            <div style={{ animationDelay: "200ms" }} className="animate-snap-in flex flex-col gap-1">
              <label className="font-label text-[10px] uppercase tracking-widest text-outline">WhatsApp Number</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg leading-none pointer-events-none">
                  call
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+91XXXXXXXXXX"
                  className="w-full rounded-2xl bg-surface-container border border-surface-variant text-on-surface font-body pl-11 pr-4 py-3.5 outline-none transition-colors focus:border-primary-container"
                />
              </div>
            </div>
            <div style={{ animationDelay: "240ms" }} className="animate-snap-in flex flex-col gap-1">
              <label className="font-label text-[10px] uppercase tracking-widest text-outline">Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg leading-none pointer-events-none">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-2xl bg-surface-container border border-surface-variant text-on-surface font-body pl-11 pr-4 py-3.5 outline-none transition-colors focus:border-primary-container"
                />
              </div>
            </div>
            <div style={{ animationDelay: "280ms" }} className="animate-snap-in flex flex-col gap-1">
              <label className="font-label text-[10px] uppercase tracking-widest text-outline">Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-outline text-lg leading-none pointer-events-none">
                  home
                </span>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  rows={2}
                  placeholder="House no., street, area, city"
                  className="w-full rounded-2xl bg-surface-container border border-surface-variant text-on-surface font-body pl-11 pr-4 py-3.5 outline-none transition-colors focus:border-primary-container resize-none"
                />
              </div>
            </div>
            <div style={{ animationDelay: "320ms" }} className="animate-snap-in flex flex-col gap-1">
              <label className="font-label text-[10px] uppercase tracking-widest text-outline">Date Of Birth (Optional)</label>
              <DateOfBirthField value={dateOfBirth} onChange={setDateOfBirth} />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ animationDelay: "360ms" }}
              className="animate-snap-in rounded-2xl bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3.5 shadow-soft disabled:opacity-60 active:scale-[0.98] transition-[transform,background-color]"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
            <Link
              href="/login"
              style={{ animationDelay: "400ms" }}
              className="animate-snap-in text-center font-label text-xs uppercase tracking-wider text-tertiary hover:text-primary-container transition-colors"
            >
              Already a member? Sign in
            </Link>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <p style={{ animationDelay: "0ms" }} className="animate-snap-in font-body text-sm text-tertiary">
              Enter the 6-digit code sent to your WhatsApp and email to verify your number and finish signing in.
              Your membership number and digital card are created once you verify below.
            </p>
            <p style={{ animationDelay: "40ms" }} className="animate-snap-in font-body text-xs text-tertiary">
              Don&apos;t see it? Check your email&apos;s spam/junk folder — the code is valid for 15 minutes.
            </p>
            {devCode && (
              <p className="animate-snap-in font-body text-xs text-primary-container">
                Dev mode (no WhatsApp configured yet) — your code is <strong>{devCode}</strong>.
              </p>
            )}
            <div style={{ animationDelay: "80ms" }} className="animate-snap-in flex flex-col gap-1">
              <label className="font-label text-[10px] uppercase tracking-widest text-outline">Verification Code</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg leading-none pointer-events-none">
                  lock_open
                </span>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  maxLength={6}
                  placeholder="123456"
                  className="w-full rounded-2xl bg-surface-container border border-surface-variant text-on-surface font-body pl-11 pr-4 py-3.5 outline-none transition-colors focus:border-primary-container tracking-[0.3em]"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ animationDelay: "140ms" }}
              className="animate-snap-in rounded-2xl bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3.5 shadow-soft disabled:opacity-60 active:scale-[0.98] transition-[transform,background-color]"
            >
              {loading ? "Verifying..." : "Verify & Enter"}
            </button>
            <div style={{ animationDelay: "200ms" }} className="animate-snap-in flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep("details")}
                className="flex items-center gap-1 font-label text-xs uppercase tracking-wider text-tertiary hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-sm leading-none">arrow_back</span>
                Edit Details
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="font-label text-xs uppercase tracking-wider text-primary-container disabled:opacity-60 hover:text-secondary transition-colors"
              >
                {resending ? "Sending..." : "Resend Code"}
              </button>
            </div>
            {resendMessage && <p className="animate-snap-in font-body text-xs text-primary-container">{resendMessage}</p>}
          </form>
        )}

        {error && (
          <p className="animate-snap-in mt-4 flex items-start gap-2 rounded-xl bg-error-container/15 border border-error/30 px-4 py-3 font-body text-sm text-error">
            <span className="material-symbols-outlined text-base leading-none shrink-0 mt-0.5">warning</span>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
