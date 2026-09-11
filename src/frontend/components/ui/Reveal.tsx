"use client";

import { useRef, useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Reveal({
  children,
  delay = 0,
  immediate = false,
  y = 24,
  className,
}: {
  children: ReactNode;
  delay?: number;
  immediate?: boolean;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const tween = { opacity: 0, y };
      const target = { opacity: 1, y: 0, duration: 0.7, delay, ease: "power2.out" };

      if (immediate) {
        gsap.fromTo(el, tween, target);
      } else {
        gsap.fromTo(el, tween, {
          ...target,
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            once: true,
          },
        });
      }
    }, ref);

    return () => ctx.revert();
  }, [delay, immediate, y]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
