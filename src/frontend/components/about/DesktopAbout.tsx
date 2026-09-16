"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CoachAvatar from "@/frontend/components/CoachAvatar";
import WhatsAppIcon from "@/frontend/components/icons/WhatsAppIcon";
import InstagramIcon from "@/frontend/components/icons/InstagramIcon";
import { INSTAGRAM_VAIBHAV, INSTAGRAM_HRITIK } from "@/frontend/lib/siteConfig";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function DesktopAbout() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero entrance
      gsap.fromTo(
        ".about-hero-text",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.85, stagger: 0.15, ease: "power3.out" }
      );

      gsap.fromTo(
        ".about-stat-item",
        { y: 30, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, delay: 0.3, ease: "back.out(1.2)" }
      );

      // Scroll sections
      const sections = document.querySelectorAll(".about-scroll-sec");
      sections.forEach((sec) => {
        gsap.fromTo(
          sec.querySelectorAll(".about-anim-item"),
          { y: 45, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.75,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sec,
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
      {/* 1. HERO BANNER */}
      <section className="w-full bg-surface-container-lowest px-gutter-desktop py-space-3xl">
        <div className="max-w-container-max mx-auto">
          <div className="flex flex-col gap-space-sm max-w-4xl">
            <div className="about-hero-text flex items-center gap-space-sm">
              <span className="inline-block w-2.5 h-2.5 bg-primary-container animate-pulse"></span>
              <span className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant font-bold">
                EST. 2016 • RAO VIHAR, WEST DELHI
              </span>
            </div>
            <h1 className="about-hero-text font-display-xl text-display-xl text-on-surface uppercase tracking-tight">
              8 YEARS OF RAW DISCIPLINE IN NANGLOI
            </h1>
            <div className="about-hero-text w-24 h-1 bg-primary-container mt-space-2xs"></div>
            <p className="about-hero-text font-body-lg text-body-lg text-tertiary max-w-2xl pt-space-xs">
              Fitness Future Gym was established with an unapologetic standard: zero vanity mirrors, zero hollow wellness buzzwords, and an iron floor forged for unadulterated physical grit.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-space-md mt-space-2xl pt-space-md bg-surface-container-low p-space-lg shadow-hard border border-surface-variant/40">
            <div className="about-stat-item flex flex-col">
              <span className="font-headline-lg text-headline-lg text-primary-container">500+</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary">
                Athletes Molded
              </span>
            </div>
            <div className="about-stat-item flex flex-col">
              <span className="font-headline-lg text-headline-lg text-on-surface">8+</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary">
                Years Operating
              </span>
            </div>
            <div className="about-stat-item flex flex-col">
              <span className="font-headline-lg text-headline-lg text-primary-container">100%</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary">
                Unisex &amp; Disciplined
              </span>
            </div>
            <div className="about-stat-item flex flex-col">
              <span className="font-headline-lg text-headline-lg text-on-surface">25+</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary">
                Police &amp; Recruits
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ORIGIN DOSSIER */}
      <section className="about-scroll-sec w-full bg-background px-gutter-desktop py-space-3xl border-t border-surface-variant/40">
        <div className="max-w-container-max mx-auto">
          <div className="grid grid-cols-12 gap-space-xl items-center">
            <div className="col-span-6 flex flex-col gap-space-md">
              <div className="about-anim-item flex items-center gap-space-xs">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
                  Origin Dossier
                </span>
                <span className="text-tertiary font-label-sm">•</span>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-tertiary">
                  Nangloi Sector 110041
                </span>
              </div>
              <h2 className="about-anim-item font-headline-lg text-headline-lg text-on-surface uppercase tracking-wide">
                FROM A SINGLE RACK TO NANGLOI&apos;S STRONGEST UNISEX HAVEN
              </h2>
              <div className="about-anim-item flex flex-col gap-space-sm font-body-md text-body-md text-tertiary leading-relaxed">
                <p>
                  Founded 8 years ago in Rao Vihar, Nangloi, Fitness Future Gym was built to give lifters an unpretentious sanctuary where work ethic speaks louder than trendy fitness fads. We opened our steel doors with a single heavy-gauge squat cage, mismatched cast iron, and an unwavering commitment to raw progression.
                </p>
                <p>
                  While contemporary commercial gyms chased neon decor and smoothie counters, we invested back into Olympic-standard knurling, thick rubber mats, and competition-spec barbells. Lifters from Rao Vihar, Inder Enclave, and Rohtak Road quickly recognized our training floor as the authentic ground truth of local strength culture.
                </p>
                <p className="text-on-surface font-medium">
                  Today, we stand as an expanded 5,000 sq ft unisex iron temple. We preserve the raw spirit of day one while arming every serious athlete with calibrated plates, isolated hypertrophy platforms, and zero-bullshit athletic coaching.
                </p>
              </div>
              <div className="about-anim-item pt-space-xs flex items-center gap-space-md">
                <Link
                  href="/membership"
                  className="inline-flex items-center justify-center bg-primary-container text-on-primary-container hover:bg-secondary-container hover:text-on-secondary font-label-md text-label-md uppercase font-bold px-space-lg py-space-sm transition-colors shadow-hard hover:scale-[1.02] active:scale-[0.98]"
                >
                  Explore Floor Rigs
                </Link>
                <Link
                  href="/programs"
                  className="inline-flex items-center justify-center bg-surface-container text-on-surface hover:text-primary-container font-label-md text-label-md uppercase px-space-lg py-space-sm transition-colors shadow-hard border border-surface-variant/40"
                >
                  Our Programs
                </Link>
              </div>
            </div>

            <div className="col-span-6 grid grid-cols-2 gap-space-md">
              <div className="about-anim-item relative bg-surface-container-low shadow-hard overflow-hidden group border border-surface-variant/40">
                <Image
                  alt="Atmospheric training session"
                  src="/images/about-training.jpg"
                  width={512}
                  height={286}
                  className="w-full h-80 object-cover grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-surface-container-lowest/90 p-space-sm">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container">
                    Floor Authority
                  </span>
                  <p className="font-title-sm text-title-sm text-on-surface">
                    Heavy Deadlift &amp; Squat Wells
                  </p>
                </div>
              </div>

              <div className="about-anim-item relative bg-surface-container-low shadow-hard overflow-hidden group mt-space-xl border border-surface-variant/40">
                {/* TODO: temporary stand-in — the original hotlinked source for this
                    tile ("Knurled steel barbell") was already dead (400 from Google's
                    temp CDN) when this was self-hosted on 2026-09-14. Reusing the
                    gym-facility photo so nothing shows a broken image; replace
                    public/images/about-barbell.jpg with a real photo when available. */}
                <Image
                  alt="Gym equipment and training area"
                  src="/images/about-barbell.jpg"
                  width={512}
                  height={279}
                  className="w-full h-80 object-cover contrast-125 group-hover:contrast-100 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-surface-container-lowest/90 p-space-sm">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container">
                    Calibration
                  </span>
                  <p className="font-title-sm text-title-sm text-on-surface">
                    Unbent Steel &amp; Competition Iron
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. OPERATING SYSTEM — 3 LAWS */}
      <section className="about-scroll-sec w-full bg-surface-container-low px-gutter-desktop py-space-3xl border-t border-surface-variant/40">
        <div className="max-w-container-max mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-space-2xl">
            <span className="font-label-md text-label-md uppercase tracking-widest text-primary-container font-bold">
              Core Operating System
            </span>
            <h2 className="font-display-lg text-display-lg text-on-surface uppercase tracking-tight mt-space-2xs">
              SWEAT. GAIN. REPEAT.
            </h2>
            <div className="w-16 h-1 bg-primary-container mx-auto mt-space-xs mb-space-sm"></div>
            <p className="font-body-md text-body-md text-tertiary">
              The three non-negotiable laws that govern every barbell loaded and every rep completed inside our facility.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-space-lg">
            <div className="about-anim-item bg-surface-container p-space-xl shadow-hard flex flex-col justify-between border border-surface-variant/40 hover:border-primary-container transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-space-md">
                  <span className="font-headline-lg text-headline-lg text-primary-container">01</span>
                  <span className="material-symbols-outlined text-title-md text-primary-container">
                    local_fire_department
                  </span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface uppercase tracking-wide mb-space-sm">
                  SWEAT
                </h3>
                <p className="font-body-md text-body-md text-tertiary leading-relaxed">
                  Show up and do the hard sets when motivation fades. Sweat is the initial physical toll exacted for transformation. No excuses for humidity, fatigue, or time; our athletes leave hesitation at the doorway.
                </p>
              </div>
              <div className="mt-space-lg pt-space-sm bg-surface-container-high p-space-sm border border-surface-variant/30">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                  Standard
                </span>
                <p className="font-title-sm text-title-sm text-on-surface uppercase">Unbroken Work Ethic</p>
              </div>
            </div>

            <div className="about-anim-item bg-surface-container p-space-xl shadow-hard flex flex-col justify-between border border-surface-variant/40 hover:border-primary-container transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-space-md">
                  <span className="font-headline-lg text-headline-lg text-primary-container">02</span>
                  <span className="material-symbols-outlined text-title-md text-primary-container">
                    fitness_center
                  </span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface uppercase tracking-wide mb-space-sm">
                  GAIN
                </h3>
                <p className="font-body-md text-body-md text-tertiary leading-relaxed">
                  Incremental progressive overload, strength of mind and muscle. We do not chase temporary pump or empty exhaustion. We engineer structural adaptation by adding 1.25kg plates and executing sharper reps.
                </p>
              </div>
              <div className="mt-space-lg pt-space-sm bg-surface-container-high p-space-sm border border-surface-variant/30">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                  Standard
                </span>
                <p className="font-title-sm text-title-sm text-on-surface uppercase">Measurable Progression</p>
              </div>
            </div>

            <div className="about-anim-item bg-surface-container p-space-xl shadow-hard flex flex-col justify-between border border-surface-variant/40 hover:border-primary-container transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-space-md">
                  <span className="font-headline-lg text-headline-lg text-primary-container">03</span>
                  <span className="material-symbols-outlined text-title-md text-primary-container">
                    autorenew
                  </span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface uppercase tracking-wide mb-space-sm">
                  REPEAT
                </h3>
                <p className="font-body-md text-body-md text-tertiary leading-relaxed">
                  The ruthless discipline of daily consistency. True strength is not built in a heroic weekend; it is constructed across months of showing up when no one is applauding. Unbreakable athletic rhythm.
                </p>
              </div>
              <div className="mt-space-lg pt-space-sm bg-surface-container-high p-space-sm border border-surface-variant/30">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                  Standard
                </span>
                <p className="font-title-sm text-title-sm text-on-surface uppercase">Unshakable Routine</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHY NANGLOI TRUSTS US */}
      <section className="about-scroll-sec w-full bg-background px-gutter-desktop py-space-3xl border-t border-surface-variant/40">
        <div className="max-w-container-max mx-auto">
          <div className="flex items-end justify-between gap-space-md mb-space-2xl">
            <div>
              <span className="font-label-md text-label-md uppercase tracking-widest text-primary-container font-bold">
                Community Benchmark
              </span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-wide mt-space-2xs">
                WHY NANGLOI TRUSTS US
              </h2>
            </div>
            <p className="font-body-md text-body-md text-tertiary max-w-md">
              Built on local reputation, mutual respect, and results earned the hard way. Here is what separates our floor from commercial vanity spaces.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-space-lg">
            <div className="about-anim-item bg-surface-container p-space-xl shadow-hard relative border border-surface-variant/40 hover:border-primary-container transition-colors">
              <div className="w-full h-0.5 bg-primary-container absolute top-0 left-0"></div>
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-headline-md text-headline-md text-primary-container">01</span>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-tertiary">
                  Longevity
                </span>
              </div>
              <h3 className="font-title-md text-title-md text-on-surface uppercase tracking-wide mb-space-xs">
                8+ Years Local Presence
              </h3>
              <p className="font-body-md text-body-md text-tertiary leading-relaxed">
                Deep roots planted directly in Rao Vihar &amp; Inder Enclave. Over 8 uninterrupted years, hundreds of local athletes, college lifters, and working professionals have made our platforms their daily anchor.
              </p>
            </div>

            <div className="about-anim-item bg-surface-container p-space-xl shadow-hard relative border border-surface-variant/40 hover:border-primary-container transition-colors">
              <div className="w-full h-0.5 bg-primary-container absolute top-0 left-0"></div>
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-headline-md text-headline-md text-primary-container">02</span>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-tertiary">
                  Inclusivity
                </span>
              </div>
              <h3 className="font-title-md text-title-md text-on-surface uppercase tracking-wide mb-space-xs">
                100% Unisex &amp; Judgment-Free
              </h3>
              <p className="font-body-md text-body-md text-tertiary leading-relaxed">
                A safe, empowering, and strictly respectful training floor for men and women lifters alike. We maintain an ironclad zero-harassment atmosphere where female powerlifters deadlift alongside veteran athletes.
              </p>
            </div>

            <div className="about-anim-item bg-surface-container p-space-xl shadow-hard relative border border-surface-variant/40 hover:border-primary-container transition-colors">
              <div className="w-full h-0.5 bg-primary-container absolute top-0 left-0"></div>
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-headline-md text-headline-md text-primary-container">03</span>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-tertiary">
                  Coaching
                </span>
              </div>
              <h3 className="font-title-md text-title-md text-on-surface uppercase tracking-wide mb-space-xs">
                Real Guidance, Not Just Machinery
              </h3>
              <p className="font-body-md text-body-md text-tertiary leading-relaxed">
                Coaches who teach proper bar paths, intra-abdominal bracing, and biomechanical injury prevention—not salesmen pushing unnecessary supplements. We audit your setup before you pull heavy.
              </p>
            </div>

            <div className="about-anim-item bg-surface-container p-space-xl shadow-hard relative border border-surface-variant/40 hover:border-primary-container transition-colors">
              <div className="w-full h-0.5 bg-primary-container absolute top-0 left-0"></div>
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-headline-md text-headline-md text-primary-container">04</span>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-tertiary">
                  Specialization
                </span>
              </div>
              <h3 className="font-title-md text-title-md text-on-surface uppercase tracking-wide mb-space-xs">
                Certified Personal Training
              </h3>
              <p className="font-body-sm text-body-sm text-tertiary leading-relaxed">
                Specialized programs dialed in for sustainable fat loss, competition powerlifting PRs, and physical recruitment benchmarks for Delhi Police, paramilitary, and armed forces testing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MEET THE COACHES */}
      <section className="about-scroll-sec w-full bg-surface-container-low px-gutter-desktop py-space-3xl border-t border-surface-variant/40">
        <div className="max-w-container-max mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-space-2xl">
            <span className="font-label-md text-label-md uppercase tracking-widest text-primary-container font-bold">
              The Floor Authority
            </span>
            <h2 className="font-display-lg text-display-lg text-on-surface uppercase tracking-tight mt-space-2xs">
              MEET THE COACHES
            </h2>
            <div className="w-16 h-1 bg-primary-container mx-auto mt-space-xs mb-space-sm"></div>
            <p className="font-body-md text-body-md text-tertiary">
              The coaches on the floor every single day, running your sessions and checking your form.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-space-lg">
            <div className="about-anim-item bg-surface-container shadow-hard border border-surface-variant/40 hover:border-primary-container transition-all duration-300 flex flex-col p-space-xl">
              <div className="flex items-center gap-space-md mb-space-md">
                <CoachAvatar src="/images/coach-vaibhav.jpg" alt="Coach Vaibhav, bodybuilding prep coach at Fitness Future Gym" name="Coach Vaibhav" sizeClass="w-16 h-16" borderClass="border-primary-container" />
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
                    BODYBUILDING PREP COACH &amp; FITNESS PROFESSIONAL
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-wide">
                    Coach Vaibhav
                  </h3>
                </div>
              </div>
              <p className="font-body-md text-body-md text-tertiary leading-relaxed">
                8+ years strength &amp; biomechanics specialist. Maximal compound loading, lumbar safety protocols, and competition deadlift/squat setup — trained over 1,500+ lifters from raw beginners to 250kg+ pullers.
              </p>
              <span className="inline-flex items-center gap-space-2xs self-start bg-primary-container text-on-primary-container font-label-sm text-label-sm uppercase tracking-wide px-space-sm py-space-2xs font-bold mt-space-sm">
                <span className="material-symbols-outlined text-label-lg leading-none">military_tech</span>
                IBBFF (FFBA Delhi Judge)
              </span>
              <div className="grid grid-cols-3 gap-space-xs mt-space-md bg-surface-container-high p-space-sm border border-surface-variant/30">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase text-outline">Best Squat</span>
                  <span className="font-title-sm text-title-sm text-on-surface">220 KG</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase text-outline">Best Deadlift</span>
                  <span className="font-title-sm text-title-sm text-primary-container">250 KG</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase text-outline">Specialty</span>
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

            <div className="about-anim-item bg-surface-container shadow-hard border border-surface-variant/40 hover:border-primary-container transition-all duration-300 flex flex-col p-space-xl">
              <div className="flex items-center gap-space-md mb-space-md">
                <CoachAvatar src="/images/coach-hritik.jpg" alt="Coach Hritik, bodybuilding prep coach at Fitness Future Gym" name="Coach Hritik" sizeClass="w-16 h-16" />
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
                    BODYBUILDING PREP COACH &amp; FITNESS PROFESSIONAL
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-wide">
                    Coach Hritik
                  </h3>
                </div>
              </div>
              <p className="font-body-md text-body-md text-tertiary leading-relaxed">
                Focuses on hypertrophy programming, physique architecture, and custom Indian nutrition blueprints — oversees body transformation and recomposition protocols for 70+ athletes.
              </p>
              <div className="grid grid-cols-3 gap-space-xs mt-space-md bg-surface-container-high p-space-sm border border-surface-variant/30">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase text-outline">Best Bench</span>
                  <span className="font-title-sm text-title-sm text-on-surface">170 KG</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase text-outline">Body Recomp</span>
                  <span className="font-title-sm text-title-sm text-primary-container">70+ Athletes</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase text-outline">Specialty</span>
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
      </section>
    </div>
  );
}
