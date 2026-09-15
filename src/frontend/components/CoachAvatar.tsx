"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

// Shared avatar used on every coach card (About + Home, desktop + mobile)
// — real headshot replacing the old "V"/"H" initial-letter placeholder box.
// Structure/behavior modeled after a known-good tappable-photo + full-screen
// lightbox pattern the user pointed to from another of their projects
// (mapps creation's FounderSection.tsx): a plain clickable div (not a
// <button> wrapping a next/image `fill` child — nesting `fill` inside a
// <button> is a known source of layout quirks from the button's own
// box-model), a hover "tap to enlarge" hint, and a modal that shows the
// FULL photo via `object-contain` (never cropped, unlike the thumbnail's
// deliberate `object-cover` crop) with a name caption underneath.
export default function CoachAvatar({
  src,
  alt,
  name,
  sizeClass = "w-16 h-16 sm:w-20 sm:h-20",
  borderClass = "border-primary-container/40",
  imgSize = 160,
}: {
  src: string;
  alt: string;
  name: string;
  sizeClass?: string;
  borderClass?: string;
  imgSize?: number;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [open]);

  return (
    <>
      {/* Tappable Photo Frame */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        title="Click/tap to view full screen"
        aria-label={`Enlarge photo of ${name}`}
        className="relative shrink-0 cursor-pointer group select-none touch-manipulation active:scale-95 transition-transform"
      >
        <div className={`${sizeClass} overflow-hidden rounded-2xl border ${borderClass} bg-surface-container-high p-1 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:border-primary-container`}>
          <div className="relative w-full h-full overflow-hidden rounded-xl">
            <Image src={src} alt={alt} fill sizes={`${imgSize}px`} className="object-cover" priority />
          </div>
        </div>

        {/* Active Leadership Green Dot Indicator */}
        <span
          className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-surface-container-lowest shadow-sm"
          title="Active Leadership"
        />
      </div>

      {/* Full-Screen Lightbox Modal — rendered via a portal straight into
          document.body, NOT as a normal descendant here. This matters: the
          coach cards this avatar sits inside are GSAP-animated
          (.coach-card / .about-anim-item), and GSAP leaves an inline
          `transform` on an element after animating it in. Per the CSS spec,
          any ancestor with an active `transform` becomes the containing
          block for `position: fixed` descendants INSTEAD of the real
          viewport — so without the portal, this "fixed, full-screen"
          modal was actually being sized/centered relative to that small
          card, not the page, which is exactly why it wasn't rendering as a
          true centered popup. Portaling to document.body sidesteps the
          whole class of bug regardless of what any ancestor's CSS does. */}
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 sm:p-6 backdrop-blur-xl overflow-y-auto select-none"
            onClick={() => setOpen(false)}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close full-screen image"
              className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[10000] min-w-[44px] min-h-[44px] flex items-center justify-center bg-surface-container-high/90 border border-surface-variant/60 text-on-surface hover:bg-primary-container hover:text-on-primary-container p-2.5 rounded-full transition-all cursor-pointer shadow-xl active:scale-90"
            >
              <span className="material-symbols-outlined text-2xl leading-none">close</span>
            </button>

            {/* Modal Image Box - Full View. No max-h/overflow-hidden on this
                outer box — that was a separate earlier bug: the image plus
                the caption block below it could add up to more height than
                a hard vh cap allowed, and overflow-hidden silently sliced
                off whatever didn't fit (worse on mobile, where 100vh
                doesn't account for the browser's address bar). Instead the
                image itself is capped low enough to leave real headroom for
                the caption in the common case, and this whole backdrop
                scrolls (overflow-y-auto above) as a safety net for anything
                still too tall for a given screen — nothing gets silently
                clipped. */}
            <div
              className="relative w-full max-w-[92vw] sm:max-w-xl rounded-2xl sm:rounded-3xl border border-primary-container/40 bg-surface-container-lowest p-2 sm:p-3 shadow-[0_0_80px_rgba(224,86,36,0.3)] flex flex-col items-center my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl bg-black/80 w-full">
                <img
                  src={src}
                  alt={`${name}, full view`}
                  className="max-h-[55vh] sm:max-h-[60vh] w-auto max-w-full rounded-xl sm:rounded-2xl object-contain"
                />
              </div>

              <div className="bg-surface-container-lowest/90 px-3 py-3 sm:p-3.5 text-center flex flex-col items-center w-full">
                <h4 className="font-serif text-base sm:text-lg font-bold text-on-surface uppercase tracking-wide">{name}</h4>
                <p className="text-primary-container text-[11px] sm:text-xs font-semibold uppercase tracking-wider mt-0.5">
                  Head Coach &amp; Founder — Fitness Future Gym
                </p>
                <p className="text-tertiary text-[10px] mt-1 sm:hidden">
                  Tap anywhere outside to close
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
