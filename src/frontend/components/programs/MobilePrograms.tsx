"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function MobilePrograms() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Header
      gsap.fromTo(
        ".mobile-prog-hero",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.75, stagger: 0.12, ease: "power3.out" }
      );

      // Metric Cards
      gsap.fromTo(
        ".mobile-prog-metric",
        { scale: 0.95, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out", delay: 0.3 }
      );

      // Number Count-Up Tickers
      const counterItems = [
        { selector: ".prog-count-db", target: 50, suffix: "KG+" },
        { selector: ".prog-count-racks", target: 100, suffix: "%" },
        { selector: ".prog-count-yrs", target: 8, suffix: "+ YRS" },
      ];

      counterItems.forEach((item) => {
        const el = containerRef.current?.querySelector(item.selector);
        if (!el) return;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: item.target,
          duration: 1.4,
          ease: "power2.out",
          delay: 0.3,
          onUpdate: () => {
            el.textContent = `${Math.floor(obj.val)}${item.suffix}`;
          },
        });
      });

      // Program Modality Cards
      gsap.fromTo(
        ".mobile-prog-card",
        { y: 35, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".mobile-prog-sec",
            start: "top 85%",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col w-full bg-surface pb-16">
      {/* HEADER */}
      <section className="w-full bg-surface-container-lowest px-space-md py-space-xl border-b border-surface-variant/40">
        <div className="mobile-prog-hero flex items-center gap-2 mb-space-2xs">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-container"></span>
          </span>
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
            NANGLOI HQ • TRAINING SYSTEMS
          </span>
        </div>
        <h1 className="mobile-prog-hero font-display-xl-mobile text-display-xl-mobile text-on-surface uppercase tracking-tight leading-none drop-shadow-sm">
          ENGINEERED FOR REAL PROGRESS
        </h1>
        <p className="mobile-prog-hero font-body-md text-body-md text-tertiary mt-space-xs leading-snug">
          Targeted strength, physique, and coaching protocols built for high-stakes body transformations.
        </p>

        {/* Quick Metrics */}
        <div className="grid grid-cols-3 gap-space-2xs mt-space-md">
          <div className="mobile-prog-metric bg-surface-container-high p-space-xs flex flex-col items-center text-center border border-surface-variant/30">
            <span className="prog-count-db font-headline-sm text-headline-sm text-primary-container font-bold">50KG+</span>
            <span className="font-label-sm text-[9px] uppercase text-tertiary">Dumbbells</span>
          </div>
          <div className="mobile-prog-metric bg-surface-container-high p-space-xs flex flex-col items-center text-center border border-surface-variant/30">
            <span className="prog-count-racks font-headline-sm text-headline-sm text-on-surface font-bold">100%</span>
            <span className="font-label-sm text-[9px] uppercase text-tertiary">Iron Racks</span>
          </div>
          <div className="mobile-prog-metric bg-primary-container p-space-xs flex flex-col items-center text-center text-on-primary-container">
            <span className="prog-count-yrs font-headline-sm text-headline-sm text-on-primary-container font-bold">8+ YRS</span>
            <span className="font-label-sm text-[9px] uppercase text-on-primary-container/90 font-bold">Unbroken</span>
          </div>
        </div>
      </section>

      {/* PROGRAM CARDS */}
      <section className="mobile-prog-sec px-space-md py-space-lg flex flex-col gap-space-md">
        {/* Modality 1 */}
        <div className="mobile-prog-card bg-surface-container-low p-space-md flex flex-col gap-space-sm border border-surface-variant/40 shadow-sm relative border-l-2 border-l-primary-container">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase text-primary-container font-bold">
              MODALITY 01
            </span>
            <span className="material-symbols-outlined text-tertiary text-title-md">
              sports_gymnastics
            </span>
          </div>
          <h2 className="font-headline-sm text-headline-sm uppercase text-on-surface">
            Group Training
          </h2>
          <div className="flex items-baseline gap-space-2xs">
            <span className="font-headline-sm text-headline-sm text-primary-container font-bold">₹3,000</span>
            <span className="font-label-sm text-[10px] text-tertiary uppercase">/ Month</span>
          </div>
          <p className="font-body-sm text-body-sm text-tertiary leading-relaxed">
            Periodized volume, progressive barbell tension, and stage-ready physique mechanics. Heavy deadlift bays and steel dumbbells up to 50kg+.
          </p>
          <Link
            href="/membership"
            className="w-full h-11 bg-primary-container text-on-primary-container flex items-center justify-center font-label-md text-label-md uppercase font-bold tracking-wider mt-space-2xs shadow-md active:scale-[0.96] active:shadow-inner transition-transform"
          >
            Inquire Program Loadout
          </Link>
        </div>

        {/* Modality 2 */}
        <div className="mobile-prog-card bg-surface-container-low p-space-md flex flex-col gap-space-sm border border-surface-variant/40 shadow-sm relative border-l-2 border-l-primary-container">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase text-primary-container font-bold">
              MODALITY 02
            </span>
            <span className="material-symbols-outlined text-primary-container text-title-md">
              person
            </span>
          </div>
          <h2 className="font-headline-sm text-headline-sm uppercase text-on-surface">
            Personal Training
          </h2>
          <div className="flex items-baseline gap-space-2xs">
            <span className="font-headline-sm text-headline-sm text-primary-container font-bold">₹6,000</span>
            <span className="font-label-sm text-[10px] text-tertiary uppercase">/ Month</span>
          </div>
          <p className="font-body-sm text-body-sm text-tertiary leading-relaxed">
            Direct 1:1 floor ratio with technique audits, joint posture tracking, bi-weekly caliper measurements, and rapid strength progression.
          </p>
          <Link
            href="/location"
            className="w-full h-11 bg-primary-container text-on-primary-container flex items-center justify-center font-label-md text-label-md uppercase font-bold tracking-wider mt-space-2xs shadow-md active:scale-[0.96] active:shadow-inner transition-transform"
          >
            Book 1:1 Assessment
          </Link>
        </div>

        {/* Modality 3 */}
        <div className="mobile-prog-card bg-surface-container-low p-space-md flex flex-col gap-space-sm border border-surface-variant/40 shadow-sm relative border-l-2 border-l-primary-container">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase text-primary-container font-bold">
              MODALITY 03
            </span>
            <span className="material-symbols-outlined text-tertiary text-title-md">
              restaurant
            </span>
          </div>
          <h2 className="font-headline-sm text-headline-sm uppercase text-on-surface">
            Diet Plan
          </h2>
          <div className="flex items-baseline gap-space-2xs">
            <span className="font-headline-sm text-headline-sm text-primary-container font-bold">₹1,000</span>
            <span className="font-label-sm text-[10px] text-tertiary uppercase">/ Month</span>
          </div>
          <p className="font-body-sm text-body-sm text-tertiary leading-relaxed">
            Macros mapped directly to North Indian, vegetarian, and non-vegetarian diet staples—factoring soya, paneer, eggs, and chicken with zero fads.
          </p>
          <Link
            href="/calculator"
            className="w-full h-11 bg-surface-container-high text-on-surface flex items-center justify-center font-label-md text-label-md uppercase font-bold tracking-wider mt-space-2xs border border-surface-variant/40 active:scale-[0.97] transition-transform"
          >
            Calculate Daily Targets
          </Link>
        </div>
      </section>
    </div>
  );
}
