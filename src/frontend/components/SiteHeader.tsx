"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const NAV_LINKS = [
  { href: "/", label: "Home", num: "01" },
  { href: "/about", label: "About Us", num: "02" },
  { href: "/programs", label: "Programs", num: "03" },
  { href: "/membership", label: "Membership Tiers", num: "04" },
  { href: "/location", label: "Location & Timings", num: "05" },
  { href: "/faq", label: "FAQ", num: "06" },
  { href: "/blog", label: "Journal", num: "07" },
  { href: "/calculator", label: "BMI & Macro Calc", num: "08" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Instant close on route change — adjusted during render (React's documented
  // pattern for resetting state when a value changes) rather than in an effect,
  // so it takes effect on the same render instead of one tick later.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileMenuOpen(false);
    setIsAnimating(false);
  }

  // Track scroll position for dynamic header compression
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleCloseMenu = useCallback(() => {
    const el = drawerRef.current;
    if (!el || isAnimating) {
      setMobileMenuOpen(false);
      return;
    }

    setIsAnimating(true);
    const exitItems = el.querySelectorAll(".mobile-nav-item");
    const exitCta = el.querySelector(".mobile-nav-cta");

    gsap.to(exitItems, {
      x: -20,
      opacity: 0,
      duration: 0.15,
      stagger: 0.015,
      ease: "power2.in",
    });

    if (exitCta) {
      gsap.to(exitCta, {
        y: 10,
        opacity: 0,
        duration: 0.12,
        ease: "power2.in",
      });
    }

    gsap.to(el, {
      opacity: 0,
      y: -15,
      duration: 0.2,
      ease: "power3.in",
      delay: 0.1,
      onComplete: () => {
        setMobileMenuOpen(false);
        setIsAnimating(false);
      },
    });
  }, [isAnimating]);

  const handleToggleMenu = () => {
    if (isAnimating) return;

    if (!mobileMenuOpen) {
      setMobileMenuOpen(true);
    } else {
      handleCloseMenu();
    }
  };

  // GSAP entrance layout effect on open (runs BEFORE paint)
  useIsomorphicLayoutEffect(() => {
    const el = drawerRef.current;
    if (mobileMenuOpen && el) {
      setIsAnimating(true);
      const ctx = gsap.context(() => {
        const header = el.querySelector(".mobile-nav-header");
        const items = el.querySelectorAll(".mobile-nav-item");
        const cta = el.querySelector(".mobile-nav-cta");

        const tl = gsap.timeline({
          onComplete: () => setIsAnimating(false),
        });

        tl.fromTo(
          el,
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.35, ease: "power4.out" }
        );

        if (header) {
          tl.fromTo(
            header,
            { opacity: 0, y: -10 },
            { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" },
            "-=0.2"
          );
        }

        if (items.length > 0) {
          tl.fromTo(
            items,
            { opacity: 0, x: -25 },
            { opacity: 1, x: 0, duration: 0.35, stagger: 0.035, ease: "power3.out" },
            "-=0.18"
          );
        }

        if (cta) {
          tl.fromTo(
            cta,
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
            "-=0.2"
          );
        }
      }, el);

      return () => ctx.revert();
    }
  }, [mobileMenuOpen]);

  return (
    <header className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${
      scrolled
        ? "bg-surface-container-lowest/98 backdrop-blur-xl shadow-lg border-b border-primary-container/20"
        : "bg-surface-container-lowest/90 backdrop-blur-md border-b border-transparent"
    }`}>
      {/* Top Ticker */}
      <div className={`bg-surface-container border-b border-surface-variant/40 px-gutter-mobile lg:px-gutter-desktop text-center transition-all duration-300 ${
        scrolled ? "max-h-0 py-0 opacity-0 overflow-hidden" : "max-h-12 py-1 opacity-100"
      }`}>
        <p className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-semibold truncate">
          <span className="inline-block mr-space-xs">🔥</span> SWEAT | GAIN | REPEAT — 8+ YEARS OF RAW STRENGTH IN NANGLOI • CALL: +91 87009 78341
        </p>
      </div>

      {/* Main Header Bar */}
      <div className={`w-full border-b border-surface-variant/50 relative z-20 transition-all duration-300 ${
        scrolled ? "h-14 sm:h-16" : "h-16 sm:h-20"
      }`}>
        <div className="max-w-container-max mx-auto h-full px-gutter-mobile lg:px-gutter-desktop flex items-center justify-between gap-space-md">
          {/* Logo & Brand Name */}
          <div className="flex items-center gap-space-md shrink-0">
            <Link href="/" className="flex items-center gap-space-sm">
              <img
                src="/logo.jpeg"
                alt="Fitness Future Gym Logo"
                className="w-10 h-10 rounded-full object-cover border border-primary-container/40"
              />
              <span className="font-headline-sm text-headline-sm uppercase tracking-wider text-on-surface">
                Fitness Future <span className="text-primary-container">Gym</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-space-md h-full">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-label-md text-label-md uppercase tracking-wider transition-colors py-space-sm ${
                    isActive
                      ? "text-primary-container font-bold border-b-2 border-primary-container"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Header Action & Hamburger Toggle */}
          <div className="flex items-center gap-space-sm shrink-0">
            <Link
              href="/membership"
              className="hidden sm:inline-flex items-center justify-center bg-primary-container text-on-primary-container hover:bg-secondary-container hover:text-on-secondary font-label-md text-label-md uppercase font-bold px-space-md py-space-sm transition-colors duration-150 rounded-none shadow-[2px_2px_0px_#000000]"
            >
              Claim 2-Day Trial
            </Link>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              onClick={handleToggleMenu}
              className="xl:hidden w-11 h-11 flex items-center justify-center text-on-surface hover:text-primary-container bg-surface-container border border-surface-variant/40 focus:outline-none transition-all active:scale-95"
            >
              <span
                className={`material-symbols-outlined text-2xl leading-none block transition-transform duration-300 ${
                  mobileMenuOpen ? "rotate-90 text-primary-container font-bold" : "rotate-0"
                }`}
              >
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          ref={drawerRef}
          style={{ opacity: 0, transform: "translateY(-20px)" }}
          className="xl:hidden absolute top-full left-0 right-0 w-full h-[calc(100dvh-100%)] bg-gradient-to-b from-surface-container-lowest via-surface-container-low to-surface-container-lowest/98 backdrop-blur-2xl flex flex-col justify-between p-space-lg overflow-y-auto border-t border-primary-container/30 shadow-2xl z-50"
        >
          <div className="flex flex-col gap-space-md">
            <div className="mobile-nav-header flex items-center justify-between pb-space-xs border-b border-surface-variant/40" style={{ opacity: 0 }}>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-container"></span>
                </span>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
                  NAVIGATION ROSTER
                </span>
              </div>
              <span className="font-label-sm text-label-sm uppercase text-tertiary tracking-wider font-mono">
                EST. 2016
              </span>
            </div>

            <nav className="flex flex-col gap-space-2xs">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={handleCloseMenu}
                    style={{ opacity: 0 }}
                    className={`mobile-nav-item font-headline-sm text-headline-sm uppercase tracking-wider py-space-sm px-space-md border-l-2 transition-all flex items-center justify-between group active:scale-[0.99] ${
                      isActive
                        ? "text-primary-container font-bold border-primary-container bg-surface-container-high/80 shadow-sm"
                        : "text-on-surface border-transparent hover:border-primary-container/50 hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="flex items-center gap-space-md">
                      <span className="font-mono text-label-sm text-primary-container font-bold opacity-80 group-hover:opacity-100">
                        {link.num}
                      </span>
                      <span>{link.label}</span>
                    </div>
                    <span className="material-symbols-outlined text-title-sm text-tertiary group-hover:text-primary-container group-hover:translate-x-1 transition-all">
                      arrow_forward
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mobile-nav-cta pt-space-md mt-space-lg border-t border-surface-variant/40 flex flex-col gap-space-sm pb-24" style={{ opacity: 0 }}>
            <Link
              href="/membership"
              onClick={handleCloseMenu}
              className="w-full bg-primary-container text-on-primary-container font-label-lg text-label-lg uppercase font-bold py-space-md text-center tracking-wider shadow-hard flex items-center justify-center gap-space-xs hover:bg-secondary-container active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-title-md">bolt</span>
              <span>Claim Your 2-Day Free Trial</span>
            </Link>

            <div className="bg-surface-container p-space-sm flex items-center justify-between border border-surface-variant/30 text-body-sm font-body-sm">
              <span className="text-tertiary">Front Desk Hotline:</span>
              <a href="tel:+918700978341" className="text-primary-container font-bold font-mono">
                +91 87009 78341
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
