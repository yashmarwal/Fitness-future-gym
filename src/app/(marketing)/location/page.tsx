"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { submitToWeb3Forms } from "@/frontend/lib/web3forms";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const HOURS = [
  { day: "Monday – Thursday", time: "5:00 AM – 11:00 AM & 4:00 PM – 11:00 PM", status: "Full Access" },
  { day: "Friday", time: "5:00 AM – 11:00 AM & 4:00 PM – 11:00 PM", status: "Full Access" },
  { day: "Saturday", time: "5:00 AM – 11:00 AM & 4:00 PM – 11:00 PM", status: "Heavy Lifting Day" },
  { day: "Sunday", time: "Closed", status: "Tactical Recovery" },
];

export default function LocationPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  async function handleInquirySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    const result = await submitToWeb3Forms({
      subject: "New Inquiry — Fitness Future Gym Location Page",
      from_name: "Fitness Future Gym Website",
      name: String(data.get("name") ?? ""),
      phone: String(data.get("phone") ?? ""),
      message: String(data.get("message") ?? ""),
    });
    setSubmitting(false);
    if (result.ok) {
      setSubmitted(true);
    } else {
      setError(result.message ?? "Something went wrong. Please try again.");
    }
  }

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
                <div className="mt-space-2xs flex flex-col gap-space-2xs">
                  <div>
                    <span className="font-label-sm text-label-sm uppercase text-outline">Coach Vaibhav</span>
                    <a
                      className="font-headline-sm text-headline-sm text-primary-container tracking-wider hover:text-on-surface transition-colors block"
                      href="tel:+919643526435"
                    >
                      +91 96435 26435
                    </a>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm uppercase text-outline">Coach Hritik</span>
                    <a
                      className="font-headline-sm text-headline-sm text-primary-container tracking-wider hover:text-on-surface transition-colors block"
                      href="tel:+918700978341"
                    >
                      +91 87009 78341
                    </a>
                  </div>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant block mt-space-2xs">
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
                    KH.No.52, Shop No.5 Plot No.8-A, 18, near Rao Vihar, Rao Vihar, Nangloi, Delhi, 110041
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
                        Near RR Motors and SBI ATM.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md pt-space-xs">
                  <div className="bg-surface-container p-space-md flex flex-col justify-between border border-surface-variant/30">
                    <div>
                      <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline block">
                        COACH VAIBHAV
                      </span>
                      <p className="font-title-sm text-title-sm text-on-surface mt-space-2xs">+91 96435 26435</p>
                    </div>
                    <div className="mt-space-sm flex items-center gap-space-md">
                      <a
                        className="inline-flex items-center gap-space-2xs font-label-md text-label-md uppercase text-primary-container hover:text-on-surface transition-colors"
                        href="tel:+919643526435"
                      >
                        <span className="material-symbols-outlined text-label-lg">call</span> CALL
                      </a>
                      <a
                        className="inline-flex items-center gap-space-2xs font-label-md text-label-md uppercase text-primary-container hover:text-on-surface transition-colors"
                        href="https://wa.me/919643526435"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="material-symbols-outlined text-label-lg">chat</span> CHAT
                      </a>
                    </div>
                  </div>
                  <div className="bg-surface-container p-space-md flex flex-col justify-between border border-surface-variant/30">
                    <div>
                      <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline block">
                        COACH HRITIK
                      </span>
                      <p className="font-title-sm text-title-sm text-on-surface mt-space-2xs">+91 87009 78341</p>
                    </div>
                    <div className="mt-space-sm flex items-center gap-space-md">
                      <a
                        className="inline-flex items-center gap-space-2xs font-label-md text-label-md uppercase text-primary-container hover:text-on-surface transition-colors"
                        href="tel:+918700978341"
                      >
                        <span className="material-symbols-outlined text-label-lg">call</span> CALL
                      </a>
                      <a
                        className="inline-flex items-center gap-space-2xs font-label-md text-label-md uppercase text-primary-container hover:text-on-surface transition-colors"
                        href="https://wa.me/918700978341"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="material-symbols-outlined text-label-lg">chat</span> CHAT
                      </a>
                    </div>
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
              <div className="flex items-center justify-between flex-wrap gap-space-xs">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline">
                  MAP VECTOR // NANGLOI STATION
                </span>
                <div className="flex items-center gap-space-md">
                  <a
                    href="https://maps.app.goo.gl/za8QGX3eCtruW7FK7"
                    target="_blank"
                    rel="noreferrer"
                    className="font-label-sm text-label-sm uppercase text-primary-container hover:underline"
                  >
                    Open in Google Maps ↗
                  </a>
                  <a
                    href="https://maps.app.goo.gl/za8QGX3eCtruW7FK7"
                    target="_blank"
                    rel="noreferrer"
                    className="font-label-sm text-label-sm uppercase text-primary-container hover:underline"
                  >
                    Rate Us on Google ↗
                  </a>
                </div>
              </div>
              <div className="w-full h-72 bg-surface-container flex items-center justify-center relative overflow-hidden border border-surface-variant/30">
                <iframe
                  title="Nangloi Location Map"
                  src="https://www.google.com/maps?q=KH.No.52%2C%20Shop%20No.5%20Plot%20No.8-A%2C%2018%2C%20near%20Rao%20Vihar%2C%20Rao%20Vihar%2C%20Nangloi%2C%20Delhi%2C%20110041&output=embed"
                  className="w-full h-full border-0 filter contrast-125 brightness-90 grayscale opacity-80 hover:opacity-100 transition-opacity"
                  loading="lazy"
                ></iframe>
              </div>
            </div>

            {/* Quick Inquiry Form */}
            <div id="inquiry" className="loc-card-anim bg-surface-container p-space-xl shadow-hard border border-surface-variant/40 scroll-mt-24">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold block mb-space-2xs">
                DIRECT INQUIRY DISPATCH
              </span>
              <h3 className="font-headline-sm text-headline-sm uppercase text-on-surface mb-space-md">
                SEND A MESSAGE TO FRONT DESK
              </h3>

              {!submitted ? (
                <form className="flex flex-col gap-space-sm" onSubmit={handleInquirySubmit}>
                  <div>
                    <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-space-2xs">
                      Full Name
                    </label>
                    <input
                      required
                      name="name"
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
                      name="phone"
                      type="tel"
                      className="w-full bg-surface-container-low border border-surface-variant text-on-surface font-body-md px-space-md py-space-sm outline-none focus:border-primary-container"
                      placeholder="+91 87009 78341"
                    />
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-space-2xs">
                      Inquiry Note
                    </label>
                    <textarea
                      rows={3}
                      name="message"
                      className="w-full bg-surface-container-low border border-surface-variant text-on-surface font-body-md px-space-md py-space-sm outline-none focus:border-primary-container"
                      placeholder="e.g. Want to inquire about personal training slots or monthly pass."
                    />
                  </div>
                  {error && (
                    <p className="font-body-sm text-body-sm text-error-container bg-error/10 border border-error-container/40 px-space-sm py-space-xs">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label-lg text-label-lg uppercase font-bold px-space-xl py-space-md shadow-hard transition-all cursor-pointer mt-space-2xs hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {submitting ? "Sending…" : "Submit Inquiry"}
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
