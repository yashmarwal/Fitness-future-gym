import { Skeleton } from "@/frontend/components/admin/Primitives";

export default function AdminMonthlyAttendanceLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-7 w-64 mb-2" />
        <Skeleton className="h-4 w-full max-w-md mb-6" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-10 w-44 rounded-full" />
        <Skeleton className="h-10 w-32 rounded-full" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
      <Skeleton className="h-96 w-full max-w-sm" />
    </div>
  );
}
