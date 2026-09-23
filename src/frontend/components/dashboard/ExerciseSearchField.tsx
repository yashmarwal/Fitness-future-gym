"use client";

import { Fragment, useCallback, useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  matchExerciseCategory,
  searchExercises,
  starterExercises,
  type ExerciseCategory,
  type ExerciseSuggestion,
} from "@/frontend/lib/exerciseLibrary";

export type ExerciseHistoryEntry = { exerciseName: string; sets: number; reps: number; weightKg: number | null };

// Only icons already in the subsetted Material Symbols font (see layout.tsx).
const CATEGORY_ICON: Record<ExerciseCategory, string> = {
  Chest: "fitness_center",
  Back: "rowing",
  Shoulders: "sports_gymnastics",
  Legs: "directions_run",
  Arms: "sports_martial_arts",
  Core: "self_improvement",
  Cardio: "monitor_heart",
  "Full Body": "accessibility_new",
};

const MAX_SUGGESTIONS = 6;
const MAX_RECENT = 5;

// Panel geometry, used to decide where it can open.
const PANEL_HEADER_PX = 34;
const LIST_MAX_PX = 288;
const LIST_MIN_PX = 112;
const COMFORT_PX = 220; // below this much room the panel flips upward
const PANEL_MAX_WIDTH_PX = 360;
const NARROW_INPUT_PX = 280; // inputs narrower than this get a wider panel
const EDGE_GUTTER_PX = 8;
// DashboardTabBar is a fixed bottom bar below the lg breakpoint; the panel must
// stop above it rather than slide underneath.
const TAB_BAR_PX = 72;
const TAB_BAR_BREAKPOINT_PX = 1024;

type Layout = { up: boolean; maxHeight: number; width: number | null; shift: number };
const DEFAULT_LAYOUT: Layout = { up: false, maxHeight: LIST_MAX_PX, width: null, shift: 0 };

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function describeSet(entry: ExerciseHistoryEntry): string {
  return `${entry.sets}×${entry.reps}${entry.weightKg ? ` @ ${entry.weightKg}kg` : ""}`;
}

// Bolds the part of `text` the member has typed. With a typo there's nothing
// literal to bold, and the text is simply left alone.
function Highlight({ text, query }: { text: string; query: string }) {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .map(escapeRegExp);
  if (tokens.length === 0) return <>{text}</>;
  // One capture group, so split() alternates plain / matched / plain / …
  const parts = text.split(new RegExp(`(${tokens.join("|")})`, "ig"));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="text-primary-container font-semibold">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}

type Row =
  | { kind: "match"; key: string; suggestion: ExerciseSuggestion; last: ExerciseHistoryEntry | null }
  | { kind: "recent"; key: string; entry: ExerciseHistoryEntry; category: ExerciseCategory | null };

