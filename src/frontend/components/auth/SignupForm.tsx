"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "code">("details");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  async function requestCode(): Promise<boolean> {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, phone, email, dateOfBirth: dateOfBirth || undefined }),
    });
    const data = await res.json();
    if (data.status === "sent") {
      setDevCode(data.devCode ?? null);
      return true;
    }
    if (data.status === "already_registered") {
      setError("This number is already registered — try signing in instead.");
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
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, isSignup: true }),
      });
      const data = await res.json();
      if (data.status === "success") {
        router.push("/dashboard");
        router.refresh();
      } else if (data.status === "invalid") {
        setError("Incorrect or expired code — double-check it, or tap Resend Code below for a fresh one.");
      } else {
        setError("Something went wrong.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
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
              className="bg-surface-container-low border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container"
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
              className="bg-surface-container-low border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container"
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
              className="bg-surface-container-low border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container"
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
              className="bg-surface-container-low border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 shadow-hard disabled:opacity-60"
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
              className="bg-surface-container-low border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container tracking-widest"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 shadow-hard disabled:opacity-60"
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
