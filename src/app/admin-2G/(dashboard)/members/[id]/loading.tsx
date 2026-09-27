import { Skeleton } from "@/frontend/components/admin/Primitives";

export default function AdminMemberProfileLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <Skeleton className="h-4 w-32 rounded-lg" />
      <Skeleton className="h-56 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}
