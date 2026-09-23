import type { LegacyImportStatus } from "@/backend/services/legacyFeeImport";

// Purely informational — no actions here, just visibility into the one-time
// old-software migration while it's running (see legacyFeeImport.ts). Not
// rendered at all once no import has ever been done, and self-explanatory
// once it has: nothing to click, nothing to configure.
export default function LegacyImportStatusCard({ status }: { status: LegacyImportStatus }) {
  if (!status) return null;

  const pct = status.totalRows > 0 ? Math.round((status.matchedCount / status.totalRows) * 100) : 0;
  const cleanupDate = new Date(status.cleanupAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-surface-container-low border border-surface-variant/60 rounded-2xl shadow-soft p-4 mb-6 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-label text-xs uppercase tracking-widest text-primary-container">
          Old Software Migration
        </span>
        <span className="font-label text-[10px] uppercase text-tertiary">Auto-clears {cleanupDate}</span>
      </div>
      <p className="font-body text-sm text-on-surface">
        {status.matchedCount} of {status.totalRows} legacy members matched so far — {status.pendingCount} still
        haven&apos;t signed up on the new app.
      </p>
      <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
        <div className="h-full bg-primary-container transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
