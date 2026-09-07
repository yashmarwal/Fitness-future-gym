"use client";

import { useState, type ReactNode } from "react";

export default function PillTabs({
  tabs,
}: {
  tabs: { label: string; content: ReactNode }[];
}) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="flex bg-surface-container-low">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActive(i)}
            className={`flex-1 font-label text-xs uppercase tracking-wider py-3 transition-colors ${
              active === i
                ? "bg-primary-container text-on-primary-container font-bold"
                : "text-on-surface-variant"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">{tabs[active].content}</div>
    </div>
  );
}
