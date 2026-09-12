"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function DesktopMembership() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", shift: "morning" });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Trial Section
      gsap.fromTo(
        ".mem-hero-anim",
        { y: 35, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: "power3.out" }
      );

      // Membership Tiers Cards
      const tierCards = document.querySelectorAll(".tier-card-anim");
      gsap.fromTo(
        tierCards,
        { y: 50, opacity: 0, scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.75,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".tiers-sec-anim",
            start: "top 75%",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.phone) {
      setSubmitted(true);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col w-full">
      {/* 1. 2-DAY FREE TRIAL BANNER & FORM */}
      <section className="w-full bg-surface-container-lowest px-gutter-desktop py-space-2xl border-b border-surface-variant/30">
        <div className="max-w-container-max mx-auto">
          <div className="flex flex-col lg:flex-row items-stretch gap-space-lg">
            {/* Left Box */}
            <div className="mem-hero-anim w-full lg:w-7/12 bg-surface-container-low p-space-xl border-l-4 border-primary-container relative flex flex-col justify-between shadow-2xl border border-surface-variant/40">
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-center gap-space-xs">
                  <span className="inline-block w-2.5 h-2.5 bg-primary-container animate-pulse"></span>
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
                    ZERO RISK • 48-HOUR ACCESS PASS
                  </span>
                </div>
                <h1 className="font-display-lg text-display-lg uppercase tracking-tight text-on-surface">
                  TEST THE IRON <span className="text-primary-container">BEFORE</span> COMMITTING.
                </h1>
                <p className="font-body-md text-body-md text-tertiary max-w-xl">
                  Fitness Future Gym isn&apos;t for casual screen-scrollers. Step inside our raw iron facility in Nangloi for 2 consecutive days. Experience certified Olympic barbells, calibrated cast plates, and hard-hitting conditioning rigs with zero sales pressure.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-space-sm my-space-md pt-space-sm border-t border-surface-variant/40">
                <div className="flex items-start gap-space-xs">
                  <span className="material-symbols-outlined text-primary-container text-title-md shrink-0">
                    check_box
                  </span>
                  <div className="flex flex-col">
                    <span className="font-title-sm text-title-sm uppercase text-on-surface">Full Floor Access</span>
                    <span className="font-body-sm text-body-sm text-outline">Open platforms &amp; dumbbells to 50KG+.</span>
                  </div>
                </div>
                <div className="flex items-start gap-space-xs">
                  <span className="material-symbols-outlined text-primary-container text-title-md shrink-0">
                    check_box
                  </span>
                  <div className="flex flex-col">
                    <span className="font-title-sm text-title-sm uppercase text-on-surface">Day Locker Included</span>
                    <span className="font-body-sm text-body-sm text-outline">Secure storage &amp; changing bays.</span>
                  </div>
                </div>
                <div className="flex items-start gap-space-xs">
                  <span className="material-symbols-outlined text-primary-container text-title-md shrink-0">
                    check_box
                  </span>
                  <div className="flex flex-col">
                    <span className="font-title-sm text-title-sm uppercase text-on-surface">Coach Baseline</span>
                    <span className="font-body-sm text-body-sm text-outline">15-min movement screening.</span>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container p-space-sm flex items-center justify-between gap-space-sm border border-surface-variant/30">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary-container text-title-sm">location_on</span>
                  <span className="font-label-md text-label-md uppercase text-on-surface-variant">
                    KH.NO.52, SHOP NO.5, INDER ENCLAVE, NANGLOI
                  </span>
                </div>
                <span className="font-label-sm text-label-sm uppercase text-primary-container font-bold tracking-wider">
                  NO CONTRACT REQUIRED
                </span>
              </div>
            </div>

            {/* Right Registration Form */}
            <div className="mem-hero-anim w-full lg:w-5/12 bg-surface-container p-space-xl flex flex-col justify-center border-t-2 border-primary-container shadow-hard border border-surface-variant/40">
              <div className="mb-space-md">
                <h2 className="font-title-md text-title-md uppercase tracking-wider text-on-surface flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary-container">timer</span>
                  INSTANT PASS REGISTRATION
                </h2>
                <p className="font-body-sm text-body-sm text-tertiary mt-space-2xs">
                  Your trial credentials will be generated immediately via WhatsApp.
                </p>
              </div>

              {!submitted ? (
                <form className="flex flex-col gap-space-sm" onSubmit={handleSubmit}>
                  <div>
                    <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-space-2xs">
                      Full Name
                    </label>
                    <input
                      className="w-full bg-surface-container-lowest border border-surface-variant text-on-surface px-space-md py-space-sm font-body-md focus:outline-none focus:border-primary-container rounded-none placeholder:text-outline"
                      placeholder="e.g. Vikram Sharma"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-space-2xs">
                      Phone / WhatsApp Number
                    </label>
                    <div className="flex items-stretch">
                      <span className="inline-flex items-center px-space-sm bg-surface-container-high text-outline text-label-md font-label-md border border-r-0 border-surface-variant">
                        +91
                      </span>
                      <input
                        className="w-full bg-surface-container-lowest border border-surface-variant text-on-surface px-space-md py-space-sm font-body-md focus:outline-none focus:border-primary-container rounded-none placeholder:text-outline"
                        placeholder="9876543210"
                        required
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-space-2xs">
                      Preferred Floor Shift
                    </label>
                    <div className="grid grid-cols-2 gap-space-xs">
                      <label className="cursor-pointer border border-surface-variant bg-surface-container-lowest p-space-sm flex items-center justify-between hover:border-primary-container transition-colors">
                        <div className="flex items-center gap-space-xs">
                          <input
                            type="radio"
                            name="shift"
                            value="morning"
                            checked={formData.shift === "morning"}
                            onChange={() => setFormData({ ...formData, shift: "morning" })}
                            className="accent-primary-container"
                          />
                          <span className="font-label-md text-label-md uppercase text-on-surface">Morning</span>
                        </div>
                        <span className="font-label-sm text-label-sm text-tertiary">06:00 - 11:00</span>
                      </label>
                      <label className="cursor-pointer border border-surface-variant bg-surface-container-lowest p-space-sm flex items-center justify-between hover:border-primary-container transition-colors">
                        <div className="flex items-center gap-space-xs">
                          <input
                            type="radio"
                            name="shift"
                            value="evening"
                            checked={formData.shift === "evening"}
                            onChange={() => setFormData({ ...formData, shift: "evening" })}
                            className="accent-primary-container"
                          />
                          <span className="font-label-md text-label-md uppercase text-on-surface">Evening</span>
                        </div>
                        <span className="font-label-sm text-label-sm text-tertiary">16:30 - 22:30</span>
                      </label>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="mt-space-xs w-full bg-primary-container text-on-primary-container hover:bg-secondary-container hover:text-on-secondary font-label-lg text-label-lg uppercase font-bold py-space-md tracking-wider transition-all duration-150 rounded-none shadow-hard flex items-center justify-center gap-space-xs cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span className="material-symbols-outlined text-title-md">bolt</span>
                    Book 2-Day Free Trial
                  </button>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-space-lg bg-surface-container-lowest border border-primary-container shadow-hard">
                  <span className="material-symbols-outlined text-primary-container text-headline-lg">
                    verified
                  </span>
                  <span className="font-headline-sm text-headline-sm uppercase text-on-surface mt-space-xs">
                    TRIAL PASS RESERVED
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs">
                    Show your registered phone ({formData.phone}) at front desk to claim your token.
                  </p>
                  <div className="mt-space-md p-space-xs bg-surface-container border border-surface-variant w-full text-center">
                    <span className="font-label-sm text-label-sm uppercase text-primary-container tracking-widest font-bold">
                      CODE: FF2-TRIAL-NANGLOI
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. MEMBERSHIP TIERS GRID */}
      <section className="tiers-sec-anim w-full bg-surface px-gutter-desktop py-space-3xl">
        <div className="max-w-container-max mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl border-b border-surface-variant/40 pb-space-lg">
            <div>
              <div className="flex items-center gap-space-xs mb-space-2xs">
                <span className="w-8 h-1 bg-primary-container"></span>
                <span className="font-label-md text-label-md uppercase tracking-widest text-primary-container font-bold">
                  TIER BREAKDOWN &amp; COMMITMENT
                </span>
              </div>
              <h2 className="font-headline-lg text-headline-lg uppercase text-on-surface">MEMBERSHIP TIERS</h2>
              <p className="font-body-md text-body-md text-tertiary max-w-2xl">
                Pure iron access without predatory contracts or hidden upkeep fees. Choose the duration that matches your training cycle.
              </p>
            </div>
            <div className="bg-surface-container-high border-l-2 border-primary-container p-space-sm max-w-md">
              <div className="flex items-center gap-space-xs text-primary-container">
                <span className="material-symbols-outlined text-title-sm">campaign</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">
                  PRICING POLICY NOTE
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs">
                Contact our front desk or message us on WhatsApp for ongoing seasonal offers, college student discounts, and partner registration perks.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-space-lg items-stretch">
            {/* Monthly */}
            <div className="tier-card-anim bg-surface-container-low border border-surface-variant/60 flex flex-col justify-between shadow-hard hover:border-primary-container transition-all duration-300">
              <div className="p-space-lg">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline">
                    TIER 01 • BASE CYCLE
                  </span>
                  <span className="font-label-sm text-label-sm uppercase bg-surface-container px-space-xs py-space-2xs text-tertiary">
                    30 DAYS
                  </span>
                </div>
                <h3 className="font-headline-md text-headline-md uppercase text-on-surface">MONTHLY PASS</h3>
                <p className="font-body-sm text-body-sm text-tertiary mt-space-2xs mb-space-lg">
                  Ideal for athletes seeking short-term cycles, seasonal testing, or zero long-term commitment.
                </p>
                <div className="py-space-md border-y border-surface-variant/40 mb-space-lg">
                  <span className="font-label-sm text-label-sm uppercase text-outline tracking-wider block mb-space-2xs">
                    RATE STRUCTURE
                  </span>
                  <div className="font-title-md text-title-md uppercase text-on-surface">FLEXIBLE MONTH-TO-MONTH</div>
                  <span className="font-body-sm text-body-sm text-primary-container">
                    Student concessions available
                  </span>
                </div>
                <ul className="flex flex-col gap-space-sm">
                  <li className="flex items-start gap-space-xs">
                    <span className="material-symbols-outlined text-primary-container text-title-sm shrink-0">
                      check
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface">
                      Full floor access (6 days/week)
                    </span>
                  </li>
                  <li className="flex items-start gap-space-xs">
                    <span className="material-symbols-outlined text-primary-container text-title-sm shrink-0">
                      check
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface">
                      Standard locker &amp; changing bays
                    </span>
                  </li>
                  <li className="flex items-start gap-space-xs">
                    <span className="material-symbols-outlined text-primary-container text-title-sm shrink-0">
                      check
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface">
                      General floor trainer guidance
                    </span>
                  </li>
                </ul>
              </div>
              <div className="p-space-lg pt-0">
                <a
                  href="https://wa.me/919876543210?text=Hi%20Fitness%20Future%20Gym%2C%20I%20want%20to%20inquire%20about%20Monthly%20Pass%20pricing."
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-surface-container hover:bg-surface-container-high border border-surface-variant text-on-surface font-label-md text-label-md uppercase py-space-md text-center block tracking-wider transition-colors"
                >
                  Inquire About Monthly
                </a>
              </div>
            </div>

            {/* Quarterly (Featured) */}
            <div className="tier-card-anim bg-surface-container-low border-2 border-primary-container flex flex-col justify-between relative shadow-hard-lg hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-container text-on-primary-container font-label-sm text-label-sm uppercase font-bold px-space-md py-1 tracking-widest shadow-md">
                MOST POPULAR IN NANGLOI
              </div>
              <div className="p-space-lg pt-space-xl">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container">
                    TIER 02 • HYPERTROPHY BLOCK
                  </span>
                  <span className="font-label-sm text-label-sm uppercase bg-surface-container-highest px-space-xs py-space-2xs text-on-surface">
                    90 DAYS
                  </span>
                </div>
                <h3 className="font-headline-md text-headline-md uppercase text-on-surface">QUARTERLY DISCIPLINE</h3>
                <p className="font-body-sm text-body-sm text-tertiary mt-space-2xs mb-space-lg">
                  The benchmark window to see noticeable strength jumps, body composition changes, and technical mastery.
                </p>
                <div className="py-space-md border-y border-surface-variant/40 mb-space-lg bg-surface-container/50 px-space-sm -mx-space-sm">
                  <span className="font-label-sm text-label-sm uppercase text-primary-container tracking-wider block mb-space-2xs">
                    OPTIMIZED RATE
                  </span>
                  <div className="font-title-md text-title-md uppercase text-on-surface">SUBSTANTIAL SAVINGS</div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Includes custom initial nutrition guide
                  </span>
                </div>
                <ul className="flex flex-col gap-space-sm">
                  <li className="flex items-start gap-space-xs">
                    <span className="material-symbols-outlined text-primary-container text-title-sm shrink-0">
                      check
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface font-semibold">
                      Everything in Monthly Pass
                    </span>
                  </li>
                  <li className="flex items-start gap-space-xs">
                    <span className="material-symbols-outlined text-primary-container text-title-sm shrink-0">
                      check
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface">
                      +1 Complimentary 1-on-1 PT Session
                    </span>
                  </li>
                  <li className="flex items-start gap-space-xs">
                    <span className="material-symbols-outlined text-primary-container text-title-sm shrink-0">
                      check
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface">
                      Custom macros &amp; diet blueprint
                    </span>
                  </li>
                  <li className="flex items-start gap-space-xs">
                    <span className="material-symbols-outlined text-primary-container text-title-sm shrink-0">
                      check
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface">
                      15-day membership freeze allowance
                    </span>
                  </li>
                </ul>
              </div>
              <div className="p-space-lg pt-0">
                <a
                  href="https://wa.me/919876543210?text=Hi%20Fitness%20Future%20Gym%2C%20I%20want%20to%20claim%20the%20Quarterly%20Pass."
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-primary-container hover:bg-secondary-container text-on-primary-container hover:text-on-secondary font-label-md text-label-md uppercase font-bold py-space-md text-center block tracking-wider transition-colors shadow-hard"
                >
                  Inquire About Quarterly
                </a>
              </div>
            </div>

            {/* Annual */}
            <div className="tier-card-anim bg-surface-container-low border border-surface-variant/60 flex flex-col justify-between shadow-hard hover:border-primary-container transition-all duration-300">
              <div className="p-space-lg">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline">
                    TIER 03 • IRON LIFESTYLE
                  </span>
                  <span className="font-label-sm text-label-sm uppercase bg-surface-container px-space-xs py-space-2xs text-primary-container font-bold">
                    BEST VALUE
                  </span>
                </div>
                <h3 className="font-headline-md text-headline-md uppercase text-on-surface">ANNUAL COMMITMENT</h3>
                <p className="font-body-sm text-body-sm text-tertiary mt-space-2xs mb-space-lg">
                  For lifters who have made training an unnegotiable daily lifestyle. Lowest effective daily training cost.
                </p>
                <div className="py-space-md border-y border-surface-variant/40 mb-space-lg">
                  <span className="font-label-sm text-label-sm uppercase text-outline tracking-wider block mb-space-2xs">
                    RATE STRUCTURE
                  </span>
                  <div className="font-title-md text-title-md uppercase text-on-surface">MAX DISCOUNT APPLIED</div>
                  <span className="font-body-sm text-body-sm text-tertiary font-medium">
                    Includes official gym gear starter kit
                  </span>
                </div>
                <ul className="flex flex-col gap-space-sm">
                  <li className="flex items-start gap-space-xs">
                    <span className="material-symbols-outlined text-primary-container text-title-sm shrink-0">
                      check
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface font-semibold">
                      All Monthly &amp; Quarterly perks
                    </span>
                  </li>
                  <li className="flex items-start gap-space-xs">
                    <span className="material-symbols-outlined text-primary-container text-title-sm shrink-0">
                      check
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface">
                      +4 One-on-One PT Sessions included
                    </span>
                  </li>
                  <li className="flex items-start gap-space-xs">
                    <span className="material-symbols-outlined text-primary-container text-title-sm shrink-0">
                      check
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface">
                      30-day membership freeze allowance
                    </span>
                  </li>
                </ul>
              </div>
              <div className="p-space-lg pt-0">
                <a
                  href="https://wa.me/919876543210?text=Hi%20Fitness%20Future%20Gym%2C%20I%20want%20to%20inquire%20about%20Annual%20Commitment."
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-surface-container hover:bg-surface-container-high border border-surface-variant hover:border-primary-container text-on-surface font-label-md text-label-md uppercase py-space-md text-center block tracking-wider transition-colors"
                >
                  Inquire About Annual
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
