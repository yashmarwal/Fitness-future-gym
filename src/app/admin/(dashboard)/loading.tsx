import { Skeleton } from "@/frontend/components/admin/Primitives";

// Shown instantly by Next.js while page.tsx's 12-way Promise.all (today's
// check-ins, revenue, every alert count, member/blocked lists, ...) is still
// in flight. AdminNav itself isn't part of this — the layout persists across
// tab switches, so only the tab's own content is ever blank without this.
export default function AdminOverviewLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <Skeleton className="h-7 w-40 mb-3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="h-6 w-44 mb-3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
