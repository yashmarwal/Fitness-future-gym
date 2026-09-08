"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function MobileAbout() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Animation
      gsap.fromTo(
        ".mobile-about-hero",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.75, stagger: 0.12, ease: "power3.out" }
      );

      // Stats Grid Animation
      gsap.fromTo(
        ".mobile-stat-card",
        { y: 25, opacity: 0, scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".mobile-stat-sec",
            start: "top 85%",
          },
        }
      );

      // Number Count-Up Tickers
      const counterItems = [
        { selector: ".count-athletes", target: 2800, suffix: "+" },
        { selector: ".count-years", target: 8, suffix: "+" },
        { selector: ".count-unisex", target: 100, suffix: "%" },
        { selector: ".count-recruits", target: 350, suffix: "+" },
      ];

      counterItems.forEach((item) => {
        const el = containerRef.current?.querySelector(item.selector);
        if (!el) return;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: item.target,
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".mobile-stat-sec",
            start: "top 85%",
          },
          onUpdate: () => {
            el.textContent = Math.floor(obj.val).toLocaleString() + item.suffix;
          },
        });
      });

      // Dossier Section
      gsap.fromTo(
        ".mobile-dossier-anim",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".mobile-dossier-sec",
            start: "top 85%",
          },
        }
      );

      // Operating Laws
      gsap.fromTo(
        ".mobile-law-card",
        { x: -20, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".mobile-laws-sec",
            start: "top 85%",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col w-full bg-surface pb-16">
      {/* 1. HERO HEADER */}
      <section className="w-full bg-surface-container-lowest px-space-md py-space-xl border-b border-surface-variant/40">
        <div className="mobile-about-hero flex items-center gap-2 mb-space-2xs">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-container"></span>
          </span>
          <span className="font-label-sm text-label-sm text-primary-container uppercase tracking-widest font-bold">
            EST. 2016 • RAO VIHAR
          </span>
        </div>
        <h1 className="mobile-about-hero font-display-xl-mobile text-display-xl-mobile text-on-surface uppercase tracking-tight leading-none drop-shadow-sm">
          8 YEARS OF RAW DISCIPLINE IN NANGLOI
        </h1>
        <div className="mobile-about-hero w-16 h-1 bg-primary-container mt-space-xs mb-space-md"></div>
        <p className="mobile-about-hero font-body-md text-body-md text-tertiary leading-snug">
          Fitness Future Gym 2.0 was established with an unapologetic standard: zero vanity mirrors, zero hollow wellness buzzwords, and an iron floor forged for unadulterated physical grit.
        </p>

        {/* 2x2 Stats Grid */}
        <div className="mobile-stat-sec grid grid-cols-2 gap-space-xs mt-space-lg pt-space-md bg-surface-container-low p-space-md border border-surface-variant/40">
          <div className="mobile-stat-card flex flex-col">
            <span className="count-athletes font-headline-md text-headline-md text-primary-container font-bold">2,800+</span>
            <span className="font-label-sm text-label-sm uppercase text-tertiary">Athletes Molded</span>
          </div>
          <div className="mobile-stat-card flex flex-col">
            <span className="count-years font-headline-md text-headline-md text-on-surface font-bold">8+</span>
            <span className="font-label-sm text-label-sm uppercase text-tertiary">Years Operating</span>
          </div>
          <div className="mobile-stat-card flex flex-col pt-space-xs border-t border-surface-variant/30">
            <span className="count-unisex font-headline-md text-headline-md text-primary-container font-bold">100%</span>
            <span className="font-label-sm text-label-sm uppercase text-tertiary">Unisex Floor</span>
          </div>
          <div className="mobile-stat-card flex flex-col pt-space-xs border-t border-surface-variant/30">
            <span className="count-recruits font-headline-md text-headline-md text-on-surface font-bold">350+</span>
            <span className="font-label-sm text-label-sm uppercase text-tertiary">Police Recruits</span>
          </div>
        </div>
      </section>

      {/* 2. ORIGIN DOSSIER */}
      <section className="mobile-dossier-sec px-space-md py-space-xl flex flex-col gap-space-md">
        <div className="mobile-dossier-anim flex items-center gap-space-xs">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
            Origin Dossier
          </span>
          <span className="text-tertiary font-label-sm">•</span>
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-tertiary">
            Nangloi 110041
          </span>
        </div>
        <h2 className="mobile-dossier-anim font-headline-lg-mobile text-headline-lg-mobile text-on-surface uppercase tracking-wide leading-tight">
          FROM A SINGLE RACK TO NANGLOI&apos;S STRONGEST UNISEX HAVEN
        </h2>
        <div className="mobile-dossier-anim flex flex-col gap-space-sm font-body-md text-body-md text-tertiary leading-relaxed">
          <p>
            Founded 8 years ago in Rao Vihar, Nangloi, Fitness Future Gym 2.0 was built to give lifters an unpretentious sanctuary where work ethic speaks louder than trendy fitness fads.
          </p>
          <p>
            While contemporary commercial gyms chased neon decor and smoothie counters, we invested back into Olympic-standard knurling, thick rubber mats, and competition-spec barbells.
          </p>
          <p className="text-on-surface font-medium border-l-2 border-primary-container pl-space-xs">
            Today, version 2.0 stands as an expanded 5,000 sq ft unisex iron temple equipped with calibrated plates, isolated hypertrophy platforms, and zero-bullshit coaching.
          </p>
        </div>

        <div className="mobile-dossier-anim flex flex-col gap-space-xs pt-space-xs">
          <Link
            href="/membership"
            className="w-full h-12 bg-primary-container text-on-primary-container flex items-center justify-center font-label-lg text-label-lg uppercase font-bold tracking-wider shadow-md active:scale-[0.96] active:shadow-inner transition-transform"
          >
            Explore Floor Rigs
          </Link>
          <Link
            href="/programs"
            className="w-full h-11 bg-surface-container-high text-on-surface flex items-center justify-center font-label-lg text-label-lg uppercase tracking-wider border border-surface-variant/40 active:scale-[0.97] transition-transform"
          >
            Our Programs
          </Link>
        </div>
      </section>

      {/* 3. OPERATING LAWS */}
      <section className="mobile-laws-sec px-space-md py-space-xl bg-surface-container-low border-t border-surface-variant/40">
        <div className="flex flex-col text-center mb-space-lg">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
            Core Operating System
          </span>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface uppercase tracking-tight mt-space-2xs">
            SWEAT. GAIN. REPEAT.
          </h2>
          <div className="w-12 h-1 bg-primary-container mx-auto mt-space-xs"></div>
        </div>

        <div className="flex flex-col gap-space-md">
          <div className="mobile-law-card bg-surface-container p-space-md border border-surface-variant/40 shadow-sm flex flex-col gap-space-xs border-l-2 border-l-primary-container">
            <div className="flex items-center justify-between">
              <span className="font-headline-md text-headline-md text-primary-container font-bold">01</span>
              <span className="font-title-sm text-title-sm text-on-surface uppercase font-bold">SWEAT</span>
            </div>
            <p className="font-body-sm text-body-sm text-tertiary leading-relaxed">
              Show up and do the hard sets when motivation fades. Sweat is the initial physical toll exacted for transformation. Leave hesitation at the door.
            </p>
          </div>

          <div className="mobile-law-card bg-surface-container p-space-md border border-surface-variant/40 shadow-sm flex flex-col gap-space-xs border-l-2 border-l-primary-container">
            <div className="flex items-center justify-between">
              <span className="font-headline-md text-headline-md text-primary-container font-bold">02</span>
              <span className="font-title-sm text-title-sm text-on-surface uppercase font-bold">GAIN</span>
            </div>
            <p className="font-body-sm text-body-sm text-tertiary leading-relaxed">
              Incremental progressive overload, strength of mind and muscle. We engineer structural adaptation by adding 1.25kg plates systematically.
            </p>
          </div>

          <div className="mobile-law-card bg-surface-container p-space-md border border-surface-variant/40 shadow-sm flex flex-col gap-space-xs border-l-2 border-l-primary-container">
            <div className="flex items-center justify-between">
              <span className="font-headline-md text-headline-md text-primary-container font-bold">03</span>
              <span className="font-title-sm text-title-sm text-on-surface uppercase font-bold">REPEAT</span>
            </div>
            <p className="font-body-sm text-body-sm text-tertiary leading-relaxed">
              The ruthless discipline of daily consistency. True strength is constructed across months of showing up when no one is applauding.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
