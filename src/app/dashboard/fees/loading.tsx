import { Skeleton } from "@/frontend/components/dashboard/Primitives";

export default function FeesLoading() {
  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-md mx-auto">
      <Skeleton className="h-7 w-36 mb-6" />
      <Skeleton className="h-44 w-full" />
    </div>
  );
}
