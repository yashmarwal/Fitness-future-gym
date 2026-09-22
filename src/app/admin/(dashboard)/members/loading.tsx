import { Skeleton } from "@/frontend/components/admin/Primitives";

export default function AdminMembersLoading() {
  return (
    <div>
      <Skeleton className="h-7 w-36 mb-6" />
      <Skeleton className="h-11 w-full max-w-sm mb-6" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
