"use client";

import { useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const DEBOUNCE_MS = 300;

// Updates the URL's ?q= param (debounced), not local filtered state — the
// actual filtering happens server-side in the page (see exerciseGuide.ts's
// filterExerciseGuide), so the ~850KB dataset never has to ship to the
// browser just to power a search box. This component only ever holds the
// current text value, nothing from the dataset itself.
export default function ExerciseGuideSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(next: string) {
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.trim()) params.set("q", next.trim());
      else params.delete("q");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, DEBOUNCE_MS);
  }

  return (
    <div className="relative">
      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg leading-none pointer-events-none">
        search
      </span>
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search exercises or a target muscle..."
        className="w-full rounded-2xl bg-surface-container-low border border-surface-variant text-on-surface font-body pl-11 pr-4 py-3 outline-none focus:border-primary-container"
      />
    </div>
  );
}
