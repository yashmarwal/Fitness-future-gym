"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTrialClaim, saveTrialClaim } from "@/frontend/lib/trialClaim";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function MobileMembership() {
  const deviceClaim = useTrialClaim();
  const [submitted, setSubmitted] = useState<{ phone: string; trialCode: string; endsAt: string } | null>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", shift: "morning" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Trial Hero entrance
      gsap.fromTo(
        ".mobile-mem-hero",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.75, stagger: 0.12, ease: "power3.out" }
      );

      // Form entrance
      gsap.fromTo(
        ".mobile-mem-form",
        { y: 25, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "power2.out", delay: 0.3 }
      );

      // Tier Cards stagger reveal
      gsap.fromTo(
        ".mobile-tier-card",
        { y: 35, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".mobile-tiers-sec",
            start: "top 85%",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/trial/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.name,
          phone: formData.phone,
          email: formData.email,
          shift: formData.shift,
        }),
      });
      const data = await res.json();
      if (data.status === "claimed") {
        saveTrialClaim({ phone: formData.phone, trialCode: data.trialCode, endsAt: data.endsAt });
        setSubmitted({ phone: formData.phone, trialCode: data.trialCode, endsAt: data.endsAt });
      } else if (data.status === "already_claimed") {
        setError("This phone number has already claimed a free trial — one per member, for life.");
      } else {
        setError(data.message ?? "Something went wrong.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col w-full bg-surface pb-16">
      {/* 1. TRIAL PASS SECTION */}
      <section className="w-full bg-surface-container-lowest px-space-md py-space-xl border-b border-surface-variant/40">
        <div className="mobile-mem-hero flex items-center gap-2 mb-space-2xs">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-container"></span>
          </span>
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
            ZERO RISK • 48-HOUR ACCESS
          </span>
        </div>
        <h1 className="mobile-mem-hero font-display-xl-mobile text-display-xl-mobile text-on-surface uppercase tracking-tight leading-none drop-shadow-sm">
          TEST THE IRON BEFORE COMMITTING.
        </h1>
        <p className="mobile-mem-hero font-body-md text-body-md text-tertiary mt-space-xs leading-snug">
          Step inside our raw iron facility in Nangloi for 2 consecutive days. Certified Olympic barbells &amp; calibrated plates.
        </p>

        {/* Registration Form */}
        <div className="mobile-mem-form mt-space-lg bg-surface-container p-space-md rounded-2xl border-t-2 border-primary-container border border-surface-variant/40 shadow-md">
          <h2 className="font-title-sm text-title-sm uppercase tracking-wider text-on-surface flex items-center gap-space-xs mb-space-xs">
            <span className="material-symbols-outlined text-primary-container">timer</span>
            INSTANT PASS REGISTRATION
          </h2>

          {!(submitted ?? deviceClaim) ? (
            <form className="flex flex-col gap-space-sm" onSubmit={handleSubmit}>
              <div>
                <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-space-2xs">
                  Full Name
                </label>
                <input
                  className="w-full bg-surface-container-lowest border border-surface-variant text-on-surface px-space-md py-space-xs font-body-md focus:outline-none focus:border-primary-container rounded-xl"
                  placeholder="e.g. Vikram Sharma"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-space-2xs">
                  WhatsApp Number
                </label>
                <input
                  className="w-full bg-surface-container-lowest border border-surface-variant text-on-surface px-space-md py-space-xs font-body-md focus:outline-none focus:border-primary-container rounded-xl"
                  placeholder="8700978341"
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-space-2xs">
                  Email
                </label>
                <input
                  className="w-full bg-surface-container-lowest border border-surface-variant text-on-surface px-space-md py-space-xs font-body-md focus:outline-none focus:border-primary-container rounded-xl"
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-space-2xs">
                  Preferred Floor Shift
                </label>
                <div className="grid grid-cols-2 gap-space-xs">
                  <label className="cursor-pointer border border-surface-variant bg-surface-container-lowest p-space-xs rounded-lg flex items-center justify-between">
                    <span className="flex items-center gap-space-2xs">
                      <input
                        type="radio"
                        name="shift"
                        value="morning"
                        checked={formData.shift === "morning"}
                        onChange={() => setFormData({ ...formData, shift: "morning" })}
                        className="accent-primary-container"
                      />
                      <span className="font-label-sm text-label-sm uppercase text-on-surface">Morning</span>
                    </span>
                  </label>
                  <label className="cursor-pointer border border-surface-variant bg-surface-container-lowest p-space-xs rounded-lg flex items-center justify-between">
                    <span className="flex items-center gap-space-2xs">
                      <input
                        type="radio"
                        name="shift"
                        value="evening"
                        checked={formData.shift === "evening"}
                        onChange={() => setFormData({ ...formData, shift: "evening" })}
                        className="accent-primary-container"
                      />
                      <span className="font-label-sm text-label-sm uppercase text-on-surface">Evening</span>
                    </span>
                  </label>
                </div>
              </div>
              {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="mt-space-2xs w-full bg-primary-container text-on-primary-container font-label-lg text-label-lg uppercase font-bold py-space-md rounded-xl tracking-wider flex items-center justify-center gap-space-xs shadow-md active:scale-[0.96] active:shadow-inner transition-transform cursor-pointer disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-title-md">bolt</span>
                {loading ? "Booking..." : "Book 2-Day Free Trial"}
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-space-md bg-surface-container-lowest border border-primary-container rounded-2xl">
              <span className="material-symbols-outlined text-primary-container text-headline-md animate-bounce">
                verified
              </span>
              <span className="font-title-md text-title-md uppercase text-on-surface mt-space-xs">
                TRIAL PASS RESERVED
              </span>
              <p className="font-body-sm text-body-sm text-tertiary mt-space-2xs">
                Show registered phone ({(submitted ?? deviceClaim)!.phone}) at front desk. Your pass was also
                emailed to you.
              </p>
              <div className="mt-space-sm p-space-xs bg-surface-container border border-surface-variant rounded-lg w-full text-center">
                <span className="font-label-sm text-label-sm uppercase text-primary-container tracking-widest font-bold">
                  CODE: {(submitted ?? deviceClaim)!.trialCode}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-tertiary mt-space-2xs">
                Valid through {(submitted ?? deviceClaim)!.endsAt}.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 2. TIERS LIST */}
      <section className="mobile-tiers-sec px-space-md py-space-xl flex flex-col gap-space-md">
        <div className="flex flex-col">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
            COMMITMENT TIERS
          </span>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface uppercase">
            MEMBERSHIP PASSES
          </h2>
        </div>

        {/* Monthly */}
        <div className="mobile-tier-card bg-surface-container-low p-space-md rounded-2xl border border-surface-variant/40 flex flex-col gap-space-xs shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline">
              TIER 01 • 30 DAYS
            </span>
            <span className="font-label-sm text-label-sm uppercase text-primary-container font-bold">BASE</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm uppercase text-on-surface">MONTHLY PASS</h3>
          <p className="font-body-sm text-body-sm text-tertiary leading-relaxed">
            Full floor access 6 days/week. Standard locker &amp; floor trainer guidance.
          </p>
          <a
            href="https://wa.me/918700978341?text=Hi%20Fitness%20Future%20Gym%2C%20I%20want%20to%20inquire%20about%20Monthly%20Pass."
            target="_blank"
            rel="noreferrer"
            className="w-full h-11 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center font-label-md text-label-md uppercase tracking-wider border border-surface-variant/40 mt-space-2xs active:scale-[0.97] transition-transform"
          >
            Inquire Monthly Pass
          </a>
        </div>

        {/* Quarterly */}
        <div className="mobile-tier-card bg-surface-container-low p-space-md rounded-2xl border-2 border-primary-container flex flex-col gap-space-xs shadow-md">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
              TIER 02 • 90 DAYS
            </span>
            <span className="font-label-sm text-label-sm uppercase bg-primary-container text-on-primary-container font-bold px-1.5 py-0.5 rounded-full">
              POPULAR
            </span>
          </div>
          <h3 className="font-headline-sm text-headline-sm uppercase text-on-surface">QUARTERLY DISCIPLINE</h3>
          <p className="font-body-sm text-body-sm text-tertiary leading-relaxed">
            Includes custom nutrition guide + 1 complimentary 1-on-1 PT Session and 15-day freeze allowance.
          </p>
          <a
            href="https://wa.me/918700978341?text=Hi%20Fitness%20Future%20Gym%2C%20I%20want%20to%20inquire%20about%20Quarterly%20Pass."
            target="_blank"
            rel="noreferrer"
            className="w-full h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center font-label-lg text-label-lg uppercase font-bold tracking-wider mt-space-2xs shadow-md active:scale-[0.96] active:shadow-inner transition-transform"
          >
            Inquire Quarterly Pass
          </a>
        </div>

        {/* Annual */}
        <div className="mobile-tier-card bg-surface-container-low p-space-md rounded-2xl border border-surface-variant/40 flex flex-col gap-space-xs shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline">
              TIER 03 • 365 DAYS
            </span>
            <span className="font-label-sm text-label-sm uppercase text-primary-container font-bold">BEST VALUE</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm uppercase text-on-surface">ANNUAL COMMITMENT</h3>
          <p className="font-body-sm text-body-sm text-tertiary leading-relaxed">
            Lowest daily training cost + 4 1-on-1 PT Sessions + official gym starter kit.
          </p>
          <a
            href="https://wa.me/918700978341?text=Hi%20Fitness%20Future%20Gym%2C%20I%20want%20to%20inquire%20about%20Annual%20Pass."
            target="_blank"
            rel="noreferrer"
            className="w-full h-11 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center font-label-md text-label-md uppercase tracking-wider border border-surface-variant/40 mt-space-2xs active:scale-[0.97] transition-transform"
          >
            Inquire Annual Pass
          </a>
        </div>
      </section>
    </div>
  );
}
