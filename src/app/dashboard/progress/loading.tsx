import { Skeleton } from "@/frontend/components/dashboard/Primitives";

export default function MuscleProgressLoading() {
  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-(--container-max) mx-auto">
      <Skeleton className="h-7 w-56 mb-2" />
      <Skeleton className="h-4 w-full max-w-md mb-6" />
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    </div>
  );
}
