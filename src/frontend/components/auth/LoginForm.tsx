"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [identifier, setIdentifier] = useState("");
  const [resolvedPhone, setResolvedPhone] = useState("");
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
    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
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
    if (data.status === "not_found") {
      setError("No membership found for that phone or email. Contact the front desk.");
    } else {
      setError(data.message ?? "Something went wrong.");
    }
    return false;
  }

  async function handleRequestOtp(e: React.FormEvent) {
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
        body: JSON.stringify({ phone: resolvedPhone, code }),
      });
      const data = await res.json();
      if (data.status === "success") {
        router.push("/dashboard");
        router.refresh();
      } else if (data.status === "invalid") {
        setError("Incorrect or expired code — double-check it, or tap Resend Code below for a fresh one.");
      } else {
        setError("No membership found for that account.");
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
        Member Sign In
      </span>
      <h1 className="font-display text-headline-lg-mobile text-on-surface uppercase tracking-wide mt-2 mb-6">
        Enter The Floor
      </h1>

      {step === "phone" ? (
        <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-label text-[10px] uppercase tracking-widest text-outline">
              Phone Or Email
            </label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              placeholder="+91XXXXXXXXXX or you@example.com"
              className="bg-surface-container-low border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 shadow-hard disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Login Code"}
          </button>
          <Link href="/signup" className="text-center font-label text-xs uppercase tracking-wider text-tertiary">
            New here? Create an account
          </Link>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <p className="font-body text-sm text-tertiary">
            Enter the 6-digit code sent to your WhatsApp (and email, if you have one on file).
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
              Login Code
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              maxLength={6}
              placeholder="123456"
              className="bg-surface-container-low border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container tracking-widest"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 shadow-hard disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify & Sign In"}
          </button>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="font-label text-xs uppercase tracking-wider text-tertiary"
            >
              ← Use A Different Number
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
