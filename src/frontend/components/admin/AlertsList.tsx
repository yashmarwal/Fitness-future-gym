import Link from "next/link";
import type { AlertMember } from "@/types/admin";

const TONE_CLASSES: Record<"error" | "warning" | "info", string> = {
  error: "border-error text-error",
  warning: "border-primary-container text-primary-container",
  info: "border-outline text-outline",
};

export default function AlertsList({
  title,
  tone,
  emptyMessage,
  members,
}: {
  title: string;
  tone: "error" | "warning" | "info";
  emptyMessage: string;
  members: AlertMember[];
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="font-label text-sm uppercase tracking-widest text-on-surface font-bold">{title}</h2>
        <span className={`font-label text-[10px] uppercase px-2 py-0.5 border ${TONE_CLASSES[tone]}`}>
          {members.length}
        </span>
      </div>

      {members.length === 0 ? (
        <p className="font-body text-sm text-tertiary">{emptyMessage}</p>
      ) : (
        <div className="flex flex-col divide-y divide-surface-variant/30 bg-surface-container-low shadow-hard">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3 gap-4">
              <div>
                <p className="font-label text-sm uppercase text-on-surface">{m.fullName}</p>
                <p className="font-body text-xs text-tertiary">
                  {m.membershipNumber} • {m.detail}
                </p>
              </div>
              <Link
                href="/admin/members"
                className="font-label text-[10px] uppercase text-primary-container shrink-0"
              >
                View →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
