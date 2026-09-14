import { Skeleton } from "@/frontend/components/dashboard/Primitives";

export default function WorkoutsLoading() {
  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-2xl mx-auto">
      <Skeleton className="h-7 w-44 mb-6" />
      <Skeleton className="h-56 w-full mb-6" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
