import { Skeleton } from "@/frontend/components/dashboard/Primitives";

export default function ExerciseGuideLoading() {
  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-2xl mx-auto">
      <Skeleton className="h-7 w-56 mb-2" />
      <Skeleton className="h-4 w-full max-w-sm mb-6" />
      <Skeleton className="h-12 w-full rounded-2xl mb-4" />
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full shrink-0" />
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
