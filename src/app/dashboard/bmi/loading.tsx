import { Skeleton } from "@/frontend/components/dashboard/Primitives";

export default function BmiLoading() {
  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-(--container-max) mx-auto">
      <Skeleton className="h-7 w-64 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Skeleton className="lg:col-span-5 h-[420px] w-full" />
        <Skeleton className="lg:col-span-7 h-[420px] w-full" />
      </div>
    </div>
  );
}
