"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface Article {
  slug: string;
  category: string;
  date: string;
  title: string;
  readTime: string;
  excerpt: string;
  author: string;
}

const ARTICLES: Article[] = [
  {
    slug: "progressive-overload-barbell",
    category: "STRENGTH PROTOCOL",
    date: "SEPT 02, 2026",
    title: "THE MATHEMATICS OF PROGRESSIVE OVERLOAD: WHY 1.25KG PLATES MATTER",
    readTime: "6 MIN READ",
    excerpt: "Most lifters stall because they try to make 10kg jumps every workout. Here is how micro-loading 1.25kg plates forces continuous neural and structural hypertrophy without breaking lumbar integrity.",
    author: "COACH VAIBHAV",
  },
  {
    slug: "indian-vegetarian-protein-guide",
    category: "BIO-FUEL NUTRITION",
    date: "AUG 28, 2026",
    title: "HIGH-PROTEIN INDIAN DIET BLUEPRINT FOR VEGETARIAN POWERLIFTERS",
    readTime: "8 MIN READ",
    excerpt: "How to hit 160g+ daily protein using paneer, soya chunks, roasted chana, dahi, and whey without blowing your daily caloric ceiling or digestive comfort.",
    author: "COACH HRITIK",
  },
  {
    slug: "delhi-police-physical-test-guide",
    category: "RECRUITMENT CONDITIONING",
    date: "AUG 15, 2026",
    title: "12-WEEK ENDURANCE & HIGH JUMP PREP FOR POLICE PHYSICAL TESTS",
    readTime: "7 MIN READ",
    excerpt: "A tactical 3-phase training protocol designed for police and paramilitary recruits in Nangloi targeting peak 1600m run times and vertical jump clearance.",
    author: "COACH VAIBHAV",
  },
  {
    slug: "deadlift-lumbar-mechanics",
    category: "BIOMECHANICS",
    date: "AUG 04, 2026",
    title: "CONVENTIONAL VS SUMO DEADLIFT: AUDITING YOUR HIPS & ANKLE MOBILITY",
    readTime: "5 MIN READ",
    excerpt: "Stop copying internet lifters. Learn how femur length and pelvic socket depth dictate whether you should pull conventional or sumo for pain-free 200kg+ lifts.",
    author: "COACH VAIBHAV",
  },
];

export default function BlogPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".blog-hero-anim",
        { y: 35, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: "power3.out" }
      );

      gsap.fromTo(
        ".blog-card-anim",
        { y: 45, opacity: 0, scale: 0.97 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.75,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".blog-sec-trigger",
            start: "top 80%",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col w-full min-h-screen bg-background">
      {/* 1. HERO HEADER */}
      <section className="w-full bg-surface-container-lowest px-gutter-mobile lg:px-gutter-desktop py-space-2xl border-b border-surface-variant/40">
        <div className="max-w-container-max mx-auto">
          <div className="flex flex-col gap-space-xs max-w-3xl">
            <div className="blog-hero-anim flex items-center gap-space-xs">
              <span className="w-2.5 h-2.5 bg-primary-container inline-block animate-pulse"></span>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
                DISPATCH // JOURNAL &amp; DOSSIERS
              </span>
            </div>
            <h1 className="blog-hero-anim font-display-xl text-display-xl-mobile sm:text-display-xl uppercase text-on-surface tracking-tight m-0">
              IRON ATHLETE JOURNAL
            </h1>
            <p className="blog-hero-anim font-body-lg text-body-lg text-tertiary">
              Unfiltered athletic dossiers, Indian macro nutrition protocols, and biomechanical guides authored by Coach Vaibhav &amp; Coach Hritik.
            </p>
          </div>
        </div>
      </section>

      {/* 2. ARTICLES LIST */}
      <section className="blog-sec-trigger w-full py-space-3xl px-gutter-mobile lg:px-gutter-desktop">
        <div className="max-w-container-max mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-xl">
            {ARTICLES.map((art) => (
              <article
                key={art.slug}
                className="blog-card-anim bg-surface-container-low border border-surface-variant/40 p-space-xl shadow-hard flex flex-col justify-between hover:border-primary-container transition-all duration-300 group hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between gap-space-sm mb-space-sm">
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold bg-surface-container px-space-xs py-space-2xs">
                      {art.category}
                    </span>
                    <span className="font-label-sm text-label-sm uppercase text-tertiary font-mono">
                      {art.readTime}
                    </span>
                  </div>
                  <h2 className="font-headline-md text-headline-md uppercase text-on-surface group-hover:text-primary-container transition-colors mb-space-sm leading-snug">
                    {art.title}
                  </h2>
                  <p className="font-body-md text-body-md text-tertiary leading-relaxed mb-space-lg">
                    {art.excerpt}
                  </p>
                </div>

                <div className="pt-space-md border-t border-surface-variant/30 flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-primary-container text-title-sm">badge</span>
                    <span className="font-label-sm text-label-sm uppercase text-on-surface font-bold">
                      {art.author}
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm uppercase text-tertiary font-mono">
                    {art.date}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
