"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const HOURS = [
  { day: "Monday – Thursday", time: "6:00 AM – 11:00 PM", status: "Full Access" },
  { day: "Friday", time: "6:00 AM – 11:00 PM", status: "Full Access" },
  { day: "Saturday", time: "6:00 AM – 11:00 PM", status: "Heavy Lifting Day" },
  { day: "Sunday", time: "Closed", status: "Tactical Recovery" },
];

export default function LocationPage() {
  const [submitted, setSubmitted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".loc-hero-anim",
        { y: 35, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: "power3.out" }
      );

      gsap.fromTo(
        ".loc-card-anim",
        { y: 45, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".loc-sec-trigger",
            start: "top 80%",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col w-full">
      {/* 2. TITLE BLOCK */}
      <section className="w-full bg-surface-container-low py-space-2xl px-gutter-mobile lg:px-gutter-desktop border-b border-surface-variant/40">
        <div className="max-w-container-max mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-end">
            <div className="lg:col-span-8 flex flex-col gap-space-xs">
              <div className="loc-hero-anim inline-flex items-center gap-space-xs">
                <span className="h-px w-8 bg-primary-container"></span>
                <span className="font-label-md text-label-md uppercase tracking-widest text-primary-container font-bold">
                  DISPATCH // IRON LOGISTICS
                </span>
              </div>
              <h1 className="loc-hero-anim font-display-xl text-display-xl-mobile sm:text-display-xl uppercase text-on-surface tracking-tight m-0">
                LOCATION &amp; TIMINGS
              </h1>
              <p className="loc-hero-anim font-body-lg text-body-lg text-tertiary max-w-2xl">
                Direct access to Nangloi&apos;s premier heavy lifting floor. Unyielding equipment, calibrated racks, and zero fluff. Come prepared to lift.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col justify-end lg:items-end">
              <div className="loc-hero-anim bg-surface-container-high p-space-md w-full lg:max-w-xs shadow-md border border-surface-variant/40">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline block">
                  QUICK ACCESS HOTLINE
                </span>
                <a
                  className="font-headline-sm text-headline-sm text-primary-container tracking-wider hover:text-on-surface transition-colors block mt-space-2xs"
                  href="tel:+919876543210"
                >
                  +91 98765 43210
                </a>
                <span className="font-body-sm text-body-sm text-on-surface-variant block">
                  Desk Attendants On Floor: 06:00 - 23:00
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MAIN CONTENT GRID */}
      <section className="loc-sec-trigger w-full py-space-3xl px-gutter-mobile lg:px-gutter-desktop bg-background">
        <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
          {/* Left Specs */}
          <div className="lg:col-span-6 flex flex-col gap-space-2xl">
            {/* Physical Address Panel */}
            <div className="loc-card-anim bg-surface-container-low p-space-xl relative shadow-hard border border-surface-variant/40 hover:border-primary-container transition-colors">
              <div className="flex items-center justify-between pb-space-md border-b border-surface-variant/30">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary-container text-headline-sm">
                    pin_drop
                  </span>
                  <span className="font-headline-sm text-headline-sm uppercase text-on-surface">
                    GROUND FLOOR STATION
                  </span>
                </div>
                <span className="font-label-sm text-label-sm uppercase bg-surface-container text-primary-container px-space-xs py-space-2xs font-bold">
                  ZONE 01
                </span>
              </div>
              <div className="space-y-space-md mt-space-md">
                <div>
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline block">
                    MAILING ADDRESS &amp; COMPOUND
                  </span>
                  <p className="font-body-lg text-body-lg text-on-surface font-semibold mt-space-2xs leading-snug">
                    KH.No.52, Shop No.5, Plot No.8-A, Near Rao Vihar, Inder Enclave, Nangloi, Delhi – 110041
                  </p>
                </div>

                <div className="bg-surface-container-high p-space-md text-on-surface shadow-sm border border-surface-variant/30">
                  <div className="flex items-start gap-space-xs">
                    <span className="material-symbols-outlined text-primary-container text-title-md shrink-0">
                      navigation
                    </span>
                    <div>
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold block">
                        Tactical Landmark Guide
                      </span>
                      <p className="font-body-sm text-body-sm text-on-surface mt-space-2xs">
                        Near RR Motors and SBI ATM — easily accessible from Nangloi Metro Station. Direct turn into Inder Enclave service lane.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md pt-space-xs">
                  <div className="bg-surface-container p-space-md flex flex-col justify-between border border-surface-variant/30">
                    <div>
                      <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline block">
                        VOICE COMM
                      </span>
                      <p className="font-title-sm text-title-sm text-on-surface mt-space-2xs">+91 98765 43210</p>
                    </div>
                    <a
                      className="mt-space-sm inline-flex items-center gap-space-2xs font-label-md text-label-md uppercase text-primary-container hover:text-on-surface transition-colors"
                      href="tel:+919876543210"
                    >
                      <span className="material-symbols-outlined text-label-lg">call</span> CALL FRONT DESK
                    </a>
                  </div>
                  <div className="bg-surface-container p-space-md flex flex-col justify-between border border-surface-variant/30">
                    <div>
                      <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline block">
                        WHATSAPP ROSTER
                      </span>
                      <p className="font-title-sm text-title-sm text-on-surface mt-space-2xs">+91 98765 43210</p>
                    </div>
                    <a
                      className="mt-space-sm inline-flex items-center gap-space-2xs font-label-md text-label-md uppercase text-primary-container hover:text-on-surface transition-colors"
                      href="https://wa.me/919876543210"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="material-symbols-outlined text-label-lg">chat</span> INITIATE CHAT
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Timings Table */}
            <div className="loc-card-anim bg-surface-container-low p-space-xl shadow-hard border border-surface-variant/40">
              <div className="flex items-center justify-between pb-space-md border-b border-surface-variant/40">
                <span className="font-headline-sm text-headline-sm uppercase text-on-surface">
                  OPERATIONAL TIMINGS
                </span>
                <span className="font-label-sm text-label-sm uppercase text-primary-container font-bold">
                  6 DAYS / WEEK
                </span>
              </div>
              <div className="flex flex-col mt-space-md divide-y divide-surface-variant/40">
                {HOURS.map((row) => (
                  <div key={row.day} className="flex flex-col sm:flex-row sm:items-center justify-between py-space-sm gap-space-xs">
                    <span className="font-label-md text-label-md uppercase text-on-surface font-bold">
                      {row.day}
                    </span>
                    <div className="flex items-center gap-space-md">
                      <span className="font-body-md text-body-md text-primary-container font-mono">
                        {row.time}
                      </span>
                      <span className="font-label-sm text-label-sm uppercase text-tertiary bg-surface-container px-space-xs py-space-2xs">
                        {row.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Map & Form */}
          <div className="lg:col-span-6 flex flex-col gap-space-2xl">
            {/* Embedded Location Map Preview */}
            <div className="loc-card-anim bg-surface-container-low p-space-lg shadow-hard border border-surface-variant/40 flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline">
                  MAP VECTOR // NANGLOI STATION
                </span>
                <a
                  href="https://maps.google.com/?q=Nangloi+Delhi+110041"
                  target="_blank"
                  rel="noreferrer"
                  className="font-label-sm text-label-sm uppercase text-primary-container hover:underline"
                >
                  Open in Google Maps ↗
                </a>
              </div>
              <div className="w-full h-72 bg-surface-container flex items-center justify-center relative overflow-hidden border border-surface-variant/30">
                <iframe
                  title="Nangloi Location Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13998.243577366367!2d77.0543666!3d28.6835467!2m3!1f00!2f00!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d0b0451cf1ec7%3A0xbcefb142e032d847!2sNangloi%2C%20Delhi%2C%20110041!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                  className="w-full h-full border-0 filter contrast-125 brightness-90 grayscale opacity-80 hover:opacity-100 transition-opacity"
                  loading="lazy"
                ></iframe>
              </div>
            </div>

            {/* Quick Inquiry Form */}
            <div className="loc-card-anim bg-surface-container p-space-xl shadow-hard border border-surface-variant/40">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold block mb-space-2xs">
                DIRECT INQUIRY DISPATCH
              </span>
              <h3 className="font-headline-sm text-headline-sm uppercase text-on-surface mb-space-md">
                SEND A MESSAGE TO FRONT DESK
              </h3>

              {!submitted ? (
                <form
                  className="flex flex-col gap-space-sm"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubmitted(true);
                  }}
                >
                  <div>
                    <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-space-2xs">
                      Full Name
                    </label>
                    <input
                      required
                      className="w-full bg-surface-container-low border border-surface-variant text-on-surface font-body-md px-space-md py-space-sm outline-none focus:border-primary-container"
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-space-2xs">
                      WhatsApp / Phone
                    </label>
                    <input
                      required
                      type="tel"
                      className="w-full bg-surface-container-low border border-surface-variant text-on-surface font-body-md px-space-md py-space-sm outline-none focus:border-primary-container"
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-space-2xs">
                      Inquiry Note
                    </label>
                    <textarea
                      rows={3}
                      className="w-full bg-surface-container-low border border-surface-variant text-on-surface font-body-md px-space-md py-space-sm outline-none focus:border-primary-container"
                      placeholder="e.g. Want to inquire about personal training slots or monthly pass."
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label-lg text-label-lg uppercase font-bold px-space-xl py-space-md shadow-hard transition-all cursor-pointer mt-space-2xs hover:scale-[1.01] active:scale-[0.99]"
                  >
                    Submit Inquiry
                  </button>
                </form>
              ) : (
                <div className="bg-surface-container-lowest p-space-lg text-center border border-primary-container">
                  <span className="material-symbols-outlined text-primary-container text-headline-md">
                    check_circle
                  </span>
                  <p className="font-headline-sm text-headline-sm uppercase text-on-surface mt-space-xs">
                    INQUIRY TRANSMITTED
                  </p>
                  <p className="font-body-sm text-body-sm text-tertiary mt-space-2xs">
                    Front desk will respond via WhatsApp or call shortly.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
