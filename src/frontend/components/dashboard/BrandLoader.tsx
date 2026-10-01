import { useId } from "react";

// A small branded loading mark — see the "Brand loader" block in
// globals.css for the animation itself and where it was adapted from.
// Self-contained so it can be dropped into any loading state, not just
// Playground's room view. `size` scales the whole thing down from the
// source's native 180px via a wrapping transform, rather than changing
// any of the animation's own geometry — the rotate animation lives on the
// inner .brand-loader-content element specifically so it doesn't fight
// over `transform` with this scale wrapper.
export default function BrandLoader({ size = 80 }: { size?: number }) {
  const filterId = `brand-loader-gooey-${useId()}`;
  const scale = size / 180;

  return (
    <div style={{ width: size, height: size }} aria-hidden="true">
      <svg width={0} height={0}>
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
      <div style={{ width: 180, height: 180, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <div className="brand-loader-content" style={{ filter: `url(#${filterId})` }}>
          <div className="brand-loader-liquid" />
          <div className="brand-loader-liquid" />
          <div className="brand-loader-liquid" />
          <div className="brand-loader-liquid" />
        </div>
      </div>
    </div>
  );
}
