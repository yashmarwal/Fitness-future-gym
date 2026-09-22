import { Skeleton } from "@/frontend/components/admin/Primitives";

export default function AdminAccessControlLoading() {
  return (
    <div>
      <Skeleton className="h-7 w-44 mb-2" />
      <Skeleton className="h-4 w-full max-w-lg mb-6" />
      <div className="grid lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-6 w-40 mb-1" />
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-14 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
