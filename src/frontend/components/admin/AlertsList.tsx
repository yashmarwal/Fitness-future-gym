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
// that actually have something in them — a pill only becomes a link (to its
// own detail section further down this same page, via anchorId) once
// there's actually something to jump to; an empty category stays a plain,
// non-interactive tile.
export function AlertSummaryPill({
  title,
  tone,
  icon,
  count,
  anchorId,
}: {
  title: string;
  tone: Tone;
  icon: string;
  count: number;
  anchorId: string;
}) {
  const active = count > 0;
  const className = `bg-surface-container-low p-4 rounded-2xl shadow-soft flex flex-col gap-2 border-l-4 transition-all ${
    active ? `${TONE_ACCENT[tone]} hover:shadow-soft-lg hover:-translate-y-0.5` : "border-l-surface-variant"
  }`;
  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className={`material-symbols-outlined text-xl leading-none ${active ? TONE_TEXT[tone] : "text-outline"}`}>
          {icon}
        </span>
        <span className={`font-display text-2xl leading-none ${active ? TONE_TEXT[tone] : "text-outline"}`}>
          {count}
        </span>
      </div>
      <p className="font-label text-[10px] uppercase tracking-wider text-tertiary leading-snug">{title}</p>
    </>
  );

  if (!active) return <div className={className}>{content}</div>;
  return (
    <Link href={`#${anchorId}`} className={className}>
      {content}
    </Link>
  );
}

export default function AlertsList({
  title,
  tone,
  icon,
  members,
  anchorId,
}: {
  title: string;
  tone: Tone;
  icon: string;
  members: AlertMember[];
  anchorId: string;
}) {
  if (members.length === 0) return null;

  return (
    // scroll-mt-32 clears the sticky admin header (top bar + nav row) when
    // a summary pill above jumps straight to this section.
    <div id={anchorId} className="scroll-mt-32">
      <div className="flex items-center gap-3 mb-3">
        <span className={`material-symbols-outlined text-lg leading-none ${TONE_TEXT[tone]}`}>{icon}</span>
        <h2 className="font-label text-sm uppercase tracking-widest text-on-surface font-bold">{title}</h2>
        <span className={`font-label text-[10px] uppercase px-2 py-0.5 rounded-full border ${TONE_CLASSES[tone]}`}>
          {members.length}
        </span>
      </div>

      <div className="flex flex-col divide-y divide-surface-variant/30 bg-surface-container-low rounded-2xl shadow-soft overflow-hidden">
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
