"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.status === "sent") {
        setDevCode(data.devCode ?? null);
        setStep("code");
      } else if (data.status === "not_found") {
        setError("No membership found for this number. Contact the front desk.");
      } else {
        setError(data.message ?? "Something went wrong.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
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
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (data.status === "success") {
        router.push("/dashboard");
        router.refresh();
      } else if (data.status === "invalid") {
        setError("Incorrect or expired code.");
      } else {
        setError("No membership found for this number.");
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
        Member Sign In
      </span>
      <h1 className="font-display text-headline-lg-mobile text-on-surface uppercase tracking-wide mt-2 mb-6">
        Enter The Floor
      </h1>

      {step === "phone" ? (
        <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
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
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 shadow-hard disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Login Code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <p className="font-body text-sm text-tertiary">
            Enter the 6-digit code sent to your WhatsApp.
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
          <button
            type="button"
            onClick={() => setStep("phone")}
            className="font-label text-xs uppercase tracking-wider text-tertiary"
          >
            ← Use a different number
          </button>
        </form>
      )}

      {error && <p className="mt-4 font-body text-sm text-error">{error}</p>}
    </div>
  );
}
