"use client";

import { useRef, useState } from "react";
import Link from "next/link";

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
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, phone, email, address, dateOfBirth: dateOfBirth || undefined }),
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
    <div className="max-w-sm mx-auto px-gutter-mobile py-16">
      <span className="font-label text-xs uppercase tracking-widest text-primary-container">
        Join The Floor
      </span>
      <h1 className="font-display text-headline-lg-mobile text-on-surface uppercase tracking-wide mt-2 mb-6">
        Create Your Account
      </h1>

      {step === "details" ? (
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-label text-[10px] uppercase tracking-widest text-outline">
              Full Name
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="e.g. Vikram Sharma"
              className="rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-label text-[10px] uppercase tracking-widest text-outline">
              WhatsApp Number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="+91XXXXXXXXXX"
              className="rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-label text-[10px] uppercase tracking-widest text-outline">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-label text-[10px] uppercase tracking-widest text-outline">
              Address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              rows={2}
              placeholder="House no., street, area, city"
              className="rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container resize-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-label text-[10px] uppercase tracking-widest text-outline">
              Date Of Birth (Optional)
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 shadow-soft disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
          <Link href="/login" className="text-center font-label text-xs uppercase tracking-wider text-tertiary">
            Already a member? Sign in
          </Link>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <p className="font-body text-sm text-tertiary">
            Enter the 6-digit code sent to your WhatsApp and email to verify your number and finish signing in.
            Your membership number and digital card are created once you verify below.
          </p>
          <p className="font-body text-xs text-tertiary">
            Don&apos;t see it? Check your email&apos;s spam/junk folder — the code is valid for 15 minutes.
          </p>
          {devCode && (
            <p className="font-body text-xs text-primary-container">
              Dev mode (no WhatsApp configured yet) — your code is <strong>{devCode}</strong>.
            </p>
          )}
          <div className="flex flex-col gap-1">
            <label className="font-label text-[10px] uppercase tracking-widest text-outline">
              Verification Code
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              maxLength={6}
              placeholder="123456"
              className="rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container tracking-widest"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 shadow-soft disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify & Enter"}
          </button>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("details")}
              className="font-label text-xs uppercase tracking-wider text-tertiary"
            >
              ← Edit Details
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="font-label text-xs uppercase tracking-wider text-primary-container disabled:opacity-60"
            >
              {resending ? "Sending..." : "Resend Code"}
            </button>
          </div>
          {resendMessage && <p className="font-body text-xs text-primary-container">{resendMessage}</p>}
        </form>
      )}

      {error && <p className="mt-4 font-body text-sm text-error">{error}</p>}
    </div>
  );
}
