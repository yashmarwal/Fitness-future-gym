"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import WhatsAppIcon from "@/frontend/components/icons/WhatsAppIcon";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function DesktopPrograms() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Intro header entrance
      gsap.fromTo(
        ".prog-hero-anim",
        { y: 35, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: "power3.out" }
      );

      // Service blocks animation
      const blocks = document.querySelectorAll(".prog-block-anim");
      blocks.forEach((block) => {
        gsap.fromTo(
          block,
          { y: 55, opacity: 0, scale: 0.97 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: {
              trigger: block,
              start: "top 80%",
            },
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col w-full">
      {/* INTRO HEADER */}
      <section className="w-full bg-surface-container-lowest px-gutter-desktop py-space-3xl border-b border-surface-variant/40">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row md:items-end justify-between gap-space-lg">
          <div className="flex flex-col gap-space-xs max-w-2xl">
            <div className="prog-hero-anim flex items-center gap-space-xs">
              <span className="inline-block w-3 h-3 bg-primary-container animate-pulse"></span>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
                High-Yield Training Systems • Nangloi HQ
              </span>
            </div>
            <h1 className="prog-hero-anim font-headline-lg text-headline-lg uppercase text-on-surface tracking-wider">
              ENGINEERED FOR <span className="text-primary-container">REAL PROGRESS</span>
            </h1>
            <p className="prog-hero-anim font-body-lg text-body-lg text-tertiary">
              No generic machine circuits. Targeted strength, physique, and coaching protocols built for high-stakes body transformations.
            </p>
          </div>

          {/* Metrics */}
          <div className="prog-hero-anim flex items-stretch gap-space-xs shrink-0">
            <div className="bg-surface-container-high px-space-md py-space-sm rounded-xl flex flex-col justify-center border border-surface-variant/40">
              <span className="font-headline-sm text-headline-sm text-primary-container leading-none">50KG+</span>
              <span className="font-label-sm text-label-sm uppercase text-tertiary">Dumbbell Tier</span>
            </div>
            <div className="bg-surface-container-high px-space-md py-space-sm rounded-xl flex flex-col justify-center border border-surface-variant/40">
              <span className="font-headline-sm text-headline-sm text-on-surface leading-none">100%</span>
              <span className="font-label-sm text-label-sm uppercase text-tertiary">Raw Iron Racks</span>
            </div>
            <div className="bg-primary-container px-space-md py-space-sm rounded-xl flex flex-col justify-center text-on-primary-container">
              <span className="font-headline-sm text-headline-sm text-on-primary-container leading-none">8+ YRS</span>
              <span className="font-label-sm text-label-sm uppercase text-on-primary-container/80 font-bold">Unbroken</span>
            </div>
          </div>
        </div>
      </section>

      {/* THREE MAIN SERVICE BLOCKS */}
      <section className="w-full px-gutter-desktop py-space-3xl bg-background">
        <div className="max-w-container-max mx-auto flex flex-col gap-space-2xl">
          {/* Block 1 */}
          <div className="prog-block-anim group relative bg-surface-container flex flex-col lg:flex-row items-stretch shadow-soft rounded-2xl overflow-hidden transition-all duration-300 border border-surface-variant/40 hover:border-primary-container">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-primary-container"></div>
            <div className="w-full lg:w-5/12 min-h-[340px] relative overflow-hidden bg-surface-container-high shrink-0">
              <Image
                alt="Bodybuilding prep deadlift"
                src="/images/program-hypertrophy.jpg"
                fill
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="object-cover grayscale contrast-125 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-space-md left-space-md bg-surface-container-lowest/90 px-space-sm py-space-2xs rounded-full border border-surface-variant/40">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
                  PROTOCOL #01 // HYPERTROPHY
                </span>
              </div>
            </div>
            <div className="w-full lg:w-7/12 p-space-xl flex flex-col justify-between">
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-baseline justify-between gap-space-md flex-wrap">
                  <h2 className="font-headline-md text-headline-md uppercase text-on-surface tracking-wide">
                    GROUP TRAINING
                  </h2>
                  <span className="font-label-md text-label-md uppercase text-primary-container tracking-wider font-bold">
                    Heavy-Duty Iron Core
                  </span>
                </div>
                <div className="flex items-baseline gap-space-2xs">
                  <span className="font-headline-sm text-headline-sm text-primary-container font-bold">₹2,000</span>
                  <span className="font-label-sm text-label-sm text-tertiary uppercase">/ Month</span>
                </div>
                <p className="font-body-md text-body-md text-tertiary leading-relaxed">
                  Built on periodized volume, progressive barbell tension, and stage-ready physique mechanics. We discard soft cardio-style workouts for structured resistance training calibrated around real training failure and muscular adaptation.
                </p>
                <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                  <div className="bg-surface-container-high p-space-sm rounded-lg flex flex-col gap-space-2xs border border-surface-variant/30">
                    <span className="font-label-sm text-label-sm uppercase text-primary-container">Arsenal Spec</span>
                    <span className="font-title-sm text-title-sm text-on-surface">Heavy Barbell Platforms</span>
                    <p className="font-body-sm text-body-sm text-tertiary">Dedicated shock-absorbing deadlift bays and Olympic knurled bars.</p>
                  </div>
                  <div className="bg-surface-container-high p-space-sm rounded-lg flex flex-col gap-space-2xs border border-surface-variant/30">
                    <span className="font-label-sm text-label-sm uppercase text-primary-container">Resistance Curve</span>
                    <span className="font-title-sm text-title-sm text-on-surface">Dumbbells To 50KG+</span>
                    <p className="font-body-sm text-body-sm text-tertiary">Steel-welded pro-style dumbbells ready for maximum chest &amp; row outputs.</p>
                  </div>
                </div>
              </div>

              <div className="pt-space-lg mt-space-md bg-surface-container-low p-space-sm rounded-xl flex flex-col gap-space-sm border border-surface-variant/40">
                <div className="flex items-center gap-space-md flex-wrap">
                  <div>
                    <span className="font-headline-sm text-headline-sm text-on-surface">4</span>
                    <span className="font-label-sm text-label-sm uppercase text-tertiary ml-space-2xs">Full Racks</span>
                  </div>
                  <div className="w-px h-4 bg-surface-variant"></div>
                  <div>
                    <span className="font-headline-sm text-headline-sm text-on-surface">8</span>
                    <span className="font-label-sm text-label-sm uppercase text-tertiary ml-space-2xs">Cable Stacks</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-space-2xs">
                  <a
                    href="tel:+919643526435"
                    className="flex flex-col items-center gap-space-2xs bg-surface-container-high hover:bg-primary-container hover:text-on-primary-container text-on-surface px-space-sm py-space-sm rounded-lg shadow-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-title-md">call</span>
                    <span className="font-label-sm text-label-sm uppercase tracking-wide">Call Vaibhav</span>
                  </a>
                  <Link
                    href="/location#inquiry"
                    className="flex flex-col items-center gap-space-2xs bg-surface-container-high hover:bg-primary-container hover:text-on-primary-container text-on-surface px-space-sm py-space-sm rounded-lg shadow-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-title-md">edit_note</span>
                    <span className="font-label-sm text-label-sm uppercase tracking-wide">Fill A Form</span>
                  </Link>
                  <a
                    href="https://wa.me/919643526435?text=Hi%20Coach%20Vaibhav%2C%20I%27m%20interested%20in%20Group%20Training%20at%20Fitness%20Future%20Gym.%20Can%20you%20tell%20me%20more%3F"
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center gap-space-2xs bg-primary-container text-on-primary-container hover:bg-secondary-container px-space-sm py-space-sm rounded-lg shadow-sm transition-colors"
                  >
                    <WhatsAppIcon className="w-5 h-5" />
                    <span className="font-label-sm text-label-sm uppercase tracking-wide">WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Block 2 */}
          <div className="prog-block-anim group relative bg-surface-container flex flex-col lg:flex-row-reverse items-stretch shadow-soft rounded-2xl overflow-hidden transition-all duration-300 border border-surface-variant/40 hover:border-primary-container">
            <div className="absolute top-0 right-0 bottom-0 w-1.5 bg-primary-container"></div>
            <div className="w-full lg:w-5/12 min-h-[340px] relative overflow-hidden bg-surface-container-high shrink-0">
              <Image
                alt="Personal trainer coaching squat"
                src="/images/program-coaching.jpg"
                fill
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="object-cover grayscale contrast-125 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-space-md left-space-md bg-surface-container-lowest/90 px-space-sm py-space-2xs rounded-full border border-surface-variant/40">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
                  PROTOCOL #02 // DIRECT COACHING
                </span>
              </div>
            </div>
            <div className="w-full lg:w-7/12 p-space-xl flex flex-col justify-between">
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-baseline justify-between gap-space-md flex-wrap">
                  <h2 className="font-headline-md text-headline-md uppercase text-on-surface tracking-wide">
                    PERSONAL TRAINING
                  </h2>
                  <span className="font-label-md text-label-md uppercase text-primary-container tracking-wider font-bold">
                    Kinetic Precision
                  </span>
                </div>
                <div className="flex items-baseline gap-space-2xs">
                  <span className="font-headline-sm text-headline-sm text-primary-container font-bold">₹6,000</span>
                  <span className="font-label-sm text-label-sm text-tertiary uppercase">/ Month</span>
                </div>
                <p className="font-body-md text-body-md text-tertiary leading-relaxed">
                  Direct accountability under experienced strength coaches. We diagnose movement dysfunctions, correct joint angles, and build customized intensity ramps that force muscular adaptation while protecting lumbar integrity.
                </p>
                <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                  <div className="bg-surface-container-high p-space-sm rounded-lg flex flex-col gap-space-2xs border border-surface-variant/30">
                    <span className="font-label-sm text-label-sm uppercase text-primary-container">Execution</span>
                    <span className="font-title-sm text-title-sm text-on-surface">Kinetic Posture Alignment</span>
                    <p className="font-body-sm text-body-sm text-tertiary">Continuous micro-adjustments on ankle, hip, and shoulder tracking.</p>
                  </div>
                  <div className="bg-surface-container-high p-space-sm rounded-lg flex flex-col gap-space-2xs border border-surface-variant/30">
                    <span className="font-label-sm text-label-sm uppercase text-primary-container">Metrics</span>
                    <span className="font-title-sm text-title-sm text-on-surface">Bi-Weekly Body Calipers</span>
                    <p className="font-body-sm text-body-sm text-tertiary">Direct subcutaneous fat fold auditing every 14 days.</p>
                  </div>
                </div>
              </div>

              <div className="pt-space-lg mt-space-md bg-surface-container-low p-space-sm rounded-xl flex flex-col gap-space-sm border border-surface-variant/40">
                <div className="flex items-center gap-space-md flex-wrap">
                  <div>
                    <span className="font-headline-sm text-headline-sm text-on-surface">1:1</span>
                    <span className="font-label-sm text-label-sm uppercase text-tertiary ml-space-2xs">Floor Ratio</span>
                  </div>
                  <div className="w-px h-4 bg-surface-variant"></div>
                  <div>
                    <span className="font-headline-sm text-headline-sm text-on-surface">14D</span>
                    <span className="font-label-sm text-label-sm uppercase text-tertiary ml-space-2xs">Cycle Audits</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-space-2xs">
                  <a
                    href="tel:+919643526435"
                    className="flex flex-col items-center gap-space-2xs bg-surface-container-high hover:bg-primary-container hover:text-on-primary-container text-on-surface px-space-sm py-space-sm rounded-lg shadow-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-title-md">call</span>
                    <span className="font-label-sm text-label-sm uppercase tracking-wide">Call Vaibhav</span>
                  </a>
                  <Link
                    href="/location#inquiry"
                    className="flex flex-col items-center gap-space-2xs bg-surface-container-high hover:bg-primary-container hover:text-on-primary-container text-on-surface px-space-sm py-space-sm rounded-lg shadow-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-title-md">edit_note</span>
                    <span className="font-label-sm text-label-sm uppercase tracking-wide">Fill A Form</span>
                  </Link>
                  <a
                    href="https://wa.me/919643526435?text=Hi%20Coach%20Vaibhav%2C%20I%27m%20interested%20in%20Personal%20Training%20at%20Fitness%20Future%20Gym.%20Can%20you%20tell%20me%20more%3F"
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center gap-space-2xs bg-primary-container text-on-primary-container hover:bg-secondary-container px-space-sm py-space-sm rounded-lg shadow-sm transition-colors"
                  >
                    <WhatsAppIcon className="w-5 h-5" />
                    <span className="font-label-sm text-label-sm uppercase tracking-wide">WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Block 3 */}
          <div className="prog-block-anim group relative bg-surface-container flex flex-col lg:flex-row items-stretch shadow-soft rounded-2xl overflow-hidden transition-all duration-300 border border-surface-variant/40 hover:border-primary-container">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-primary-container"></div>
            <div className="w-full lg:w-5/12 min-h-[340px] relative overflow-hidden bg-surface-container-high shrink-0">
              <Image
                alt="High protein meal prep"
                src="/images/program-nutrition.jpg"
                fill
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="object-cover grayscale contrast-125 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-space-md left-space-md bg-surface-container-lowest/90 px-space-sm py-space-2xs rounded-full border border-surface-variant/40">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
                  PROTOCOL #03 // BIO-FUEL
                </span>
              </div>
            </div>
            <div className="w-full lg:w-7/12 p-space-xl flex flex-col justify-between">
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-baseline justify-between gap-space-md flex-wrap">
                  <h2 className="font-headline-md text-headline-md uppercase text-on-surface tracking-wide">
                    DIET PLAN
                  </h2>
                  <span className="font-label-md text-label-md uppercase text-primary-container tracking-wider font-bold">
                    Metabolic Fueling
                  </span>
                </div>
                <div className="flex items-baseline gap-space-2xs">
                  <span className="font-headline-sm text-headline-sm text-primary-container font-bold">₹1,000</span>
                  <span className="font-label-sm text-label-sm text-tertiary uppercase">/ Month</span>
                </div>
                <p className="font-body-md text-body-md text-tertiary leading-relaxed">
                  No generic Western diet templates. We build caloric partitioning and micronutrient blueprints mapped around local North Indian, vegetarian, and non-vegetarian pantry staples—calculating actual protein efficiency without gimmicks.
                </p>
                <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                  <div className="bg-surface-container-high p-space-sm rounded-lg flex flex-col gap-space-2xs border border-surface-variant/30">
                    <span className="font-label-sm text-label-sm uppercase text-primary-container">Dietary Localization</span>
                    <span className="font-title-sm text-title-sm text-on-surface">Indian Macros &amp; Soya/Paneer/Chicken</span>
                    <p className="font-body-sm text-body-sm text-tertiary">Soya, eggs, paneer, and dahi factored into strict amino-acid profiles.</p>
                  </div>
                  <div className="bg-surface-container-high p-space-sm rounded-lg flex flex-col gap-space-2xs border border-surface-variant/30">
                    <span className="font-label-sm text-label-sm uppercase text-primary-container">Integrity Guarantee</span>
                    <span className="font-title-sm text-title-sm text-on-surface">Zero Snake-Oil Supplements</span>
                    <p className="font-body-sm text-body-sm text-tertiary">No unvetted fat burners. Only evidence-based creatine and whey.</p>
                  </div>
                </div>
              </div>

              <div className="pt-space-lg mt-space-md bg-surface-container-low p-space-sm rounded-xl flex flex-col gap-space-sm border border-surface-variant/40">
                <div className="flex items-center justify-between gap-space-md flex-wrap">
                  <div className="flex items-center gap-space-md flex-wrap">
                    <div>
                      <span className="font-headline-sm text-headline-sm text-on-surface">100%</span>
                      <span className="font-label-sm text-label-sm uppercase text-tertiary ml-space-2xs">Local Staples</span>
                    </div>
                    <div className="w-px h-4 bg-surface-variant"></div>
                    <div>
                      <span className="font-headline-sm text-headline-sm font-bold text-primary-container">ZERO</span>
                      <span className="font-label-sm text-label-sm uppercase text-tertiary ml-space-2xs">Fads</span>
                    </div>
                  </div>
                  <Link
                    href="/calculator"
                    className="inline-flex items-center justify-center bg-primary-container text-on-primary-container font-label-md text-label-md uppercase px-space-md py-space-sm rounded-xl shadow-soft hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  >
                    Calculate Caloric Target
                    <span className="material-symbols-outlined ml-space-xs text-body-md">calculate</span>
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-space-2xs">
                  <a
                    href="tel:+919643526435"
                    className="flex flex-col items-center gap-space-2xs bg-surface-container-high hover:bg-primary-container hover:text-on-primary-container text-on-surface px-space-sm py-space-sm rounded-lg shadow-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-title-md">call</span>
                    <span className="font-label-sm text-label-sm uppercase tracking-wide">Call Vaibhav</span>
                  </a>
                  <Link
                    href="/location#inquiry"
                    className="flex flex-col items-center gap-space-2xs bg-surface-container-high hover:bg-primary-container hover:text-on-primary-container text-on-surface px-space-sm py-space-sm rounded-lg shadow-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-title-md">edit_note</span>
                    <span className="font-label-sm text-label-sm uppercase tracking-wide">Fill A Form</span>
                  </Link>
                  <a
                    href="https://wa.me/919643526435?text=Hi%20Coach%20Vaibhav%2C%20I%27m%20interested%20in%20the%20Diet%20Plan%20at%20Fitness%20Future%20Gym.%20Can%20you%20tell%20me%20more%3F"
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center gap-space-2xs bg-primary-container text-on-primary-container hover:bg-secondary-container px-space-sm py-space-sm rounded-lg shadow-sm transition-colors"
                  >
                    <WhatsAppIcon className="w-5 h-5" />
                    <span className="font-label-sm text-label-sm uppercase tracking-wide">WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
