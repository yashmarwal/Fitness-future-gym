"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface FAQItem {
  id: string;
  category: "general" | "pricing" | "coaching" | "rules";
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: "faq-1",
    category: "general",
    question: "Is Fitness Future Gym suitable for complete beginners who have never touched a barbell?",
    answer: "Yes, 100%. Every new member undergoes a mandatory 15-minute floor orientation where Coach Vaibhav or Coach Hritik audits your hip mobility, ankle tracking, and lumbar safety before you lift heavy.",
  },
  {
    id: "faq-2",
    category: "rules",
    question: "What is the floor code and unisex training environment policy?",
    answer: "We maintain an ironclad zero-harassment, zero-vanity policy. Lifters respect each other's platform space, re-rack weights after sets, and focus on physical discipline. Female powerlifters and male athletes train with equal authority.",
  },
  {
    id: "faq-3",
    category: "pricing",
    question: "How does the 2-Day Free Trial pass work?",
    answer: "Register your phone on our Membership page. You get an instant WhatsApp pass granting 48 hours of full floor access, day locker privileges, and initial coach screening without high-pressure sales calls.",
  },
  {
    id: "faq-4",
    category: "coaching",
    question: "What makes Coach Vaibhav & Hritik's personal training different from commercial gyms?",
    answer: "Direct biomechanical coaching. We do not stand around scrolling on phones. We audit your bar path, intra-abdominal pressure, and strength curves, ensuring every rep pushes progressive overload safely.",
  },
  {
    id: "faq-5",
    category: "general",
    question: "What are the peak and off-peak training hours?",
    answer: "Morning peak is 07:00 AM – 09:30 AM; Evening peak is 06:30 PM – 09:00 PM. Off-peak blocks (11:00 AM – 04:00 PM) offer wide open squat cages and deadlift platforms.",
  },
  {
    id: "faq-6",
    category: "pricing",
    question: "Are there student or armed forces recruitment discounts available?",
    answer: "Yes. College students and recruits preparing for Delhi Police / Paramilitary physical testing receive special concession rates upon presenting valid ID proof at the front desk.",
  },
  {
    id: "faq-7",
    category: "coaching",
    question: "Does the gym provide custom Indian meal plans for vegetarian lifters?",
    answer: "Yes. Coach Hritik designs tailored macro plans utilizing Indian staples—paneer, soya chunks, eggs, curd, and dal—calculating precise protein efficiency without pushing unvetted supplements.",
  },
  {
    id: "faq-8",
    category: "rules",
    question: "Can I freeze my membership if I am traveling or sick?",
    answer: "Quarterly members receive up to 15 days of membership freeze, and Annual members receive 30 days of freeze allowance upon advance notification.",
  },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openFaq, setOpenFaq] = useState<string | null>("faq-1");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".faq-hero-anim",
        { y: 35, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: "power3.out" }
      );

      gsap.fromTo(
        ".faq-list-anim",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".faq-sec-trigger",
            start: "top 80%",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const filteredFaqs =
    activeCategory === "all" ? FAQS : FAQS.filter((f) => f.category === activeCategory);

  return (
    <div ref={containerRef} className="flex flex-col w-full min-h-screen bg-background">
      {/* 1. HERO HEADER */}
      <section className="relative w-full bg-surface-container-lowest overflow-hidden py-space-2xl border-b border-surface-variant/40">
        <div className="max-w-container-max mx-auto px-gutter-mobile lg:px-gutter-desktop">
          <div className="flex flex-col gap-space-xs max-w-3xl">
            <div className="faq-hero-anim flex items-center gap-space-xs">
              <span className="w-2.5 h-2.5 bg-primary-container inline-block animate-pulse"></span>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
                DISPATCH // KNOWLEDGE BASE
              </span>
            </div>
            <h1 className="faq-hero-anim font-display-xl text-display-xl-mobile sm:text-display-xl uppercase text-on-surface tracking-tight m-0">
              FREQUENTLY ASKED QUESTIONS
            </h1>
            <p className="faq-hero-anim font-body-lg text-body-lg text-tertiary">
              Direct, unvarnished answers about floor etiquette, personal training with Coach Vaibhav &amp; Hritik, trial pass access, and membership rules.
            </p>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY FILTER TABS & LIST */}
      <section className="faq-sec-trigger w-full py-space-3xl px-gutter-mobile lg:px-gutter-desktop">
        <div className="max-w-container-max mx-auto">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-space-xs flex-wrap mb-space-2xl">
            {[
              { id: "all", label: "ALL QUESTIONS" },
              { id: "general", label: "GENERAL & FLOOR" },
              { id: "coaching", label: "COACHING & DIET" },
              { id: "pricing", label: "TRIALS & PRICING" },
              { id: "rules", label: "RULES & FREEZE" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`font-label-md text-label-md uppercase px-space-md py-space-sm transition-all duration-150 border cursor-pointer ${
                  activeCategory === tab.id
                    ? "bg-primary-container text-on-primary-container border-primary-container font-bold shadow-md"
                    : "bg-surface-container-low text-tertiary border-surface-variant/40 hover:text-on-surface hover:border-surface-variant"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Accordion FAQ Grid */}
          <div className="flex flex-col gap-space-md max-w-4xl">
            {filteredFaqs.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`faq-list-anim bg-surface-container-low border transition-all duration-200 shadow-md ${
                    isOpen ? "border-primary-container bg-surface-container/70" : "border-surface-variant/40 hover:border-surface-variant"
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                    className="w-full p-space-lg flex items-center justify-between text-left cursor-pointer gap-space-md active:scale-[0.99] transition-transform"
                  >
                    <span className="font-title-md text-title-md uppercase text-on-surface tracking-wide">
                      {faq.question}
                    </span>
                    <span
                      className={`material-symbols-outlined text-primary-container transition-transform duration-300 shrink-0 ${
                        isOpen ? "rotate-180 text-primary-container font-bold" : "rotate-0"
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden px-space-lg pb-space-lg pt-0 text-tertiary font-body-md leading-relaxed">
                      <p className="pt-space-sm border-t border-surface-variant/30">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Still Have Questions CTA */}
          <div className="mt-space-3xl bg-surface-container p-space-xl border border-surface-variant/40 shadow-hard flex flex-col md:flex-row items-center justify-between gap-space-md max-w-4xl">
            <div>
              <span className="font-label-sm text-label-sm uppercase text-primary-container font-bold tracking-widest">STILL HAVE QUESTIONS?</span>
              <h3 className="font-headline-sm text-headline-sm uppercase text-on-surface mt-space-2xs">TALK DIRECTLY WITH OUR FRONT DESK</h3>
              <p className="font-body-sm text-body-sm text-tertiary">Our team is available 6 days a week via call or WhatsApp.</p>
            </div>
            <div className="flex items-center gap-space-sm shrink-0">
              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noreferrer"
                className="bg-primary-container text-on-primary-container font-label-md text-label-md uppercase font-bold px-space-lg py-space-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform inline-flex items-center gap-space-xs"
              >
                <span className="material-symbols-outlined text-title-md">chat</span>
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
