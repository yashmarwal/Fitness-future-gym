"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

// Real gym members/competitors, shared directly by the owner for this wall
// (see the conversation this was built from — usage confirmed). Compressed
// to ~30-55KB each (public/images/athletes) so 15 photos add well under
// 600KB total, not a meaningful weight hit even though the strip is
// duplicated for the seamless scroll loop below.
const ATHLETES = Array.from({ length: 15 }, (_, i) => ({
  src: `/images/athletes/athlete-${i + 1}.jpg`,
  alt: "Fitness Future Gym athlete",
}));

const AUTO_SCROLL_PX_PER_FRAME = 0.6;
const RESUME_DELAY_MS = 2500;
const DRAG_CLICK_THRESHOLD_PX = 6;

// Auto-scrolling, finger/mouse-draggable marquee with a tap-to-enlarge
// lightbox. The list renders TWICE back to back and every scroll position
// (auto-scroll tick or a manual drag) wraps at exactly half the track's
// width, so the seam between the two copies is invisible and dragging never
// visibly "runs out" of photos in either direction.
//
// Movement is driven entirely by writing `scrollLeft` in JS — for both the
// idle auto-scroll AND a drag — rather than a CSS transform for the
// animation plus native browser scrolling for drag, which would fight each
// other on the same element. `touch-action: pan-y` lets vertical page
// scroll still pass through untouched while horizontal drag is handled here.
export default function AthleteWall() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const halfWidthRef = useRef(0);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const movedRef = useRef(false);
  const pendingIndexRef = useRef<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    halfWidthRef.current = el.scrollWidth / 2;

    // Dragging still works either way — this only skips the idle
    // auto-scroll for anyone who's asked their OS/browser to reduce motion.
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let raf: number;
    function tick() {
      const node = scrollerRef.current;
      if (node && !pausedRef.current && halfWidthRef.current > 0) {
        node.scrollLeft += AUTO_SCROLL_PX_PER_FRAME;
        if (node.scrollLeft >= halfWidthRef.current) node.scrollLeft -= halfWidthRef.current;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function pause() {
    pausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  }

  function scheduleResume() {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, RESUME_DELAY_MS);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = scrollerRef.current;
    if (!el) return;
    draggingRef.current = true;
    movedRef.current = false;
    dragStartXRef.current = e.clientX;
    dragStartScrollRef.current = el.scrollLeft;
    pause();
    el.setPointerCapture(e.pointerId);

    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-athlete-index]");
    pendingIndexRef.current = target ? Number(target.dataset.athleteIndex) : null;
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const el = scrollerRef.current;
    if (!el || halfWidthRef.current <= 0) return;
    const delta = e.clientX - dragStartXRef.current;
    if (Math.abs(delta) > DRAG_CLICK_THRESHOLD_PX) movedRef.current = true;
    let next = dragStartScrollRef.current - delta;
    if (next < 0) next += halfWidthRef.current;
    if (next >= halfWidthRef.current) next -= halfWidthRef.current;
    el.scrollLeft = next;
  }

  function handlePointerUp() {
    if (draggingRef.current && !movedRef.current && pendingIndexRef.current !== null) {
      setLightboxIndex(pendingIndexRef.current);
    }
    draggingRef.current = false;
    scheduleResume();
  }

  function handlePointerEnter() {
    pause();
  }

  function handlePointerLeave() {
    if (!draggingRef.current) scheduleResume();
  }

  return (
    <section className="w-full bg-surface-container-lowest border-y border-surface-variant/40 py-space-xl overflow-hidden">
      <div className="max-w-container-max mx-auto px-gutter-mobile lg:px-gutter-desktop text-center mb-space-lg">
        <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-bold">
          Forged On Our Floor
        </span>
        <h2 className="font-headline-sm text-headline-sm lg:font-display-lg lg:text-display-lg text-on-surface uppercase tracking-tight mt-space-2xs">
          ATHLETE WALL
        </h2>
      </div>

      <div
        ref={scrollerRef}
        className="overflow-x-hidden cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: "pan-y" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <div className="flex w-max">
          {ATHLETES.map((athlete, i) => (
            <AthleteCard key={`a-${i}`} athlete={athlete} index={i} />
          ))}
          <div className="flex" aria-hidden="true">
            {ATHLETES.map((athlete, i) => (
              <AthleteCard key={`b-${i}`} athlete={athlete} index={i} alt="" />
            ))}
          </div>
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox index={lightboxIndex} onChange={setLightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </section>
  );
}

