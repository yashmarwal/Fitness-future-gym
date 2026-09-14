import { Skeleton } from "@/frontend/components/dashboard/Primitives";

export default function AttendanceHistoryLoading() {
  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-2xl mx-auto">
      <Skeleton className="h-7 w-52 mb-6" />
      <div className="flex flex-col gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
