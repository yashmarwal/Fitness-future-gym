import { Skeleton } from "@/frontend/components/admin/Primitives";

export default function AdminAttendanceLoading() {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <Skeleton className="h-7 w-56 mb-6" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-full max-w-md mb-6" />
        <Skeleton className="h-72 w-full max-w-md" />
      </div>
    </div>
  );
}