function AthleteCard({
  athlete,
  index,
  alt,
}: {
  athlete: { src: string; alt: string };
  index: number;
  alt?: string;
}) {
  return (
    <div data-athlete-index={index} className="shrink-0 w-36 sm:w-44 lg:w-52 mx-space-2xs lg:mx-space-xs">
      <div className="pointer-events-none rounded-2xl border border-primary-container/40 bg-surface-container-high p-1 shadow-hard">
        <div className="relative w-full aspect-[3/4] overflow-hidden rounded-xl">
          {/* unoptimized: these are already pre-compressed to a proper web
              size (~30-55KB each, capped at 640px — see the compression
              step these were built from), so routing them through Next's
              on-the-fly optimizer just adds a redundant resize AND, worse,
              serves the thumbnail from a different URL (/_next/image?...)
              than the lightbox's full-size <img> uses. That meant tapping
              to enlarge was always a fresh, uncached download. Same raw
              URL both places now, so by the time someone taps a photo
              they've scrolled past, the browser already has it cached. */}
          <Image src={athlete.src} alt={alt ?? athlete.alt} fill unoptimized className="object-cover" draggable={false} />
        </div>
      </div>
    </div>
  );
}

function Lightbox({ index, onChange, onClose }: { index: number; onChange: (i: number) => void; onClose: () => void }) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onChange((index - 1 + ATHLETES.length) % ATHLETES.length);
      if (e.key === "ArrowRight") onChange((index + 1) % ATHLETES.length);
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
  }, [index, onChange, onClose]);

  const athlete = ATHLETES[index];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 sm:p-6 backdrop-blur-xl overflow-y-auto select-none"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close full-screen image"
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[10000] min-w-[44px] min-h-[44px] flex items-center justify-center bg-surface-container-high/90 border border-surface-variant/60 text-on-surface hover:bg-primary-container hover:text-on-primary-container p-2.5 rounded-full transition-all cursor-pointer shadow-xl active:scale-90"
      >
        <span className="material-symbols-outlined text-2xl leading-none">close</span>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange((index - 1 + ATHLETES.length) % ATHLETES.length);
        }}
        aria-label="Previous photo"
        className="fixed left-2 sm:left-6 top-1/2 -translate-y-1/2 z-[10000] min-w-[44px] min-h-[44px] flex items-center justify-center bg-surface-container-high/90 border border-surface-variant/60 text-on-surface hover:bg-primary-container hover:text-on-primary-container p-2.5 rounded-full transition-all cursor-pointer shadow-xl active:scale-90"
      >
        <span className="material-symbols-outlined text-2xl leading-none">chevron_left</span>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange((index + 1) % ATHLETES.length);
        }}
        aria-label="Next photo"
        className="fixed right-2 sm:right-6 top-1/2 -translate-y-1/2 z-[10000] min-w-[44px] min-h-[44px] flex items-center justify-center bg-surface-container-high/90 border border-surface-variant/60 text-on-surface hover:bg-primary-container hover:text-on-primary-container p-2.5 rounded-full transition-all cursor-pointer shadow-xl active:scale-90"
      >
        <span className="material-symbols-outlined text-2xl leading-none">chevron_right</span>
      </button>

      <div
        className="relative w-full max-w-[92vw] sm:max-w-xl rounded-2xl sm:rounded-3xl border border-primary-container/40 bg-surface-container-lowest p-2 sm:p-3 shadow-[0_0_80px_rgba(224,86,36,0.3)] flex flex-col items-center my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl bg-black/80 w-full">
          {/* eslint-disable-next-line @next/next/no-img-element -- variable-height lightbox image, same pattern as CoachAvatar's lightbox */}
          <img src={athlete.src} alt={athlete.alt} className="max-h-[65vh] sm:max-h-[70vh] w-auto max-w-full rounded-xl sm:rounded-2xl object-contain" />
        </div>
        <div className="bg-surface-container-lowest/90 px-3 py-3 sm:p-3.5 text-center flex flex-col items-center w-full">
          <p className="text-tertiary text-[10px]">
            {index + 1} / {ATHLETES.length} — tap outside or swipe with the arrows to browse
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
