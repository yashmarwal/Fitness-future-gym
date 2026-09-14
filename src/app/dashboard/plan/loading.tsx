import { Skeleton } from "@/frontend/components/dashboard/Primitives";

export default function PlanLoading() {
  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-(--container-max) mx-auto">
      <Skeleton className="h-7 w-72 mb-2" />
      <Skeleton className="h-4 w-96 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}
