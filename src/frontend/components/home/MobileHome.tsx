"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CoachAvatar from "@/frontend/components/CoachAvatar";
import AthleteWall from "@/frontend/components/home/AthleteWall";
import WhatsAppIcon from "@/frontend/components/icons/WhatsAppIcon";
import InstagramIcon from "@/frontend/components/icons/InstagramIcon";
import { INSTAGRAM_VAIBHAV, INSTAGRAM_HRITIK } from "@/frontend/lib/siteConfig";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function MobileHome() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero entrance
      gsap.fromTo(
        ".mobile-hero-title",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      );

      gsap.fromTo(
        ".mobile-hero-cta",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: 0.3, ease: "power2.out" }
      );

      // Scroll reveals
      const sections = document.querySelectorAll(".mobile-anim-sec");
      sections.forEach((sec) => {
        gsap.fromTo(
          sec.children,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sec,
              start: "top 85%",
            },
          }
        );
      });

      // Number Count-Up Tickers
      const counterItems = [
        { selector: ".home-count-years", target: 8, suffix: "+" },
        { selector: ".home-count-days", target: 6, suffix: "" },
        { selector: ".home-count-deadlift", target: 250, prefix: "Best Deadlift: ", suffix: "KG" },
        { selector: ".home-count-bench", target: 170, prefix: "Best Bench: ", suffix: "KG" },
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
            trigger: el,
            start: "top 85%",
          },
          onUpdate: () => {
            el.textContent = `${item.prefix || ""}${Math.floor(obj.val)}${item.suffix}`;
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col w-full bg-surface pb-16">
      {/* 1. HERO SECTION */}
      <div className="relative w-full overflow-hidden bg-surface-container-lowest">
        <div
          className="relative w-full h-[440px] bg-cover bg-center flex flex-col justify-end"
          style={{
            backgroundImage: "url('/images/mobile-hero.jpg')",
          }}
        >
          {/* Dark Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/75 to-transparent"></div>

          {/* Location Tag */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 shadow-lg border border-primary-container/30">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-container"></span>
            </span>
            <span className="font-label-sm text-[11px] text-on-surface uppercase tracking-widest font-semibold">
              EST. 2016 • RAW STRENGTH
            </span>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 px-space-md pb-space-lg flex flex-col">
            <div className="flex items-center gap-space-xs mb-space-2xs">
              <span className="material-symbols-outlined text-primary-container text-title-sm">
                local_fire_department
              </span>
              <span className="font-label-sm text-label-sm text-primary-container uppercase tracking-widest font-bold">
                NO GIMMICKS. PURE PROGRESSION.
              </span>
            </div>
            <h1 className="mobile-hero-title font-display-xl-mobile text-display-xl-mobile text-primary-container leading-none tracking-tight uppercase m-0 drop-shadow-[0_2px_10px_rgba(255,90,31,0.3)]">
              SWEAT / GAIN / REPEAT
            </h1>
            <p className="font-body-md text-body-md text-on-surface mt-space-xs mb-space-md leading-snug">
              Be stronger than your excuses. Pain today, strength tomorrow.
            </p>

            {/* CTAs */}
            <div className="mobile-hero-cta flex flex-col gap-space-xs w-full">
              <Link
                href="/membership"
                className="w-full h-12 bg-primary-container text-on-primary-container flex items-center justify-center gap-space-xs font-headline-sm text-headline-sm uppercase tracking-wider shadow-md active:scale-[0.96] active:shadow-inner transition-transform"
              >
                <span className="material-symbols-outlined text-title-md">bolt</span>
                <span>CLAIM YOUR 2-DAY FREE TRIAL</span>
              </Link>
              <Link
                href="/programs"
                className="w-full h-11 bg-surface-container-high text-on-surface flex items-center justify-center gap-space-xs font-label-lg text-label-lg uppercase tracking-wider active:bg-surface-container-highest active:scale-[0.97] transition-all border border-surface-variant/40"
              >
                <span>EXPLORE TRAINING PROGRAMS</span>
                <span className="material-symbols-outlined text-title-sm text-primary-container">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <AthleteWall />

      {/* 2. TRUST METRICS GRID */}
      <section className="mobile-anim-sec px-space-md pt-space-lg flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-primary-container tracking-widest uppercase font-bold">
              PROVEN STANDARDS
            </span>
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-wide uppercase">
              THE IRON CREDENTIALS
            </span>
          </div>
          <span className="material-symbols-outlined text-tertiary">verified</span>
        </div>

        <div className="grid grid-cols-2 gap-space-xs">
          <div className="bg-surface-container p-space-md flex flex-col justify-between shadow-sm border border-surface-variant/30">
            <div className="flex items-baseline justify-between mb-space-xs">
              <span className="home-count-years font-display-lg-mobile text-display-lg-mobile text-primary-container leading-none font-bold">
                8+
              </span>
              <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-wider">
                YEARS
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-title-sm text-title-sm text-on-surface leading-tight uppercase">
                EST. 2016
              </span>
              <span className="font-body-sm text-body-sm text-tertiary">In Nangloi &amp; Rao Vihar</span>
            </div>
          </div>

          <div className="bg-surface-container p-space-md flex flex-col justify-between shadow-sm border border-surface-variant/30">
            <div className="flex items-baseline justify-between mb-space-xs">
              <span className="font-headline-md text-headline-md text-primary-container leading-none font-bold">
                UNISEX
              </span>
              <span className="material-symbols-outlined text-tertiary text-title-sm">
                diversity_3
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-title-sm text-title-sm text-on-surface leading-tight uppercase">
                ZERO JUDGMENT
              </span>
              <span className="font-body-sm text-body-sm text-tertiary">Dedicated slots &amp; floor</span>
            </div>
          </div>

          <div className="bg-surface-container p-space-md flex flex-col justify-between shadow-sm border border-surface-variant/30">
            <div className="flex items-baseline justify-between mb-space-xs">
              <span className="font-display-lg-mobile text-display-lg-mobile text-primary-container leading-none font-bold">
                1:1
              </span>
              <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-wider">
                COACH
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-title-sm text-title-sm text-on-surface leading-tight uppercase">
                CERTIFIED PT
              </span>
              <span className="font-body-sm text-body-sm text-tertiary">Technique-first coaches</span>
            </div>
          </div>

          <div className="bg-surface-container p-space-md flex flex-col justify-between shadow-sm border border-surface-variant/30">
            <div className="flex items-baseline justify-between mb-space-xs">
              <span className="home-count-days font-display-lg-mobile text-display-lg-mobile text-primary-container leading-none font-bold">
                6
              </span>
              <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-wider">
                DAYS
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-title-sm text-title-sm text-on-surface leading-tight uppercase">
                MON – SAT
              </span>
              <span className="font-body-sm text-body-sm text-tertiary">Sunday recovery</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PHILOSOPHY BLOCK */}
      <section className="mobile-anim-sec px-space-md pt-space-xl">
        <div className="bg-surface-container-low p-space-lg flex flex-col gap-space-sm relative overflow-hidden shadow-md border border-surface-variant/40">
          <div className="flex items-center gap-space-xs">
            <span className="w-3 h-1 bg-primary-container inline-block"></span>
            <span className="font-label-sm text-label-sm text-primary-container uppercase tracking-widest font-bold">
              RAW DISCIPLINE
            </span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-wide leading-tight m-0">
            BUILT ON IRON, NOT GIMMICKS.
          </h2>
          <p className="font-body-md text-body-md text-tertiary leading-relaxed">
            We stripped away the air-conditioned illusion of boutique wellness. Fitness Future Gym is engineered for lifters who respect the barbell, heavy dumbbells, and real overload.
          </p>

          <div className="mt-space-xs pt-space-xs bg-surface-container-high/60 p-space-sm flex items-center gap-space-sm border border-surface-variant/30">
            <div className="w-10 h-10 bg-surface-container flex-shrink-0 flex items-center justify-center text-primary-container">
              <span className="material-symbols-outlined text-title-md">format_quote</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface uppercase">
                &quot;DROP THE EGO BEFORE STEPPING ON THE FLOOR.&quot;
              </span>
              <span className="font-body-sm text-body-sm text-primary-container font-semibold">
                Head Strength Coach • Fitness Future Gym
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HEAD COACHES SPOTLIGHT */}
      <section className="mobile-anim-sec px-space-md pt-space-xl flex flex-col gap-space-sm">
        <div className="flex flex-col">
          <span className="font-label-sm text-label-sm text-primary-container tracking-widest uppercase font-bold">
            DIRECTOR MASTERY
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface tracking-wide uppercase m-0">
            MEET THE COACHES
          </h2>
        </div>

        <div className="bg-surface-container-low p-space-md border border-surface-variant/40 shadow-sm flex flex-col gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <CoachAvatar src="/images/coach-vaibhav.jpg" alt="Coach Vaibhav, bodybuilding prep coach at Fitness Future Gym" name="Coach Vaibhav" sizeClass="w-12 h-12" borderClass="border-primary-container" imgSize={96} />
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
                BODYBUILDING PREP COACH &amp; FITNESS PROFESSIONAL
              </span>
              <span className="font-title-sm text-title-sm uppercase text-on-surface font-bold">COACH VAIBHAV</span>
            </div>
          </div>
          <p className="font-body-sm text-body-sm text-tertiary leading-relaxed">
            8+ years strength &amp; biomechanics. Maximal compound loading, lumbar safety protocols, competition deadlift/squat setup.
          </p>
          <span className="inline-flex items-center gap-space-2xs self-start bg-primary-container text-on-primary-container font-label-sm text-label-sm uppercase tracking-wide px-space-sm py-space-2xs font-bold">
            <span className="material-symbols-outlined text-label-lg leading-none">military_tech</span>
            IBBFF (FFBA Delhi Judge)
          </span>
          <div className="grid grid-cols-2 gap-space-2xs text-center font-label-sm text-label-sm uppercase bg-surface-container p-space-xs border border-surface-variant/30">
            <span className="text-on-surface">Best Squat: 220KG</span>
            <span className="home-count-deadlift text-primary-container font-bold">Best Deadlift: 250KG</span>
          </div>
          <div className="flex items-center flex-wrap gap-x-space-md gap-y-space-2xs">
            <a href="tel:+919643526435" className="inline-flex items-center gap-space-2xs font-label-sm text-label-sm uppercase text-primary-container">
              <span className="material-symbols-outlined text-label-lg">call</span> +91 96435 26435
            </a>
            <a href="https://wa.me/919643526435" target="_blank" rel="noreferrer" className="inline-flex items-center gap-space-2xs font-label-sm text-label-sm uppercase text-primary-container">
              <WhatsAppIcon className="w-3.5 h-3.5" /> WhatsApp
            </a>
            <a href={INSTAGRAM_VAIBHAV} target="_blank" rel="noreferrer" className="inline-flex items-center gap-space-2xs font-label-sm text-label-sm uppercase text-primary-container">
              <InstagramIcon className="w-3.5 h-3.5" /> Instagram
            </a>
          </div>
        </div>

        <div className="bg-surface-container-low p-space-md border border-surface-variant/40 shadow-sm flex flex-col gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <CoachAvatar src="/images/coach-hritik.jpg" alt="Coach Hritik, bodybuilding prep coach at Fitness Future Gym" name="Coach Hritik" sizeClass="w-12 h-12" imgSize={96} />
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
                BODYBUILDING PREP COACH &amp; FITNESS PROFESSIONAL
              </span>
              <span className="font-title-sm text-title-sm uppercase text-on-surface font-bold">COACH HRITIK</span>
            </div>
          </div>
          <p className="font-body-sm text-body-sm text-tertiary leading-relaxed">
            Hypertrophy programming, physique architecture, and custom Indian nutrition blueprints for recomposition.
          </p>
          <div className="grid grid-cols-2 gap-space-2xs text-center font-label-sm text-label-sm uppercase bg-surface-container p-space-xs border border-surface-variant/30">
            <span className="home-count-bench text-on-surface">Best Bench: 170KG</span>
            <span className="text-primary-container font-bold">70+ Athletes</span>
          </div>
          <div className="flex items-center flex-wrap gap-x-space-md gap-y-space-2xs">
            <a href="tel:+918700978341" className="inline-flex items-center gap-space-2xs font-label-sm text-label-sm uppercase text-primary-container">
              <span className="material-symbols-outlined text-label-lg">call</span> +91 87009 78341
            </a>
            <a href="https://wa.me/918700978341" target="_blank" rel="noreferrer" className="inline-flex items-center gap-space-2xs font-label-sm text-label-sm uppercase text-primary-container">
              <WhatsAppIcon className="w-3.5 h-3.5" /> WhatsApp
            </a>
            <a href={INSTAGRAM_HRITIK} target="_blank" rel="noreferrer" className="inline-flex items-center gap-space-2xs font-label-sm text-label-sm uppercase text-primary-container">
              <InstagramIcon className="w-3.5 h-3.5" /> Instagram
            </a>
          </div>
        </div>
      </section>

      {/* 5. HARDWARE & EQUIPMENT SPECS */}
      <section className="mobile-anim-sec px-space-md pt-space-xl flex flex-col gap-space-sm">
        <span className="font-label-sm text-label-sm text-primary-container tracking-widest uppercase font-bold">
          FLOOR ARSENAL SPECS
        </span>
        <div className="grid grid-cols-2 gap-space-xs font-label-sm text-label-sm uppercase">
          <div className="bg-surface-container p-space-sm border border-surface-variant/30 flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary-container text-title-sm">fitness_center</span>
            <span className="text-on-surface">Olympic Knurled Bars</span>
          </div>
          <div className="bg-surface-container p-space-sm border border-surface-variant/30 flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary-container text-title-sm">shield</span>
            <span className="text-on-surface">400KG Squat Cages</span>
          </div>
          <div className="bg-surface-container p-space-sm border border-surface-variant/30 flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary-container text-title-sm">sports_gymnastics</span>
            <span className="text-on-surface">Dumbbells To 50KG+</span>
          </div>
          <div className="bg-surface-container p-space-sm border border-surface-variant/30 flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary-container text-title-sm">view_compact</span>
            <span className="text-on-surface">Shock Rubber Bays</span>
          </div>
        </div>
      </section>

      {/* 6. CORE PROGRAMS LIST */}
      <section className="mobile-anim-sec px-space-md pt-space-xl flex flex-col gap-space-md">
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-primary-container tracking-widest uppercase font-bold">
              TRAINING SPECIALIZATIONS
            </span>
            <h2 className="font-headline-md text-headline-md text-on-surface tracking-wide uppercase m-0">
              CORE PROGRAMMING
            </h2>
          </div>
          <Link
            href="/programs"
            className="font-label-sm text-label-sm text-primary uppercase tracking-wider flex items-center gap-space-2xs"
          >
            <span>VIEW ALL</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </Link>
        </div>

        <div className="flex flex-col gap-space-md">
          {/* Card 1 */}
          <div className="bg-surface-container-low p-space-md flex flex-col gap-space-sm border border-surface-variant/40 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase text-primary-container font-bold">
                MODALITY 01
              </span>
              <span className="material-symbols-outlined text-tertiary text-title-md">
                fitness_center
              </span>
            </div>
            <h3 className="font-title-md text-title-md uppercase text-on-surface">
              Group Training
            </h3>
            <p className="font-body-sm text-body-sm text-tertiary leading-relaxed">
              Heavy compound focus, hypertrophy programming, and physique refinement for lifters chasing raw muscle.
            </p>
            <Link
              href="/programs"
              className="inline-flex items-center gap-space-2xs font-label-md text-label-md uppercase text-primary-container pt-space-2xs"
            >
              <span>EXPLORE MODALITY</span>
              <span className="material-symbols-outlined text-body-sm">arrow_forward</span>
            </Link>
          </div>

          {/* Card 2 */}
          <div className="bg-surface-container-low p-space-md flex flex-col gap-space-sm border border-surface-variant/40 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase text-primary-container font-bold">
                MODALITY 02
              </span>
              <span className="material-symbols-outlined text-primary-container text-title-md">
                person
              </span>
            </div>
            <h3 className="font-title-md text-title-md uppercase text-on-surface">
              1-on-1 Personal Training
            </h3>
            <p className="font-body-sm text-body-sm text-tertiary leading-relaxed">
              1-on-1 technique correction and plateau breaking, with dedicated mentorship on every rep.
            </p>
            <Link
              href="/programs"
              className="inline-flex items-center gap-space-2xs font-label-md text-label-md uppercase text-primary-container pt-space-2xs"
            >
              <span>EXPLORE MODALITY</span>
              <span className="material-symbols-outlined text-body-sm">arrow_forward</span>
            </Link>
          </div>

          {/* Card 3 */}
          <div className="bg-surface-container-low p-space-md flex flex-col gap-space-sm border border-surface-variant/40 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase text-primary-container font-bold">
                MODALITY 03
              </span>
              <span className="material-symbols-outlined text-tertiary text-title-md">
                restaurant
              </span>
            </div>
            <h3 className="font-title-md text-title-md uppercase text-on-surface">
              Diet Plan
            </h3>
            <p className="font-body-sm text-body-sm text-tertiary leading-relaxed">
              Macro targets and realistic diet protocols calculated directly for your training schedule.
            </p>
            <Link
              href="/programs"
              className="inline-flex items-center gap-space-2xs font-label-md text-label-md uppercase text-primary-container pt-space-2xs"
            >
              <span>EXPLORE MODALITY</span>
              <span className="material-symbols-outlined text-body-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 6b. MEMBER DASHBOARD FEATURES */}
      <section className="mobile-anim-sec pt-space-xl pb-space-xl px-space-md flex flex-col gap-space-md border-y-2 border-primary-container/60 bg-surface-container-lowest">
        <div className="flex flex-col">
          <div className="inline-flex items-center gap-space-2xs text-primary-container mb-space-xs bg-primary-container/10 border border-primary-container/40 px-space-sm py-space-2xs w-fit">
            <span className="material-symbols-outlined text-title-sm">verified</span>
            <span className="font-label-sm text-label-sm uppercase tracking-widest font-bold">
              INCLUDED FREE
            </span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface tracking-wide uppercase m-0">
            YOUR MEMBER DASHBOARD
          </h2>
          <p className="font-body-sm text-body-sm text-tertiary mt-space-2xs">
            Not just a floor pass — sign in with WhatsApp or email, no password needed, and get real training tools.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-space-xs">
          <div
            className="card-highlight-cycle col-span-2 bg-surface-container p-space-sm border border-surface-variant/30 flex flex-col gap-space-2xs"
            style={{ animationDelay: "9s" }}
          >
            <span className="material-symbols-outlined text-primary-container text-title-md">event_note</span>
            <span className="font-title-sm text-title-sm uppercase leading-tight text-on-surface">Workout Planner</span>
            <span className="font-body-sm text-body-sm text-tertiary">
              8 pre-built splits — Push/Pull/Legs, 5x5 Strength, Bro Split &amp; more — or build your own
            </span>
          </div>

          <div
            className="card-highlight-cycle bg-surface-container p-space-sm border border-surface-variant/30 flex flex-col gap-space-2xs"
            style={{ animationDelay: "0s" }}
          >
            <span className="material-symbols-outlined text-primary-container text-title-md">restaurant</span>
            <span className="font-title-sm text-title-sm uppercase text-on-surface leading-tight">
              Auto Calorie Lookup
            </span>
            <span className="font-body-sm text-body-sm text-tertiary">Type a food, macros fill in themselves</span>
          </div>

          <div
            className="card-highlight-cycle bg-surface-container p-space-sm border border-surface-variant/30 flex flex-col gap-space-2xs"
            style={{ animationDelay: "1.5s" }}
          >
            <span className="material-symbols-outlined text-primary-container text-title-md">
              local_fire_department
            </span>
            <span className="font-title-sm text-title-sm uppercase text-on-surface leading-tight">
              Streak Tracker
            </span>
            <span className="font-body-sm text-body-sm text-tertiary">Daily check-ins &amp; achievement badges</span>
          </div>

          <div
            className="card-highlight-cycle bg-surface-container p-space-sm border border-surface-variant/30 flex flex-col gap-space-2xs"
            style={{ animationDelay: "3s" }}
          >
            <span className="material-symbols-outlined text-primary-container text-title-md">qr_code_scanner</span>
            <span className="font-title-sm text-title-sm uppercase text-on-surface leading-tight">
              One-Tap Attendance
            </span>
            <span className="font-body-sm text-body-sm text-tertiary">Scan the QR code, you&apos;re checked in</span>
          </div>

          <div
            className="card-highlight-cycle bg-surface-container p-space-sm border border-surface-variant/30 flex flex-col gap-space-2xs"
            style={{ animationDelay: "4.5s" }}
          >
            <span className="material-symbols-outlined text-primary-container text-title-md">badge</span>
            <span className="font-title-sm text-title-sm uppercase text-on-surface leading-tight">
              Membership Card
            </span>
            <span className="font-body-sm text-body-sm text-tertiary">Always in your pocket, ready to scan</span>
          </div>

          <div
            className="card-highlight-cycle bg-surface-container p-space-sm border border-surface-variant/30 flex flex-col gap-space-2xs"
            style={{ animationDelay: "6s" }}
          >
            <span className="material-symbols-outlined text-primary-container text-title-md">calendar_month</span>
            <span className="font-title-sm text-title-sm uppercase text-on-surface leading-tight">
              Attendance History
            </span>
            <span className="font-body-sm text-body-sm text-tertiary">Every check-in tracked automatically</span>
          </div>

          <div
            className="card-highlight-cycle bg-surface-container p-space-sm border border-surface-variant/30 flex flex-col gap-space-2xs"
            style={{ animationDelay: "7.5s" }}
          >
            <span className="material-symbols-outlined text-primary-container text-title-md">fitness_center</span>
            <span className="font-title-sm text-title-sm uppercase text-on-surface leading-tight">Workout Log</span>
            <span className="font-body-sm text-body-sm text-tertiary">Track every set, rep &amp; weight</span>
          </div>
        </div>

        <Link
          href="/signup"
          className="w-full h-12 bg-primary-container text-on-primary-container flex items-center justify-center gap-space-xs font-headline-sm text-headline-sm uppercase tracking-wider shadow-md active:scale-[0.96] active:shadow-inner transition-transform"
        >
          <span className="material-symbols-outlined text-title-md">bolt</span>
          <span>CREATE YOUR FREE ACCOUNT</span>
        </Link>
      </section>

      {/* 8. CLOSING CTA BANNER */}
      <section className="mobile-anim-sec px-space-md pt-space-2xl">
        <div className="bg-primary-container p-space-lg flex flex-col gap-space-md shadow-md text-on-primary-container">
          <span className="font-label-sm text-label-sm uppercase tracking-widest font-bold">
            NO CONTRACT LOCKS • NO BULLSHIT
          </span>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile uppercase text-on-primary leading-tight font-normal">
            READY TO PUT IN THE WORK? JOIN FITNESS FUTURE GYM
          </h2>
          <p className="font-body-sm text-body-sm text-on-primary-fixed-variant">
            Walk onto the chalk-dusted platform in Nangloi and claim your first trial session today.
          </p>
          <Link
            href="/membership"
            className="w-full h-12 bg-surface-container-lowest text-on-surface flex items-center justify-center gap-space-xs font-headline-sm text-headline-sm uppercase tracking-wider shadow-md active:scale-[0.98] transition-transform"
          >
            <span>GET STARTED NOW</span>
            <span className="material-symbols-outlined text-title-md">arrow_forward</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
