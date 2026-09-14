import { Skeleton } from "@/frontend/components/dashboard/Primitives";

export default function CardLoading() {
  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-md mx-auto">
      <Skeleton className="h-7 w-56 mb-6" />
      <Skeleton className="h-56 w-full" />
    </div>
  );
}
