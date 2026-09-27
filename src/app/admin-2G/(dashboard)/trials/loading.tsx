import { Skeleton } from "@/frontend/components/admin/Primitives";

export default function AdminTrialsLoading() {
  return (
    <div>
      <Skeleton className="h-7 w-64 mb-2" />
      <Skeleton className="h-4 w-full max-w-md mb-6" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
