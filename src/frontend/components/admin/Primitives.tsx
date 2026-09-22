/** Shared pulse-block used by each admin tab's loading.tsx (mirrors the member dashboard's Primitives.tsx Skeleton). */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-surface-container-high ${className}`} />;
}
