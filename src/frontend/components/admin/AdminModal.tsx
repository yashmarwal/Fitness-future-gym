"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";

// Shared overlay shell for admin panel detail popups (RevenueCard,
// NewJoineesCard) — the panel itself still fetches its own data server-side
// and passes it down as props, this only owns the portal/backdrop/close
// mechanics so neither card has to duplicate them.
export default function AdminModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <div
        className="relative w-full max-w-md max-h-[80vh] flex flex-col bg-surface-container-low border border-surface-variant rounded-2xl shadow-soft-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-variant/50 shrink-0">
          <h3 className="font-display text-lg text-on-surface uppercase tracking-wide">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-tertiary hover:text-on-surface hover:bg-surface-container-high transition-colors"
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
