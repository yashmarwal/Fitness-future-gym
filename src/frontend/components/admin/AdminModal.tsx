"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { GLASS_SHADOW } from "@/frontend/lib/glass";

// Shared overlay shell for admin panel detail popups (RevenueCard,
// NewJoineesCard) — the panel itself still fetches its own data server-side
// and passes it down as props, this only owns the portal/backdrop/close
// mechanics so neither card has to duplicate them. Same glass language as
// CommandPalette's own portal-rendered panel, rather than the flat
// surface-container box this used to be.
export default function AdminModal({
  title,
  icon,
  onClose,
  children,
}: {
  title: string;
  icon?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md max-h-[80vh] flex flex-col bg-surface-container-lowest border border-white/10 rounded-2xl ${GLASS_SHADOW} overflow-hidden animate-modal-pop`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 shrink-0">
          {icon && (
            <span className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-white/6 text-primary-container">
              <span className="material-symbols-outlined text-lg leading-none">{icon}</span>
            </span>
          )}
          <h3 className="flex-1 min-w-0 font-display text-lg text-on-surface uppercase tracking-wide truncate">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-tertiary hover:text-on-surface hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-lg leading-none">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
