import { Skeleton } from "@/frontend/components/dashboard/Primitives";

// Shown instantly by Next.js while dashboard/page.tsx's server-side data
// fetch is still in flight — this is what an installed PWA opening cold
// (start_url is /dashboard) sees first, instead of a blank screen for
// however long the real render takes. Shapes roughly match the real page
// so nothing visibly jumps when the actual content swaps in.
export default function DashboardLoading() {
  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-(--container-max) mx-auto">
      <Skeleton className="h-[52px] w-full mb-6" />
      <Skeleton className="h-[52px] w-full mb-6" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>

      <Skeleton className="h-7 w-40 mb-4" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>

      <Skeleton className="h-14 w-full" />
    </div>
  );
}
