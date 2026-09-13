import Link from "next/link";
import type { AlertMember } from "@/types/admin";

type Tone = "error" | "warning" | "info";

const TONE_CLASSES: Record<Tone, string> = {
  error: "border-error text-error",
  warning: "border-primary-container text-primary-container",
  info: "border-outline text-outline",
};

const TONE_ACCENT: Record<Tone, string> = {
  error: "border-l-error",
  warning: "border-l-primary-container",
  info: "border-l-outline",
};

const TONE_TEXT: Record<Tone, string> = {
  error: "text-error",
  warning: "text-primary-container",
  info: "text-outline",
};

// One glanceable tile per category — shown for all 5 regardless of count, so
// the admin sees the full picture in one row without scrolling past a wall
// of "nothing here" sections. Detail lists below only render for the ones
// that actually have something in them.
export function AlertSummaryPill({
  title,
  tone,
  icon,
  count,
}: {
  title: string;
  tone: Tone;
  icon: string;
  count: number;
}) {
  const active = count > 0;
  return (
    <div
      className={`bg-surface-container-low p-4 shadow-hard flex flex-col gap-2 border-l-4 ${
        active ? TONE_ACCENT[tone] : "border-l-surface-variant"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`material-symbols-outlined text-xl leading-none ${active ? TONE_TEXT[tone] : "text-outline"}`}>
          {icon}
        </span>
        <span className={`font-display text-2xl leading-none ${active ? TONE_TEXT[tone] : "text-outline"}`}>
          {count}
        </span>
      </div>
      <p className="font-label text-[10px] uppercase tracking-wider text-tertiary leading-snug">{title}</p>
    </div>
  );
}

export default function AlertsList({
  title,
  tone,
  icon,
  members,
}: {
  title: string;
  tone: Tone;
  icon: string;
  members: AlertMember[];
}) {
  if (members.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className={`material-symbols-outlined text-lg leading-none ${TONE_TEXT[tone]}`}>{icon}</span>
        <h2 className="font-label text-sm uppercase tracking-widest text-on-surface font-bold">{title}</h2>
        <span className={`font-label text-[10px] uppercase px-2 py-0.5 border ${TONE_CLASSES[tone]}`}>
          {members.length}
        </span>
      </div>

      <div className="flex flex-col divide-y divide-surface-variant/30 bg-surface-container-low shadow-hard">
        {members.map((m) => (
          <div
            key={m.id}
            className={`flex items-center justify-between px-4 py-3 gap-4 border-l-4 ${TONE_ACCENT[tone]} hover:bg-surface-container transition-colors`}
          >
            <div>
              <p className="font-label text-sm uppercase text-on-surface">{m.fullName}</p>
              <p className="font-body text-xs text-tertiary">
                {m.membershipNumber} • {m.detail}
              </p>
            </div>
            <Link
              href="/admin/members"
              className="font-label text-[10px] uppercase text-primary-container hover:text-secondary transition-colors shrink-0"
            >
              View →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
