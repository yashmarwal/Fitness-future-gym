import { Skeleton } from "@/frontend/components/admin/Primitives";

export default function AdminAlertsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-7 w-32" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-6 w-56 mb-3" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 2 }).map((_, j) => (
              <Skeleton key={j} className="h-14 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
