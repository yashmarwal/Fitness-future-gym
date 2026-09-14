import { Skeleton } from "@/frontend/components/dashboard/Primitives";

export default function NutritionLoading() {
  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-2xl mx-auto">
      <Skeleton className="h-7 w-64 mb-2" />
      <Skeleton className="h-4 w-80 mb-6" />
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-72 w-full mb-6" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
