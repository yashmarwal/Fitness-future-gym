"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
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

export default function DesktopHome() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLDivElement>(null);
  const heroBadgeRef = useRef<HTMLDivElement>(null);
  const heroCtaRef = useRef<HTMLDivElement>(null);
  const heroCardRef = useRef<HTMLDivElement>(null);
  const trustBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. HERO ANIMATIONS
      const heroTl = gsap.timeline({ defaults: { ease: "power4.out", duration: 1 } });

      if (heroBadgeRef.current) {
        heroTl.fromTo(
          heroBadgeRef.current,
          { y: -30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7 }
        );
      }

      if (heroTitleRef.current) {
        const titleSpans = heroTitleRef.current.querySelectorAll(".hero-text-line");
        heroTl.fromTo(
          titleSpans,
          { y: 70, opacity: 0, skewY: 4 },
          { y: 0, opacity: 1, skewY: 0, duration: 0.85, stagger: 0.14 },
          "-=0.4"
        );
      }

      if (heroCtaRef.current) {
        heroTl.fromTo(
          heroCtaRef.current.children,
          { y: 25, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 },
          "-=0.4"
        );
      }

      if (heroCardRef.current) {
        heroTl.fromTo(
          heroCardRef.current,
          { x: 50, opacity: 0, scale: 0.95 },
          { x: 0, opacity: 1, scale: 1, duration: 0.9 },
          "-=0.7"
        );
      }

      // 2. TRUST STRIP ANIMATION
      if (trustBarRef.current) {
        gsap.fromTo(
          trustBarRef.current.querySelectorAll(".trust-item"),
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: {
              trigger: trustBarRef.current,
              start: "top 85%",
            },
          }
        );
      }

      // 3. RAW PHILOSOPHY SECTION
      const philosophySec = document.querySelector(".philosophy-sec");
      if (philosophySec) {
        gsap.fromTo(
          philosophySec.querySelectorAll(".philo-anim"),
          { y: 45, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: philosophySec,
              start: "top 75%",
            },
          }
        );

        const orangeBar = philosophySec.querySelector(".orange-accent-line");
        if (orangeBar) {
          gsap.fromTo(
            orangeBar,
            { scaleY: 0 },
            {
              scaleY: 1,
              duration: 1,
              ease: "power3.inOut",
              scrollTrigger: {
                trigger: philosophySec,
                start: "top 70%",
              },
            }
          );
        }
      }

      // 4. COACHES DOSSIER ANIMATION
      const coachesSec = document.querySelector(".coaches-sec");
      if (coachesSec) {
        const coachCards = coachesSec.querySelectorAll(".coach-card");
        gsap.fromTo(
          coachCards,
          { y: 60, opacity: 0, scale: 0.96 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.85,
            stagger: 0.2,
            ease: "back.out(1.4)",
            scrollTrigger: {
              trigger: coachesSec,
              start: "top 75%",
            },
          }
        );
      }

      // 5. HARDWARE ARSENAL ANIMATION
      const hardwareSec = document.querySelector(".hardware-sec");
      if (hardwareSec) {
        gsap.fromTo(
          hardwareSec.querySelectorAll(".hw-card"),
          { y: 40, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.65,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: hardwareSec,
              start: "top 80%",
            },
          }
        );
      }

      // 6. PROGRAMS CARDS STAGGER
      const programsSec = document.querySelector(".programs-sec");
      if (programsSec) {
        gsap.fromTo(
          programsSec.querySelectorAll(".prog-card"),
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.75,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: programsSec,
              start: "top 75%",
            },
          }
        );
      }

      // 6b. MEMBER DASHBOARD FEATURES STAGGER
      const dashboardSec = document.querySelector(".dashboard-sec");
      if (dashboardSec) {
        gsap.fromTo(
          dashboardSec.querySelectorAll(".dash-card"),
          { y: 40, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.65,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: dashboardSec,
              start: "top 80%",
            },
          }
        );
      }

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col w-full">
      {/* 1. HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-background min-h-[90vh] flex flex-col justify-center">
        {/* Atmospheric Background Image with Cast-Iron Overlays */}
        <div className="absolute inset-0 z-0">
          <Image
            alt="Raw Iron Gym Training"
            src="/images/desktop-hero.jpg"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-70 brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent"></div>
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-container-max mx-auto px-gutter-desktop pt-space-2xl pb-space-3xl flex flex-col justify-end w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-end">
            <div className="lg:col-span-8 flex flex-col">
              {/* Industrial Badge */}
              <div ref={heroBadgeRef} className="inline-flex items-center gap-space-xs bg-surface-container-low px-space-sm py-space-2xs w-fit mb-space-md border border-surface-variant/40 shadow-sm rounded-full">
                <span className="w-2.5 h-2.5 bg-primary-container inline-block animate-pulse"></span>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant font-bold">
                  ⚡ RAW IRON CULTURE • EST. 2016 • HEAVYWEIGHT STRENGTH TEMPLE
                </span>
              </div>

              {/* Oversized Condensed Stacking — an <h1>, not a <div>: this is
                  the page's actual main heading (MobileHome.tsx's equivalent
                  headline already uses <h1>; this desktop variant previously
                  didn't, so the page had no semantic h1 at all on wide
                  viewports). Same className/children, GSAP still only
                  targets the child .hero-text-line spans, so this is a pure
                  tag swap with no visual/animation change. */}
              <h1 ref={heroTitleRef} className="flex flex-col select-none leading-none tracking-tight overflow-hidden m-0 font-normal">
                <span className="hero-text-line font-display-xl text-[105px] leading-[96px] uppercase text-on-surface m-0 p-0 font-normal block">
                  SWEAT
                </span>
                <span className="hero-text-line font-display-xl text-[105px] leading-[96px] uppercase text-primary-container m-0 p-0 font-normal block drop-shadow-[0_4px_16px_rgba(255,90,31,0.3)]">
                  GAIN
                </span>
                <span className="hero-text-line font-display-xl text-[105px] leading-[96px] uppercase text-on-surface m-0 p-0 font-normal block">
                  REPEAT
                </span>
              </h1>

              {/* Subheadline */}
              <p className="font-body-lg text-body-lg text-tertiary-fixed max-w-xl mt-space-lg mb-space-xl uppercase tracking-wide">
                Be stronger than your excuses. Pain today, strength tomorrow. Raw iron culture built for lifters in Nangloi.
              </p>

              {/* Action Buttons */}
              <div ref={heroCtaRef} className="flex flex-wrap items-center gap-space-md">
                <Link
                  href="/membership"
                  className="group inline-flex items-center justify-center gap-space-xs bg-primary-container hover:bg-secondary-container text-on-primary-container font-title-sm text-title-sm uppercase px-space-xl py-space-md shadow-soft rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Claim Your 2-Day Free Trial</span>
                  <span className="material-symbols-outlined text-title-md transition-transform group-hover:translate-x-1">arrow_forward</span>
                </Link>
                <Link
                  href="/programs"
                  className="inline-flex items-center justify-center bg-surface-container-low hover:bg-surface-container text-on-surface hover:text-primary-container font-title-sm text-title-sm uppercase px-space-xl py-space-md rounded-xl transition-all duration-200 hover:border-primary-container border border-surface-variant/40"
                >
                  Explore Programs
                </Link>
                <Link
                  href="/location"
                  className="inline-flex items-center justify-center bg-surface-container-high/60 hover:bg-surface-container-high text-tertiary-fixed hover:text-on-surface font-title-sm text-title-sm uppercase px-space-lg py-space-md rounded-xl transition-colors border border-surface-variant/30"
                >
                  <span className="material-symbols-outlined text-title-sm mr-space-2xs">location_on</span>
                  Location &amp; Timings
                </Link>
              </div>
            </div>

            {/* Right Metric Highlight Cards */}
            <div ref={heroCardRef} className="lg:col-span-4 flex flex-col gap-space-md mt-space-xl lg:mt-0">
              <div className="bg-surface-container-low p-space-lg rounded-2xl shadow-soft relative border border-surface-variant/40 group hover:border-primary-container transition-colors duration-300">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-primary-container"></div>
                <div className="flex items-baseline justify-between mb-space-xs">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline">
                    FLOOR DEADLIFT RECORD
                  </span>
                  <span className="font-label-md text-label-md text-primary-container font-bold tracking-widest">
                    RAW IRON
                  </span>
                </div>
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-display-lg text-display-lg font-normal text-on-surface leading-none group-hover:text-primary-container transition-colors">
                    280
                  </span>
                  <span className="font-title-md text-title-md text-tertiary uppercase">KG</span>
                </div>
                <p className="font-body-sm text-body-sm text-tertiary mt-space-sm pt-space-xs">
                  Olympic platform calibrated iron plates. High friction knurl bars only.
                </p>
              </div>

              <div className="bg-surface-container-low p-space-md rounded-2xl shadow-soft border border-surface-variant/40 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase text-outline">WEEKLY TONNAGE MOVED</span>
                  <span className="font-headline-sm text-headline-sm text-primary-container font-mono">142,850 KG</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="font-label-sm text-label-sm uppercase text-outline">ACTIVE LIFTERS</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-mono">350+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AthleteWall />

      {/* 2. QUIET TRUST STRIP */}
      <section ref={trustBarRef} className="w-full bg-surface-container-lowest border-y border-surface-variant/40">
        <div className="max-w-container-max mx-auto px-gutter-desktop">
          <div className="grid grid-cols-2 md:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-surface-variant/40">
            <div className="trust-item py-space-lg px-space-md flex flex-col gap-space-2xs">
              <div className="flex items-center gap-space-xs">
                <span className="w-1.5 h-1.5 bg-primary-container shrink-0"></span>
                <span className="font-headline-md text-headline-md text-on-surface">8+ YEARS</span>
              </div>
              <span className="font-label-md text-label-md text-tertiary uppercase tracking-wider">
                In Nangloi &amp; Rao Vihar
              </span>
            </div>

            <div className="trust-item py-space-lg px-space-md flex flex-col gap-space-2xs">
              <div className="flex items-center gap-space-xs">
                <span className="w-1.5 h-1.5 bg-primary-container shrink-0"></span>
                <span className="font-headline-md text-headline-md text-on-surface">UNISEX</span>
              </div>
              <span className="font-label-md text-label-md text-tertiary uppercase tracking-wider">
                Zero Judgment Floor
              </span>
            </div>

            <div className="trust-item py-space-lg px-space-md flex flex-col gap-space-2xs">
              <div className="flex items-center gap-space-xs">
                <span className="w-1.5 h-1.5 bg-primary-container shrink-0"></span>
                <span className="font-headline-md text-headline-md text-on-surface">COACHED</span>
              </div>
              <span className="font-label-md text-label-md text-tertiary uppercase tracking-wider">
                By Vaibhav &amp; Hritik
              </span>
            </div>

            <div className="trust-item py-space-lg px-space-md flex flex-col gap-space-2xs">
              <div className="flex items-center gap-space-xs">
                <span className="w-1.5 h-1.5 bg-primary-container shrink-0"></span>
                <span className="font-headline-md text-headline-md text-on-surface">400KG</span>
              </div>
              <span className="font-label-md text-label-md text-tertiary uppercase tracking-wider">
                Rated Squat Cages
              </span>
            </div>

            <div className="trust-item py-space-lg px-space-md flex flex-col gap-space-2xs">
              <div className="flex items-center gap-space-xs">
                <span className="w-1.5 h-1.5 bg-primary-container shrink-0"></span>
                <span className="font-headline-md text-headline-md text-on-surface">50KG+</span>
              </div>
              <span className="font-label-md text-label-md text-tertiary uppercase tracking-wider">
                Dumbbell Rack Tier
              </span>
            </div>

            <div className="trust-item py-space-lg px-space-md flex flex-col gap-space-2xs">
              <div className="flex items-center gap-space-xs">
                <span className="w-1.5 h-1.5 bg-primary-container shrink-0"></span>
                <span className="font-headline-md text-headline-md text-on-surface">6 DAYS</span>
              </div>
              <span className="font-label-md text-label-md text-tertiary uppercase tracking-wider">
                Mon–Sat Operations
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. RAW INTRO SECTION */}
      <section className="philosophy-sec w-full bg-surface py-space-3xl">
        <div className="max-w-container-max mx-auto px-gutter-desktop">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
            <div className="lg:col-span-7 flex flex-col gap-space-md">
              <div className="philo-anim flex items-center gap-space-xs text-primary-container">
                <span className="material-symbols-outlined text-title-md">fitness_center</span>
                <span className="font-label-md text-label-md uppercase tracking-widest font-bold">
                  RAW PHILOSOPHY
                </span>
              </div>
              <h2 className="philo-anim font-headline-lg text-headline-lg uppercase text-on-surface tracking-wide">
                BUILT ON IRON, <span className="text-primary-container">NOT GIMMICKS.</span>
              </h2>
              <div className="philo-anim bg-surface-container-low p-space-xl rounded-2xl relative shadow-soft border border-surface-variant/40">
                <div className="orange-accent-line absolute left-0 top-0 bottom-0 w-1 bg-primary-container origin-top"></div>
                <p className="font-body-lg text-body-lg text-on-surface font-light leading-relaxed">
                  Authentic training ground serving Rao Vihar &amp; Nangloi community for nearly a decade. No fluff, no pastel spa amenities—just serious iron, heavyweight bars, calibrated dumbbells, and experienced coaching for lifters who show up.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md pt-space-sm">
                <div className="philo-anim bg-surface-container p-space-md rounded-xl flex items-start gap-space-sm border border-surface-variant/30 hover:border-primary-container transition-colors">
                  <span className="material-symbols-outlined text-primary-container text-headline-sm">
                    precision_manufacturing
                  </span>
                  <div>
                    <h4 className="font-title-sm text-title-sm uppercase text-on-surface">
                      Heavyweight Calibrated Racks
                    </h4>
                    <p className="font-body-sm text-body-sm text-tertiary mt-space-2xs">
                      Rated for 400kg+ squat and bench pressing with fail-safe safety pins.
                    </p>
                  </div>
                </div>

                <div className="philo-anim bg-surface-container p-space-md rounded-xl flex items-start gap-space-sm border border-surface-variant/30 hover:border-primary-container transition-colors">
                  <span className="material-symbols-outlined text-primary-container text-headline-sm">
                    sports_kabaddi
                  </span>
                  <div>
                    <h4 className="font-title-sm text-title-sm uppercase text-on-surface">
                      Desi Conditioning Ethos
                    </h4>
                    <p className="font-body-sm text-body-sm text-tertiary mt-space-2xs">
                      Raw stamina, grip strength protocols, and explosive functional output.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative flex flex-col gap-space-md">
              <div className="philo-anim relative w-full h-[400px] overflow-hidden rounded-2xl bg-surface-container-low shadow-soft-lg border border-surface-variant/40 group">
                <Image
                  alt="Atmospheric gym environment"
                  src="/images/gym-facility.jpg"
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover filter contrast-125 brightness-90 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute bottom-0 left-0 right-0 p-space-md bg-gradient-to-t from-background via-background/80 to-transparent">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container">
                    FACILITY PLATFORM #1
                  </span>
                  <p className="font-title-sm text-title-sm text-on-surface uppercase">
                    MAIN DEADLIFT CORRIDOR
                  </p>
                </div>
              </div>

              <div className="philo-anim bg-surface-container-low p-space-md rounded-xl flex items-center justify-between border border-surface-variant/40">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase text-tertiary">
                    Weekly Tonnage Moved
                  </span>
                  <span className="font-headline-sm text-headline-sm text-primary-container">
                    142,850 KG
                  </span>
                </div>
                <div className="w-32">
                  <div className="h-2 w-full bg-surface-container">
                    <div className="h-2 bg-primary-container" style={{ width: "88%" }}></div>
                  </div>
                  <span className="font-label-sm text-label-sm text-outline mt-1 block text-right">
                    88% PEAK CAPACITY
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MEET THE HEAD COACHES (VAIBHAV & HRITIK) */}
      <section className="coaches-sec w-full bg-surface-container-lowest py-space-3xl border-t border-surface-variant/40">
        <div className="max-w-container-max mx-auto px-gutter-desktop">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-2xl gap-space-md">
            <div>
              <div className="flex items-center gap-space-xs text-primary-container mb-space-2xs">
                <span className="material-symbols-outlined text-title-sm">badge</span>
                <span className="font-label-md text-label-md uppercase tracking-widest font-bold">
                  DIRECTOR MASTERY &amp; MENTORSHIP
                </span>
              </div>
              <h2 className="font-headline-lg text-headline-lg uppercase text-on-surface tracking-wide">
                MEET OUR <span className="text-primary-container">HEAD STRENGTH COACHES</span>
              </h2>
            </div>
            <p className="font-body-md text-body-md text-tertiary max-w-md">
              No novice floor attendants. Direct hands-on coaching from certified strength veterans dedicated to form precision and injury-free progression.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-xl">
            {/* Coach 1: Vaibhav */}
            <div className="coach-card bg-surface-container-low p-space-xl rounded-2xl border border-surface-variant/40 relative shadow-soft flex flex-col justify-between hover:border-primary-container transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary-container"></div>
              <div>
                <div className="flex items-center gap-space-md mb-space-md">
                  <CoachAvatar src="/images/coach-vaibhav.jpg" alt="Coach Vaibhav, bodybuilding prep coach at Fitness Future Gym" name="Coach Vaibhav" sizeClass="w-16 h-16" borderClass="border-primary-container" />
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
                      BODYBUILDING PREP COACH &amp; FITNESS PROFESSIONAL
                    </span>
                    <h3 className="font-headline-md text-headline-md uppercase text-on-surface">COACH VAIBHAV</h3>
                    <span className="font-body-sm text-body-sm text-tertiary">8+ Years Strength &amp; Biomechanics Specialist</span>
                  </div>
                </div>
                <p className="font-body-md text-body-md text-tertiary leading-relaxed mb-space-md">
                  Specializes in maximal compound loading, lumbar safety protocols, and competition deadlift/squat setup. Vaibhav has trained over 1,500+ lifters in Nangloi from raw beginners to 250kg+ pullers.
                </p>
                <span className="inline-flex items-center gap-space-2xs self-start bg-primary-container text-on-primary-container font-label-sm text-label-sm uppercase tracking-wide px-space-sm py-space-2xs rounded-full font-bold mb-space-md">
                  <span className="material-symbols-outlined text-label-lg leading-none">military_tech</span>
                  IBBFF (FFBA Delhi Judge)
                </span>
                <div className="grid grid-cols-3 gap-space-xs bg-surface-container p-space-sm rounded-xl border border-surface-variant/30">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm uppercase text-outline">BEST SQUAT</span>
                    <span className="font-title-sm text-title-sm text-on-surface">220 KG</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm uppercase text-outline">BEST DEADLIFT</span>
                    <span className="font-title-sm text-title-sm text-primary-container">250 KG</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm uppercase text-outline">SPECIALTY</span>
                    <span className="font-title-sm text-title-sm text-on-surface">Power &amp; PRs</span>
                  </div>
                </div>
                <div className="flex items-center gap-space-md mt-space-sm">
                  <a href="tel:+919643526435" className="inline-flex items-center gap-space-2xs font-label-md text-label-md uppercase text-primary-container hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-label-lg">call</span> +91 96435 26435
                  </a>
                  <a href="https://wa.me/919643526435" target="_blank" rel="noreferrer" className="inline-flex items-center gap-space-2xs font-label-md text-label-md uppercase text-primary-container hover:text-on-surface transition-colors">
                    <WhatsAppIcon className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                  <a href={INSTAGRAM_VAIBHAV} target="_blank" rel="noreferrer" className="inline-flex items-center gap-space-2xs font-label-md text-label-md uppercase text-primary-container hover:text-on-surface transition-colors">
                    <InstagramIcon className="w-3.5 h-3.5" /> Instagram
                  </a>
                </div>
              </div>
            </div>

            {/* Coach 2: Hritik */}
            <div className="coach-card bg-surface-container-low p-space-xl rounded-2xl border border-surface-variant/40 relative shadow-soft flex flex-col justify-between hover:border-primary-container transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 left-0 w-full h-1 bg-surface-variant"></div>
              <div>
                <div className="flex items-center gap-space-md mb-space-md">
                  <CoachAvatar src="/images/coach-hritik.jpg" alt="Coach Hritik, bodybuilding prep coach at Fitness Future Gym" name="Coach Hritik" sizeClass="w-16 h-16" />
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
                      BODYBUILDING PREP COACH &amp; FITNESS PROFESSIONAL
                    </span>
                    <h3 className="font-headline-md text-headline-md uppercase text-on-surface">COACH HRITIK</h3>
                    <span className="font-body-sm text-body-sm text-tertiary">Physique Architecture &amp; Recomp Specialist</span>
                  </div>
                </div>
                <p className="font-body-md text-body-md text-tertiary leading-relaxed mb-space-md">
                  Focuses on hypertrophy programming, physique architecture, and custom Indian nutrition blueprints. Hritik oversees body transformation and recomposition protocols for 70+ athletes, plus conditioning work for armed-forces recruits.
                </p>
                <div className="grid grid-cols-3 gap-space-xs bg-surface-container p-space-sm rounded-xl border border-surface-variant/30">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm uppercase text-outline">BEST BENCH</span>
                    <span className="font-title-sm text-title-sm text-on-surface">170 KG</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm uppercase text-outline">BODY RECOMP</span>
                    <span className="font-title-sm text-title-sm text-primary-container">70+ Athletes</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm uppercase text-outline">SPECIALTY</span>
                    <span className="font-title-sm text-title-sm text-on-surface">Hypertrophy</span>
                  </div>
                </div>
                <div className="flex items-center gap-space-md mt-space-sm">
                  <a href="tel:+918700978341" className="inline-flex items-center gap-space-2xs font-label-md text-label-md uppercase text-primary-container hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-label-lg">call</span> +91 87009 78341
                  </a>
                  <a href="https://wa.me/918700978341" target="_blank" rel="noreferrer" className="inline-flex items-center gap-space-2xs font-label-md text-label-md uppercase text-primary-container hover:text-on-surface transition-colors">
                    <WhatsAppIcon className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                  <a href={INSTAGRAM_HRITIK} target="_blank" rel="noreferrer" className="inline-flex items-center gap-space-2xs font-label-md text-label-md uppercase text-primary-container hover:text-on-surface transition-colors">
                    <InstagramIcon className="w-3.5 h-3.5" /> Instagram
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HARDWARE & EQUIPMENT ARSENAL */}
      <section className="hardware-sec w-full bg-background py-space-3xl border-t border-surface-variant/40">
        <div className="max-w-container-max mx-auto px-gutter-desktop">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-2xl gap-space-md">
            <div>
              <div className="flex items-center gap-space-xs text-primary-container mb-space-2xs">
                <span className="material-symbols-outlined text-title-sm">construction</span>
                <span className="font-label-md text-label-md uppercase tracking-widest font-bold">
                  HEAVYWEIGHT ARSENAL
                </span>
              </div>
              <h2 className="font-headline-lg text-headline-lg uppercase text-on-surface tracking-wide">
                FLOOR EQUIPMENT <span className="text-primary-container">SPECS</span>
              </h2>
            </div>
            <p className="font-body-md text-body-md text-tertiary max-w-md">
              We invest in heavy-gauge steel and knurled barbells—not commercial plastic machines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md">
            <div className="hw-card bg-surface-container-low p-space-lg rounded-2xl border border-surface-variant/40 shadow-soft flex flex-col gap-space-xs hover:border-primary-container transition-all duration-200">
              <span className="material-symbols-outlined text-primary-container text-headline-md">fitness_center</span>
              <h4 className="font-title-sm text-title-sm text-on-surface uppercase">Olympic Knurled Barbells</h4>
              <p className="font-body-sm text-body-sm text-tertiary">
                High tensile steel bars with aggressive friction knurling for zero slip on heavy deadlifts.
              </p>
              <span className="font-label-sm text-label-sm text-primary-container font-bold uppercase mt-auto">28mm &amp; 29mm Shafts</span>
            </div>

            <div className="hw-card bg-surface-container-low p-space-lg rounded-2xl border border-surface-variant/40 shadow-soft flex flex-col gap-space-xs hover:border-primary-container transition-all duration-200">
              <span className="material-symbols-outlined text-primary-container text-headline-md">shield</span>
              <h4 className="font-title-sm text-title-sm text-on-surface uppercase">400KG Rated Squat Cages</h4>
              <p className="font-body-sm text-body-sm text-tertiary">
                Heavy-duty box steel frames with solid safety pins for zero-fear maximal squatting.
              </p>
              <span className="font-label-sm text-label-sm text-primary-container font-bold uppercase mt-auto">4 Full Cages</span>
            </div>

            <div className="hw-card bg-surface-container-low p-space-lg rounded-2xl border border-surface-variant/40 shadow-soft flex flex-col gap-space-xs hover:border-primary-container transition-all duration-200">
              <span className="material-symbols-outlined text-primary-container text-headline-md">sports_gymnastics</span>
              <h4 className="font-title-sm text-title-sm text-on-surface uppercase">Dumbbell Tier (5kg - 52kg)</h4>
              <p className="font-body-sm text-body-sm text-tertiary">
                Solid welded pro dumbbells incremented cleanly for heavy presses, rows, and lunges.
              </p>
              <span className="font-label-sm text-label-sm text-primary-container font-bold uppercase mt-auto">Twin Complete Racks</span>
            </div>

            <div className="hw-card bg-surface-container-low p-space-lg rounded-2xl border border-surface-variant/40 shadow-soft flex flex-col gap-space-xs hover:border-primary-container transition-all duration-200">
              <span className="material-symbols-outlined text-primary-container text-headline-md">view_compact</span>
              <h4 className="font-title-sm text-title-sm text-on-surface uppercase">Shock Rubber Drop Bays</h4>
              <p className="font-body-sm text-body-sm text-tertiary">
                Dual layered high-density rubber tiles designed for heavy deadlift drop protection.
              </p>
              <span className="font-label-sm text-label-sm text-primary-container font-bold uppercase mt-auto">Dedicated Platforms</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PROGRAMS SNAPSHOT */}
      <section className="programs-sec w-full bg-surface-container-lowest py-space-3xl border-t border-surface-variant/40">
        <div className="max-w-container-max mx-auto px-gutter-desktop">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-2xl gap-space-md">
            <div>
              <div className="flex items-center gap-space-xs text-primary-container mb-space-2xs">
                <span className="material-symbols-outlined text-title-sm">bolt</span>
                <span className="font-label-md text-label-md uppercase tracking-widest font-bold">
                  SYSTEMATIC METHODOLOGY
                </span>
              </div>
              <h2 className="font-headline-lg text-headline-lg uppercase text-on-surface tracking-wide">
                PROGRAMS <span className="text-primary-container">BUILT FOR GAINS</span>
              </h2>
            </div>
            <Link
              href="/programs"
              className="font-label-md text-label-md uppercase tracking-wider text-tertiary-fixed hover:text-primary-container inline-flex items-center gap-space-2xs transition-colors"
            >
              <span>View Complete Curriculum</span>
              <span className="material-symbols-outlined text-body-md">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
            {/* Card 1 */}
            <div className="prog-card group bg-surface-container-low hover:bg-surface-container p-space-xl rounded-2xl flex flex-col justify-between transition-all duration-300 shadow-soft relative border border-surface-variant/40 hover:-translate-y-1">
              <div className="absolute top-0 left-0 right-0 h-1 bg-surface-variant group-hover:bg-primary-container transition-colors"></div>
              <div>
                <div className="flex items-center justify-between mb-space-md pt-space-xs">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
                    MODALITY 01
                  </span>
                  <span className="material-symbols-outlined text-tertiary group-hover:text-primary-container transition-colors">
                    sports_gymnastics
                  </span>
                </div>
                <h3 className="font-title-md text-title-md uppercase text-on-surface mb-space-sm group-hover:text-primary transition-colors">
                  Group Training
                </h3>
                <p className="font-body-md text-body-md text-tertiary leading-relaxed mb-space-xl">
                  Heavy duty compound focus, hypertrophy programming, posing &amp; prep support. Designed for athletes targeting raw dense muscle accrual and physique refinement.
                </p>
              </div>
              <div className="pt-space-md">
                <Link
                  href="/programs"
                  className="inline-flex items-center gap-space-xs font-label-md text-label-md uppercase font-bold text-on-surface group-hover:text-primary-container transition-colors"
                >
                  <span>Learn More</span>
                  <span className="material-symbols-outlined text-body-sm transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>

            {/* Card 2 */}
            <div className="prog-card group bg-surface-container-low hover:bg-surface-container p-space-xl rounded-2xl flex flex-col justify-between transition-all duration-300 shadow-soft relative border border-surface-variant/40 hover:-translate-y-1">
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary-container"></div>
              <div>
                <div className="flex items-center justify-between mb-space-md pt-space-xs">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
                    MODALITY 02
                  </span>
                  <span className="material-symbols-outlined text-primary-container">
                    fitness_center
                  </span>
                </div>
                <h3 className="font-title-md text-title-md uppercase text-on-surface mb-space-sm group-hover:text-primary transition-colors">
                  Personal Training
                </h3>
                <p className="font-body-md text-body-md text-tertiary leading-relaxed mb-space-xl">
                  1-on-1 technique correction, plateau breaking, tailored discipline. Dedicated mentorship ensuring every rep hits optimal mechanics without empty injury risk.
                </p>
              </div>
              <div className="pt-space-md">
                <Link
                  href="/programs"
                  className="inline-flex items-center gap-space-xs font-label-md text-label-md uppercase font-bold text-primary-container transition-colors"
                >
                  <span>Learn More</span>
                  <span className="material-symbols-outlined text-body-sm transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>

            {/* Card 3 */}
            <div className="prog-card group bg-surface-container-low hover:bg-surface-container p-space-xl rounded-2xl flex flex-col justify-between transition-all duration-300 shadow-soft relative border border-surface-variant/40 hover:-translate-y-1">
              <div className="absolute top-0 left-0 right-0 h-1 bg-surface-variant group-hover:bg-primary-container transition-colors"></div>
              <div>
                <div className="flex items-center justify-between mb-space-md pt-space-xs">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
                    MODALITY 03
                  </span>
                  <span className="material-symbols-outlined text-tertiary group-hover:text-primary-container transition-colors">
                    restaurant
                  </span>
                </div>
                <h3 className="font-title-md text-title-md uppercase text-on-surface mb-space-sm group-hover:text-primary transition-colors">
                  Diet Plan
                </h3>
                <p className="font-body-md text-body-md text-tertiary leading-relaxed mb-space-xl">
                  Macro targets, desi diet adaptations, realistic bulking &amp; cutting protocols. Uncomplicated nutritional blueprints calculated directly for working schedules.
                </p>
              </div>
              <div className="pt-space-md">
                <Link
                  href="/programs"
                  className="inline-flex items-center gap-space-xs font-label-md text-label-md uppercase font-bold text-on-surface group-hover:text-primary-container transition-colors"
                >
                  <span>Learn More</span>
                  <span className="material-symbols-outlined text-body-sm transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6b. MEMBER DASHBOARD FEATURES */}
      <section className="dashboard-sec w-full bg-surface-container-lowest py-space-3xl border-y-2 border-primary-container/60">
        <div className="max-w-container-max mx-auto px-gutter-desktop">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-2xl gap-space-md">
            <div>
              <div className="inline-flex items-center gap-space-2xs text-primary-container mb-space-sm bg-primary-container/10 border border-primary-container/40 px-space-sm py-space-2xs">
                <span className="material-symbols-outlined text-title-sm">verified</span>
                <span className="font-label-md text-label-md uppercase tracking-widest font-bold">
                  INCLUDED FREE WITH EVERY MEMBERSHIP
                </span>
              </div>
              <h2 className="font-headline-lg text-headline-lg uppercase text-on-surface tracking-wide">
                YOUR OWN MEMBER <span className="text-primary-container">DASHBOARD</span>
              </h2>
            </div>
            <p className="font-body-md text-body-md text-tertiary max-w-md">
              Not just a floor pass — sign in with WhatsApp or email, no password to remember, and get real training
              tools built for how you actually train.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md mb-space-xl">
            <div
              className="dash-card card-highlight-cycle bg-surface-container-low p-space-lg rounded-2xl border border-surface-variant/40 shadow-soft flex flex-col gap-space-xs hover:border-primary-container transition-all duration-200 md:col-span-1"
              style={{ animationDelay: "9s" }}
            >
              <span className="material-symbols-outlined text-primary-container text-headline-md">event_note</span>
              <h4 className="font-title-sm text-title-sm text-on-surface uppercase">Workout Planner</h4>
              <p className="font-body-sm text-body-sm text-tertiary">
                Pick from 8 pre-built splits — Push/Pull/Legs, 5x5 Strength, Bro Split, and more — or build your own
                with real exercises, sets, and reps.
              </p>
            </div>

            <div
              className="dash-card card-highlight-cycle bg-surface-container-low p-space-lg rounded-2xl border border-surface-variant/40 shadow-soft flex flex-col gap-space-xs hover:border-primary-container transition-all duration-200"
              style={{ animationDelay: "0s" }}
            >
              <span className="material-symbols-outlined text-primary-container text-headline-md">restaurant</span>
              <h4 className="font-title-sm text-title-sm text-on-surface uppercase">Auto Calorie Lookup</h4>
              <p className="font-body-sm text-body-sm text-tertiary">
                Type a food name and calories, protein, carbs, and fat fill in automatically — scaled exactly to how
                much you actually ate.
              </p>
            </div>

            <div
              className="dash-card card-highlight-cycle bg-surface-container-low p-space-lg rounded-2xl border border-surface-variant/40 shadow-soft flex flex-col gap-space-xs hover:border-primary-container transition-all duration-200"
              style={{ animationDelay: "1.5s" }}
            >
              <span className="material-symbols-outlined text-primary-container text-headline-md">
                local_fire_department
              </span>
              <h4 className="font-title-sm text-title-sm text-on-surface uppercase">Streak Tracker</h4>
              <p className="font-body-sm text-body-sm text-tertiary">
                A simple daily check-in calendar with unlockable achievement badges — miss a day and it resets, so
                consistency actually means something.
              </p>
            </div>

            <div
              className="dash-card card-highlight-cycle bg-surface-container-low p-space-lg rounded-2xl border border-surface-variant/40 shadow-soft flex flex-col gap-space-xs hover:border-primary-container transition-all duration-200"
              style={{ animationDelay: "3s" }}
            >
              <span className="material-symbols-outlined text-primary-container text-headline-md">qr_code_scanner</span>
              <h4 className="font-title-sm text-title-sm text-on-surface uppercase">One-Tap Attendance</h4>
              <p className="font-body-sm text-body-sm text-tertiary">
                Scan the QR code at the front desk and you&apos;re checked in — no scanning hardware, no queue, no
                app to open first.
              </p>
            </div>

            <div
              className="dash-card card-highlight-cycle bg-surface-container-low p-space-lg rounded-2xl border border-surface-variant/40 shadow-soft flex flex-col gap-space-xs hover:border-primary-container transition-all duration-200"
              style={{ animationDelay: "4.5s" }}
            >
              <span className="material-symbols-outlined text-primary-container text-headline-md">badge</span>
              <h4 className="font-title-sm text-title-sm text-on-surface uppercase">Digital Membership Card</h4>
              <p className="font-body-sm text-body-sm text-tertiary">
                Your card and membership number, always in your pocket — no plastic to forget at home, ready for
                front-desk check-in.
              </p>
            </div>

            <div
              className="dash-card card-highlight-cycle bg-surface-container-low p-space-lg rounded-2xl border border-surface-variant/40 shadow-soft flex flex-col gap-space-xs hover:border-primary-container transition-all duration-200"
              style={{ animationDelay: "6s" }}
            >
              <span className="material-symbols-outlined text-primary-container text-headline-md">calendar_month</span>
              <h4 className="font-title-sm text-title-sm text-on-surface uppercase">Attendance History</h4>
              <p className="font-body-sm text-body-sm text-tertiary">
                Every check-in tracked automatically — see your visit history and streak at a glance, no manual
                logging.
              </p>
            </div>

            <div
              className="dash-card card-highlight-cycle bg-surface-container-low p-space-lg rounded-2xl border border-surface-variant/40 shadow-soft flex flex-col gap-space-xs hover:border-primary-container transition-all duration-200"
              style={{ animationDelay: "7.5s" }}
            >
              <span className="material-symbols-outlined text-primary-container text-headline-md">fitness_center</span>
              <h4 className="font-title-sm text-title-sm text-on-surface uppercase">Workout Log</h4>
              <p className="font-body-sm text-body-sm text-tertiary">
                Log every set, rep, and weight after training — a real record of your progress, not just a plan on
                paper.
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-space-xs bg-primary-container hover:bg-secondary-container text-on-primary-container font-label-lg text-label-lg uppercase font-bold px-space-xl py-space-md rounded-xl shadow-soft transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-title-md">bolt</span>
              CREATE YOUR FREE ACCOUNT
            </Link>
          </div>
        </div>
      </section>

      {/* 8. OPERATIONAL SCHEDULE BANNER */}
      <section className="w-full bg-surface py-space-2xl border-t border-surface-variant/40">
        <div className="max-w-container-max mx-auto px-gutter-desktop">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-space-lg bg-surface-container-low p-space-xl rounded-2xl shadow-soft border border-surface-variant/40">
            <div className="md:col-span-5 flex flex-col justify-center">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold mb-space-2xs">
                DAILY DISCIPLINE
              </span>
              <h3 className="font-headline-md text-headline-md uppercase text-on-surface mb-space-sm">
                OPERATIONAL SCHEDULE
              </h3>
              <p className="font-body-md text-body-md text-tertiary">
                Consistent training blocks scheduled for morning powerlifters and evening post-shift warriors.
              </p>
            </div>
            <div className="md:col-span-7 flex flex-col gap-space-sm justify-center">
              <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container border border-surface-variant/30 hover:border-primary-container transition-colors">
                <div className="flex items-center gap-space-sm">
                  <span className="w-2.5 h-2.5 bg-primary-container"></span>
                  <span className="font-title-sm text-title-sm text-on-surface uppercase">
                    MORNING BATCH
                  </span>
                </div>
                <span className="font-label-md text-label-md text-tertiary-fixed font-mono uppercase">
                  06:00 AM — 11:00 AM
                </span>
              </div>
              <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container border border-surface-variant/30 hover:border-primary-container transition-colors">
                <div className="flex items-center gap-space-sm">
                  <span className="w-2.5 h-2.5 bg-primary-container"></span>
                  <span className="font-title-sm text-title-sm text-on-surface uppercase">
                    EVENING STRENGTH BATCH
                  </span>
                </div>
                <span className="font-label-md text-label-md text-tertiary-fixed font-mono uppercase">
                  04:30 PM — 10:30 PM
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. CLOSING CTA BANNER */}
      <section className="w-full bg-primary-container py-space-3xl relative overflow-hidden">
        <div className="max-w-container-max mx-auto px-gutter-desktop">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-xl">
            <div className="flex flex-col max-w-2xl">
              <span className="font-label-md text-label-md uppercase tracking-widest text-on-primary-container font-bold mb-space-2xs">
                NO CONTRACT LOCKS • NO BULLSHIT
              </span>
              <h2 className="font-headline-lg text-headline-lg uppercase text-on-primary font-normal leading-tight tracking-wide">
                READY TO PUT IN THE WORK? JOIN FITNESS FUTURE GYM TODAY
              </h2>
              <p className="font-body-md text-body-md text-on-primary-fixed-variant mt-space-xs">
                Stop waiting for the right moment. Walk onto the chalk-dusted platform in Nangloi and claim your first trial session today.
              </p>
            </div>
            <div className="shrink-0 flex flex-col sm:flex-row gap-space-sm w-full lg:w-auto">
              <Link
                href="/membership"
                className="inline-flex items-center justify-center gap-space-xs bg-surface-container-lowest hover:bg-surface-container text-on-surface font-title-sm text-title-sm uppercase px-space-xl py-space-md rounded-xl shadow-soft transition-colors text-center"
              >
                <span>Get Started Now</span>
                <span className="material-symbols-outlined text-title-md">arrow_forward</span>
              </Link>
              <Link
                href="/location"
                className="inline-flex items-center justify-center bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 text-on-primary font-title-sm text-title-sm uppercase px-space-lg py-space-md rounded-xl transition-colors text-center border border-on-primary/30"
              >
                Find Us on Map
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
