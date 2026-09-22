import { Skeleton } from "@/frontend/components/admin/Primitives";

export default function AdminFeesLoading() {
  return (
    <div>
      <Skeleton className="h-7 w-40 mb-6" />
      <Skeleton className="h-11 w-full mb-6" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