// Exercise-name input with a live search preview. Empty + focused shows the
// member's recent exercises (one tap refills sets / reps / weight too) or, with
// no history, a few starter picks; while typing it shows fuzzy library matches
// with the typed part highlighted, the muscle group, why an alias matched, and
// what they last lifted. Keyboard-drivable (↑ ↓ Enter Esc), exposed as an ARIA
// combobox, and built for phones: the panel opens upward when the on-screen
// keyboard or the bottom tab bar leaves no room below, and never runs off the
// side of the screen. `compact` is the smaller variant used inside the planner.
export default function ExerciseSearchField({
  value,
  onChange,
  onPick,
  onPickRecent,
  onBlur,
  history = [],
  compact = false,
  showXpHint = true,
  label = "Exercise",
  // Short in the compact variant: the planner's name column is narrow.
  placeholder = compact ? "Search exercise" : "Search — e.g. bench, baithak",
  required = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onPick: (name: string) => void;
  onPickRecent?: (entry: ExerciseHistoryEntry) => void;
  onBlur?: () => void;
  // One entry per exercise, most recently logged first.
  history?: ExerciseHistoryEntry[];
  compact?: boolean;
  // Whether to say if the exercise will earn Muscle Progress XP (only
  // meaningful when logging a set, not when planning).
  showXpHint?: boolean;
  label?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const uid = useId();
  const inputId = `${uid}-input`;
  const listId = `${uid}-list`;
  const boxRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<{ key: string; index: number }>({ key: "", index: -1 });
  const [layout, setLayout] = useState<Layout>(DEFAULT_LAYOUT);

  // The Fuse.js search is deferred so a slow phone keeps typing smoothly; the
  // list just trails the input by a beat if it has to.
  const deferred = useDeferredValue(value);
  const query = deferred.trim();

  const lastByName = useMemo(() => {
    const map = new Map<string, ExerciseHistoryEntry>();
    for (const entry of history) map.set(normalizeName(entry.exerciseName), entry);
    return map;
  }, [history]);

  const hasHistory = history.length > 0;

  const rows: Row[] = useMemo(() => {
    if (!open) return [];
    if (query.length === 0) {
      if (history.length > 0) {
        return history.slice(0, MAX_RECENT).map((entry) => ({
          kind: "recent",
          key: `recent:${entry.exerciseName}`,
          entry,
          category: matchExerciseCategory(entry.exerciseName),
        }));
      }
      return starterExercises().map((suggestion) => ({
        kind: "match",
        key: `match:${suggestion.name}`,
        suggestion,
        last: null,
      }));
    }
    if (query.length < 2) return [];
    const matches = searchExercises(query, MAX_SUGGESTIONS);
    // A list that only repeats exactly what was typed is just noise.
    if (matches.length === 1 && matches[0].name.toLowerCase() === query.toLowerCase()) return [];
    return matches.map((suggestion) => ({
      kind: "match",
      key: `match:${suggestion.name}`,
      suggestion,
      last: lastByName.get(normalizeName(suggestion.name)) ?? null,
    }));
  }, [open, query, history, lastByName]);

  const showing = rows.length > 0;
  const mode = query.length === 0 ? (hasHistory ? "recent" : "starter") : "search";
  // The highlighted row belongs to one particular list; when the list changes
  // (new keystroke) it quietly falls back to "nothing highlighted".
  const listKey = `${mode}|${query}`;
  const activeIndex = active.key === listKey ? active.index : -1;
  const optionId = (i: number) => `${listId}-opt-${i}`;

  // "Counts toward … progress" uses the very same matcher the server runs when
  // the set is saved, so the hint can't disagree with what actually happens.
  const category = useMemo(
    () => (showXpHint && query.length >= 3 ? matchExerciseCategory(query) : null),
    [showXpHint, query]
  );

  // Works out where the panel fits. Uses the *visual* viewport, which shrinks
  // when the phone keyboard is up (window.innerHeight often doesn't), and keeps
  // clear of the fixed bottom tab bar. Deliberately not re-run per keystroke, so
  // the panel doesn't flip up and down while someone is typing.
  const measure = useCallback(() => {
    const box = boxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const vv = window.visualViewport;
    const viewTop = vv ? vv.offsetTop : 0;
    const viewH = vv ? vv.height : window.innerHeight;
    const viewW = vv ? vv.width : window.innerWidth;
    const bottomInset = window.innerWidth < TAB_BAR_BREAKPOINT_PX ? TAB_BAR_PX : EDGE_GUTTER_PX;

    const below = viewTop + viewH - rect.bottom - bottomInset;
    const above = rect.top - viewTop - EDGE_GUTTER_PX;
    const up = below < COMFORT_PX && above > below;
    const room = (up ? above : below) - PANEL_HEADER_PX - EDGE_GUTTER_PX;
    const maxHeight = Math.max(LIST_MIN_PX, Math.min(LIST_MAX_PX, Math.floor(room)));

    // A narrow input (the planner's name column) gets a wider panel so names
    // fit, but never past the screen edges. Normal-width inputs keep their own width.
    const wanted =
      rect.width >= NARROW_INPUT_PX ? rect.width : Math.min(PANEL_MAX_WIDTH_PX, viewW - EDGE_GUTTER_PX * 2);
    let width: number | null = null;
    let shift = 0;
    if (wanted > rect.width + 1) {
      width = Math.floor(wanted);
      shift = Math.min(0, viewW - EDGE_GUTTER_PX - (rect.left + width));
      shift = Math.max(shift, EDGE_GUTTER_PX - rect.left);
    }

    setLayout((prev) =>
      prev.up === up && prev.maxHeight === maxHeight && prev.width === width && prev.shift === shift
        ? prev
        : { up, maxHeight, width, shift }
    );
  }, []);

  // The keyboard slides up after focus, and the page can scroll while the list
  // is open — re-measure on both.
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;
    vv.addEventListener("resize", measure);
    vv.addEventListener("scroll", measure);
    return () => {
      vv.removeEventListener("resize", measure);
      vv.removeEventListener("scroll", measure);
    };
  }, [open, measure]);

  function choose(row: Row) {
    setOpen(false);
    if (row.kind === "match") onPick(row.suggestion.name);
    else onPickRecent?.(row.entry);
  }

  function move(delta: number) {
    const next = activeIndex === -1 ? (delta > 0 ? 0 : rows.length - 1) : (activeIndex + delta + rows.length) % rows.length;
    setActive({ key: listKey, index: next });
    document.getElementById(optionId(next))?.scrollIntoView({ block: "nearest" });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!showing) {
        measure();
        setOpen(true);
        return;
      }
      e.preventDefault();
      move(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter" && showing && activeIndex >= 0) {
      // Picks the highlighted suggestion instead of submitting the form.
      e.preventDefault();
      choose(rows[activeIndex]);
    } else if (e.key === "Escape" && showing) {
      e.preventDefault();
      setOpen(false);
    }
  }

  const headerLabel = mode === "recent" ? "Recent — tap to reuse" : mode === "starter" ? "Popular picks" : "Best matches";
  const headerIcon = mode === "recent" ? "schedule" : "bolt";

  return (
    <div className="relative flex flex-col gap-1">
      <label htmlFor={inputId} className="font-label text-[9px] uppercase tracking-wider text-outline">
        {label}
      </label>

      <div ref={boxRef} className="relative">
        <span
          className={`material-symbols-outlined pointer-events-none absolute top-1/2 -translate-y-1/2 leading-none text-tertiary ${
            compact ? "left-2.5 text-base" : "left-3 text-lg"
          }`}
        >
          search
        </span>
        <input
          id={inputId}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            measure();
            setOpen(true);
          }}
          onBlur={() => {
            setOpen(false);
            onBlur?.();
          }}
          onKeyDown={handleKeyDown}
          required={required}
          autoComplete="off"
          autoCapitalize="words"
          spellCheck={false}
          enterKeyHint="done"
          placeholder={placeholder}
          role="combobox"
          aria-expanded={showing}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showing && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          // 16px on phones: anything smaller makes iOS Safari zoom the page in on focus.
          className={`w-full rounded-xl border border-surface-variant text-on-surface font-body outline-none focus:border-primary-container placeholder:text-outline/70 ${
            compact ? "bg-surface-container-low pl-8 pr-8 py-2 text-base sm:text-sm" : "bg-surface-container pl-10 pr-10 py-3"
          }`}
        />
        {value && (
          <button
            type="button"
            aria-label={`Clear ${label.toLowerCase()}`}
            // Keeps focus in the input so the list can reopen right away.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange("");
              measure();
              setOpen(true);
            }}
            className={`absolute right-0 top-0 h-full flex items-center justify-center text-tertiary hover:text-primary-container transition-colors touch-manipulation ${
              compact ? "w-9" : "w-11"
            }`}
          >
            <span className={`material-symbols-outlined leading-none ${compact ? "text-base" : "text-lg"}`}>close</span>
          </button>
        )}

        {showing && (
          <div
            className={`${layout.up ? "animate-suggest-in-up bottom-full mb-1.5" : "animate-suggest-in top-full mt-1.5"} absolute z-30 bg-surface-container-low border border-primary-container shadow-soft rounded-xl overflow-hidden`}
            style={layout.width != null ? { width: layout.width, left: layout.shift } : { left: 0, right: 0 }}
          >
            <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-surface-variant/60 bg-surface-container-lowest">
              <span className="flex items-center gap-1.5 font-label text-[9px] uppercase tracking-widest text-primary-container">
                <span className="material-symbols-outlined text-sm leading-none">{headerIcon}</span>
                {headerLabel}
              </span>
              <span className="hidden sm:inline font-label text-[9px] uppercase tracking-wider text-outline">
                ↑ ↓ move · Enter pick · Esc close
              </span>
            </div>

            <ul
              id={listId}
              role="listbox"
              aria-label="Exercise suggestions"
              // overscroll-contain: scrolling to the end of the list must not
              // start scrolling the page behind it.
              className="overflow-y-auto overscroll-contain"
              style={{ maxHeight: layout.maxHeight }}
            >
              {rows.map((row, i) => {
                const isActive = i === activeIndex;
                const name = row.kind === "match" ? row.suggestion.name : row.entry.exerciseName;
                const rowCategory = row.kind === "match" ? row.suggestion.category : row.category;
                const last = row.kind === "match" ? row.last : row.entry;
                return (
                  <li
                    key={row.key}
                    id={optionId(i)}
                    role="option"
                    aria-selected={isActive}
                    // mousedown would blur the input and close the list before
                    // the click lands, so it's swallowed here.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(row)}
                    onMouseEnter={() => setActive({ key: listKey, index: i })}
                    className={`relative flex items-center gap-3 px-3 py-2.5 min-h-14 cursor-pointer touch-manipulation border-b border-surface-variant/30 last:border-b-0 transition-colors active:bg-surface-container-highest ${
                      isActive ? "bg-surface-container-highest" : "hover:bg-surface-container"
                    }`}
                  >
                    {/* Molten accent rule on the active row. */}
                    <span
                      aria-hidden="true"
                      className={`absolute left-0 top-0 h-full w-0.5 bg-primary-container transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`}
                    />
                    <span className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center bg-surface-container-high text-primary-container">
                      <span className="material-symbols-outlined text-lg leading-none">
                        {rowCategory ? CATEGORY_ICON[rowCategory] : "fitness_center"}
                      </span>
                    </span>

                    <span className="flex-1 min-w-0">
                      <span className="block truncate font-body text-sm text-on-surface">
                        {row.kind === "match" ? <Highlight text={name} query={query} /> : name}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 font-label text-[9px] uppercase tracking-wider text-outline">
                        {rowCategory && <span>{rowCategory}</span>}
                        {row.kind === "match" && row.suggestion.matchedAlias && (
                          <span className="normal-case tracking-normal text-tertiary">
                            &middot; matches &ldquo;<Highlight text={row.suggestion.matchedAlias} query={query} />&rdquo;
                          </span>
                        )}
                        {last && (
                          <span className="text-tertiary">
                            &middot; {row.kind === "recent" ? "Last" : "Last time"} {describeSet(last)}
                          </span>
                        )}
                      </span>
                    </span>

                    <span
                      aria-hidden="true"
                      className={`material-symbols-outlined shrink-0 text-base leading-none transition-colors ${isActive ? "text-primary-container" : "text-outline"}`}
                    >
                      arrow_forward
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {showXpHint && query.length >= 3 && (
        <p className={`flex items-center gap-1.5 font-body text-[11px] ${category ? "text-tertiary" : "text-outline"}`}>
          <span
            className={`material-symbols-outlined text-sm leading-none ${category ? "text-primary-container" : "text-outline"}`}
          >
            {category ? "bolt" : "info"}
          </span>
          {category
            ? `Counts toward your ${category} progress.`
            : "Not in our exercise list yet — it will still be logged, but won't earn Muscle Progress XP."}
        </p>
      )}
    </div>
  );
}
