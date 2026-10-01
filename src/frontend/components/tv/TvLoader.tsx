// /tv's opening splash — see the "tvloader" block in globals.css for the
// animation itself. `size` scales it from its native 44px via a wrapping
// transform, same technique BrandLoader uses, so the underlying stroke-
// dasharray math (tuned to a 64x64 rect) never has to be recalculated.
export default function TvLoader({ size = 44 }: { size?: number }) {
  const NATIVE = 44;
  const scale = size / NATIVE;

  return (
    <div style={{ width: size, height: size }} aria-hidden="true">
      <div style={{ width: NATIVE, height: NATIVE, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <div className="tvloader">
          <svg viewBox="0 0 80 80">
            <rect x="8" y="8" width="64" height="64" />
          </svg>
        </div>
      </div>
    </div>
  );
}
