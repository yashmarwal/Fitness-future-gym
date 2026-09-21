"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { MemberSnapshot } from "@/frontend/lib/memberSnapshot";
import { CATEGORY_ICON, tierClasses } from "@/frontend/lib/muscleRankStyle";

const REVEAL_FALLBACK_MS = 2500;

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Flips to true the first time the bar scrolls into view, so its entrance plays
// when the member actually sees it. The timeout is a safety net: the bar can
// never stay hidden if the observer doesn't fire.
function useReveal() {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fallback = setTimeout(() => setRevealed(true), REVEAL_FALLBACK_MS);
    if (typeof IntersectionObserver === "undefined") {
      setTimeout(() => setRevealed(true), 0);
      return () => clearTimeout(fallback);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => {
      clearTimeout(fallback);
      observer.disconnect();
    };
  }, []);

  return { ref, revealed };
}

// Counts up from 0 to `value` once `active`. Jumps straight to the final value
// under reduced motion. Starts at 0 in the server render and on first client
// render, so hydration always matches.
function AnimatedNumber({ value, active, duration = 900 }: { value: number; active: boolean; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) return;
    const reduce = prefersReducedMotion();
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const progress = reduce ? 1 : Math.min(1, (now - start) / duration);
      setDisplay(value * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [active, value, duration]);

  return <>{Math.round(display).toLocaleString("en-IN")}</>;
}

const FEE_TONE: Record<MemberSnapshot["fee"]["kind"], string> = {
  none: "",
  ok: "bg-surface-container-high text-tertiary border-transparent",
  soon: "bg-primary-container/15 text-primary-container border-primary-container/40",
  today: "bg-primary-container/15 text-primary-container border-primary-container/40",
  overdue: "bg-error-container/40 text-error border-error/40",
};

// Fixed colours per muscle group so the same group is the same colour every
// time — shades of the brand orange plus neutrals, no new hues.
const BALANCE_COLOR: Record<string, string> = {
  Chest: "bg-primary-container",
  Back: "bg-secondary-container",
  Shoulders: "bg-primary",
  Legs: "bg-tertiary",
  Arms: "bg-on-surface-variant",
  Core: "bg-outline",
  Cardio: "bg-primary-fixed-dim",
  "Full Body": "bg-tertiary-container",
};

const HEAT_LEVEL: Record<0 | 1 | 2, string> = {
  0: "bg-surface-container border border-surface-variant/50",
  1: "bg-primary-container/45",
  2: "bg-primary-container",
};

const STANDOUT_ICONS = new Set(["calendar_month", "stars", "local_fire_department", "accessibility_new", "bolt"]);

function agoLabel(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// One labelled group inside the opened panel. Its entrance is held back until
// the panel is first opened, then staggered by `delay`.
function Block({
  title,
  icon,
  aside,
  delay,
  played,
  wide,
  children,
}: {
  title: string;
  icon: string;
  aside?: ReactNode;
  delay: number;
  played: boolean;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div style={{ animationDelay: `${delay}ms` }} className={`min-w-0 ${wide ? "lg:col-span-2" : ""} ${played ? "animate-snap-in" : "opacity-0"}`}>
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <span className="flex items-center gap-1.5 font-label text-[10px] uppercase tracking-widest text-outline">
          <span className="material-symbols-outlined text-sm leading-none text-primary-container">{icon}</span>
          {title}
        </span>
        {aside}
      </div>
      {children}
    </div>
  );
}

function Tile({
  href,
  icon,
  label,
  value,
  unit,
  sub,
  played,
  delay,
}: {
  href: string;
  icon: string;
  label: string;
  value: number;
  unit: string;
  sub: string;
  played: boolean;
  delay: number;
}) {
  return (
    <Link
      href={href}
      style={{ animationDelay: `${delay}ms` }}
      className={`min-w-0 bg-surface-container border border-surface-variant/40 p-3 flex flex-col gap-1 hover:border-primary-container transition-colors ${
        played ? "animate-snap-in" : "opacity-0"
      }`}
    >
      <span className="flex items-center gap-1 font-label text-[9px] uppercase tracking-wider text-outline">
        <span className="material-symbols-outlined text-sm leading-none text-primary-container">{icon}</span>
        {label}
      </span>
      <span className="font-display text-2xl leading-none text-on-surface tabular-nums whitespace-nowrap">
        <AnimatedNumber value={value} active={played} />
        <span className="font-label text-[10px] uppercase tracking-wide text-tertiary ml-1">{unit}</span>
      </span>
      <span className="font-body text-[10px] text-tertiary truncate">{sub}</span>
    </Link>
  );
}

function Chip({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-surface-container border border-surface-variant/40 px-2.5 py-1.5 font-label text-[10px] uppercase tracking-wider text-on-surface">
      <span className="material-symbols-outlined text-sm leading-none text-primary-container">{icon}</span>
      {children}
    </span>
  );
}

// The dashboard's "everything about you at a glance" bar: one slim row that
// matches the Attendance and Personal Records bars above it, and opens into
// the full summary. All figures come from the member's own data via
// buildMemberSnapshot (pure code, no AI or external call); this component only
// presents them and animates.
export default function DashboardSnapshot({ snapshot }: { snapshot: MemberSnapshot }) {
  const { ref, revealed } = useReveal();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  // The panel's one-time animations (count-ups, bar fills, staggered entrances)
  // start the first time it opens and don't replay on every toggle.
  const [hasOpened, setHasOpened] = useState(false);

  const { week, streak, lifting, activity, habits, balance, nutrition, records, rank, membership, fee, insights } = snapshot;
  const delta = week.trainedCount - week.previousCount;
  const deltaLabel = delta > 0 ? `+${delta} vs last week` : delta < 0 ? `${delta} vs last week` : "Same as last week";
  const goalPct = Math.min(100, Math.round((week.trainedCount / week.goal) * 100));
  const tier = rank ? tierClasses(rank.rankIndex) : null;

  function toggle() {
    setOpen((o) => !o);
    setHasOpened(true);
  }

  // The story lines that add something the sections above don't already show
  // (lifting, records, rank, food and fee each have their own section).
  const standouts = insights.filter((i) => STANDOUT_ICONS.has(i.icon));

  // Each section eases in a beat after the one above it.
  const blockDelay = (index: number) => 250 + index * 70;

  return (
    <section
      ref={ref}
      aria-label="Your snapshot"
      className={`relative overflow-hidden bg-surface-container-low shadow-hard mb-6 border transition-colors ${
        open ? "border-primary-container/50" : "border-transparent hover:border-primary-container"
      } ${revealed ? "animate-snap-in" : "opacity-0"}`}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full flex items-center gap-3 pl-3 pr-4 py-2.5 text-left"
      >
        <span className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-hard bg-surface-container-high text-primary-container">
          <span className="material-symbols-outlined text-xl leading-none">monitor_heart</span>
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-label text-xs uppercase tracking-wide text-on-surface">Your Snapshot</span>
          <span className="block font-body text-xs text-tertiary truncate">{snapshot.teaser}</span>
        </span>
        <span aria-hidden="true" className="flex items-center gap-0.75 shrink-0">
          {week.days.map((day, i) => (
            <span
              key={day.date}
              style={{ animationDelay: `${300 + i * 60}ms` }}
              className={`block w-2 h-2 ${
                day.trained ? "bg-primary-container" : day.isToday ? "border border-primary-container/70" : "bg-surface-variant/70"
              } ${revealed ? "animate-snap-pop" : "opacity-0"}`}
            />
          ))}
        </span>
        <span
          aria-hidden="true"
          className={`material-symbols-outlined text-xl leading-none text-tertiary shrink-0 transition-transform duration-300 motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
        >
          expand_more
        </span>
      </button>

      {/* Weekly-goal progress, always visible under the bar. */}
      <span aria-hidden="true" className="block h-0.5 bg-surface-container-high">
        <span
          className="block h-full bg-primary-container origin-left transition-transform duration-1000 ease-out motion-reduce:transition-none"
          style={{ transform: `scaleX(${revealed ? goalPct / 100 : 0})`, transitionDelay: "400ms" }}
        />
      </span>

      <div
        id={panelId}
        inert={!open}
        className={`grid transition-[grid-template-rows] duration-500 ease-out motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="p-4 sm:p-5 grid gap-x-8 gap-y-5 lg:grid-cols-2 items-start">
            {/* THIS WEEK */}
            <Block title="This week" icon="calendar_month" delay={blockDelay(0)} played={hasOpened}>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="font-display leading-none text-on-surface">
                    <span className="text-5xl text-primary-container tabular-nums">
                      <AnimatedNumber value={week.trainedCount} active={hasOpened} duration={700} />
                    </span>
                    <span className="text-2xl text-tertiary">/7</span>
                  </p>
                  <p className="font-label text-[10px] uppercase tracking-wider text-tertiary mt-1">Days trained · last 7 days</p>
                </div>
                <span
                  className={`flex items-center gap-1 px-2 py-1 font-label text-[10px] uppercase tracking-wider ${
                    delta > 0 ? "bg-primary-container/15 text-primary-container" : "bg-surface-container-high text-tertiary"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm leading-none">{delta > 0 ? "bolt" : "schedule"}</span>
                  {deltaLabel}
                </span>
              </div>

              <ol className="grid grid-cols-7 gap-1.5 mt-4" aria-label="Last 7 days">
                {week.days.map((day, i) => (
                  <li key={day.date} className="flex flex-col items-center gap-1">
                    <span className="relative block w-full h-9" title={`${day.fullLabel}${day.trained ? " — trained" : ""}`}>
                      <span
                        style={{ animationDelay: `${300 + i * 60}ms` }}
                        className={`absolute inset-0 flex items-center justify-center border ${
                          day.trained
                            ? "bg-primary-container text-on-primary-container border-primary-container"
                            : day.isToday
                              ? "border-primary-container/70 text-primary-container"
                              : "bg-surface-container border-surface-variant/60 text-outline"
                        } ${hasOpened ? "animate-snap-pop" : "opacity-0"}`}
                      >
                        {day.trained && <span className="material-symbols-outlined text-lg leading-none">check</span>}
                      </span>
                      {day.isToday && !day.trained && hasOpened && (
                        <span aria-hidden="true" className="animate-snap-ring pointer-events-none absolute inset-0" />
                      )}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`font-label text-[9px] uppercase ${day.isToday ? "text-primary-container font-bold" : "text-outline"}`}
                    >
                      {day.label}
                    </span>
                    <span className="sr-only">{`${day.fullLabel}: ${day.trained ? "trained" : "no session"}`}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-4">
                <div className="flex items-center justify-between font-label text-[9px] uppercase tracking-wider text-tertiary">
                  <span>Weekly goal · {week.goal} days</span>
                  <span className={week.goalRemaining === 0 ? "text-primary-container" : ""}>
                    {week.goalRemaining === 0 ? "Reached" : `${week.goalRemaining} to go`}
                  </span>
                </div>
                <span className="block mt-1.5 h-1.5 bg-surface-container-high">
                  <span
                    className="block h-full bg-primary-container transition-[width] duration-1000 ease-out motion-reduce:transition-none"
                    style={{ width: hasOpened ? `${goalPct}%` : "0%", transitionDelay: "600ms" }}
                  />
                </span>
              </div>
            </Block>

            {/* KEY NUMBERS */}
            <Block title="Key numbers" icon="bolt" delay={blockDelay(1)} played={hasOpened}>
              <div className="grid grid-cols-2 gap-2">
                <Tile
                  href="/dashboard/streak"
                  icon="local_fire_department"
                  label="Streak"
                  value={streak.current}
                  unit={streak.current === 1 ? "day" : "days"}
                  sub={`Best ${streak.best}`}
                  played={hasOpened}
                  delay={300}
                />
                <Tile
                  href="/dashboard/workouts"
                  icon="fitness_center"
                  label="Lifted · 7d"
                  value={lifting.volumeKg}
                  unit="kg"
                  sub={`${lifting.sets} ${lifting.sets === 1 ? "set" : "sets"} · ${lifting.exercises} ${lifting.exercises === 1 ? "exercise" : "exercises"}`}
                  played={hasOpened}
                  delay={380}
                />
                <Tile
                  href="/dashboard/nutrition"
                  icon="restaurant"
                  label="Today"
                  value={nutrition.calories}
                  unit="kcal"
                  sub={nutrition.meals > 0 ? `${nutrition.proteinG}g protein` : "Nothing logged"}
                  played={hasOpened}
                  delay={460}
                />
                <Tile
                  href="/dashboard/attendance"
                  icon="calendar_month"
                  label="Last 4 weeks"
                  value={activity.sessions}
                  unit={activity.sessions === 1 ? "day" : "days"}
                  sub={`${activity.perWeek} per week`}
                  played={hasOpened}
                  delay={540}
                />
              </div>
              {lifting.heaviest && (
                <p className="mt-3 font-body text-xs text-tertiary">
                  Heaviest this week:{" "}
                  <span className="text-on-surface font-semibold">
                    {lifting.heaviest.name} {lifting.heaviest.weightKg}kg × {lifting.heaviest.reps}
                  </span>
                </p>
              )}
            </Block>

            {/* ACTIVITY HEATMAP */}
            <Block
              title="Last 4 weeks"
              icon="today"
              delay={blockDelay(2)}
              played={hasOpened}
              aside={
                <span className="font-label text-[9px] uppercase tracking-wider text-tertiary">{activity.sessions} active days</span>
              }
            >
              <ol className="grid grid-cols-7 gap-1" aria-label="Activity over the last 28 days">
                {activity.cells.map((cell, i) => (
                  <li
                    key={cell.date}
                    title={`${cell.date}${cell.level > 0 ? " — trained" : ""}`}
                    style={{ animationDelay: `${350 + ((i % 7) + Math.floor(i / 7)) * 28}ms` }}
                    className={`h-6 ${HEAT_LEVEL[cell.level]} ${cell.isToday ? "ring-1 ring-primary-container ring-offset-1 ring-offset-surface-container-low" : ""} ${
                      hasOpened ? "animate-snap-pop" : "opacity-0"
                    }`}
                  />
                ))}
              </ol>
              <div className="mt-2 flex items-center justify-between font-label text-[9px] uppercase tracking-wider text-outline">
                <span>Oldest first · today is the last square</span>
                <span className="flex items-center gap-1">
                  Less
                  <span className={`w-2.5 h-2.5 ${HEAT_LEVEL[0]}`} />
                  <span className={`w-2.5 h-2.5 ${HEAT_LEVEL[1]}`} />
                  <span className={`w-2.5 h-2.5 ${HEAT_LEVEL[2]}`} />
                  More
                </span>
              </div>
            </Block>

            {/* MUSCLE BALANCE */}
            <Block title="Muscle balance · 7 days" icon="accessibility_new" delay={blockDelay(4)} played={hasOpened}>
              {balance.parts.length > 0 ? (
                <>
                  <div className="flex h-3 w-full gap-px bg-surface-container-high" role="img" aria-label={balance.parts.map((p) => `${p.category} ${p.pct}%`).join(", ")}>
                    {balance.parts.map((part) => (
                      <span
                        key={part.category}
                        className={`block h-full ${BALANCE_COLOR[part.category] ?? "bg-outline"} transition-[width] duration-1000 ease-out motion-reduce:transition-none`}
                        style={{ width: hasOpened ? `${part.pct}%` : "0%", transitionDelay: "500ms" }}
                      />
                    ))}
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                    {balance.parts.map((part) => (
                      <li key={part.category} className="flex items-center gap-1.5 font-label text-[10px] uppercase tracking-wider text-on-surface">
                        <span className={`w-2 h-2 ${BALANCE_COLOR[part.category] ?? "bg-outline"}`} />
                        {part.category} <span className="text-tertiary">{part.pct}%</span>
                      </li>
                    ))}
                  </ul>
                  {balance.untrained.length > 0 && (
                    <p className="mt-3 font-body text-xs text-tertiary">
                      Not trained this week: <span className="text-on-surface">{balance.untrained.join(", ")}</span>
                    </p>
                  )}
                </>
              ) : (
                <p className="font-body text-xs text-tertiary">Log a few sets this week and you&apos;ll see how your training splits across muscle groups.</p>
              )}
            </Block>

            {/* NUTRITION */}
            <Block
              title="Nutrition today"
              icon="restaurant"
              delay={blockDelay(5)}
              played={hasOpened}
              aside={
                <Link href="/dashboard/nutrition" className="font-label text-[9px] uppercase tracking-wider text-primary-container hover:underline">
                  Log food
                </Link>
              }
            >
              {nutrition.meals > 0 ? (
                <>
                  <p className="font-display leading-none text-on-surface">
                    <span className="text-3xl tabular-nums">
                      <AnimatedNumber value={nutrition.calories} active={hasOpened} />
                    </span>
                    <span className="font-label text-[10px] uppercase tracking-wide text-tertiary ml-1.5">
                      kcal · {nutrition.meals} {nutrition.meals === 1 ? "meal" : "meals"}
                    </span>
                  </p>
                  {nutrition.split && (
                    <>
                      <div className="mt-3 flex h-2 w-full gap-px bg-surface-container-high" role="img" aria-label={`Protein ${nutrition.split.proteinPct}%, carbs ${nutrition.split.carbsPct}%, fat ${nutrition.split.fatPct}%`}>
                        {[
                          { key: "p", pct: nutrition.split.proteinPct, color: "bg-primary-container" },
                          { key: "c", pct: nutrition.split.carbsPct, color: "bg-primary" },
                          { key: "f", pct: nutrition.split.fatPct, color: "bg-tertiary" },
                        ].map((seg) => (
                          <span
                            key={seg.key}
                            className={`block h-full ${seg.color} transition-[width] duration-1000 ease-out motion-reduce:transition-none`}
                            style={{ width: hasOpened ? `${seg.pct}%` : "0%", transitionDelay: "600ms" }}
                          />
                        ))}
                      </div>
                      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 font-label text-[10px] uppercase tracking-wider text-on-surface">
                        <li className="flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-primary-container" />
                          Protein <span className="text-tertiary">{nutrition.proteinG}g</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-primary" />
                          Carbs <span className="text-tertiary">{nutrition.carbsG}g</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-tertiary" />
                          Fat <span className="text-tertiary">{nutrition.fatG}g</span>
                        </li>
                      </ul>
                    </>
                  )}
                </>
              ) : (
                <p className="font-body text-xs text-tertiary">Nothing logged yet today — add a meal to see your calories and macros.</p>
              )}
            </Block>

            {/* RECORDS */}
            <Block
              title="Personal records"
              icon="emoji_events"
              delay={blockDelay(6)}
              played={hasOpened}
              aside={
                <Link href="/dashboard/records" className="font-label text-[9px] uppercase tracking-wider text-primary-container hover:underline">
                  All records
                </Link>
              }
            >
              {records.recent.length > 0 ? (
                <ul className="flex flex-col divide-y divide-surface-variant/40 bg-surface-container border border-surface-variant/40">
                  {records.recent.map((record) => (
                    <li key={record.name} className="flex items-center gap-3 px-3 py-2.5">
                      <span className="w-8 h-8 shrink-0 flex items-center justify-center bg-surface-container-high text-primary-container">
                        <span className="material-symbols-outlined text-base leading-none">emoji_events</span>
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate font-label text-[11px] uppercase tracking-wide text-on-surface">{record.name}</span>
                        <span className="block font-body text-[10px] text-tertiary">{agoLabel(record.daysAgo)}</span>
                      </span>
                      <span className="font-display text-lg text-primary-container tabular-nums shrink-0">
                        {record.weightKg != null ? `${record.weightKg}kg × ${record.reps}` : `${record.reps} reps`}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-body text-xs text-tertiary">No records yet — log a set to start your trophy case.</p>
              )}
            </Block>

            {/* RANK */}
            <Block
              title="Strongest muscle"
              icon="military_tech"
              delay={blockDelay(7)}
              played={hasOpened}
              aside={
                <Link href="/dashboard/progress" className="font-label text-[9px] uppercase tracking-wider text-primary-container hover:underline">
                  All ranks
                </Link>
              }
            >
              {rank && tier ? (
                <div className="flex items-center gap-3 bg-surface-container border border-surface-variant/40 p-3">
                  <span className={`w-9 h-9 shrink-0 flex items-center justify-center border ${tier.badge}`}>
                    <span className="material-symbols-outlined text-base leading-none">{CATEGORY_ICON[rank.category] ?? "fitness_center"}</span>
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-label text-[11px] uppercase tracking-wide text-on-surface truncate">
                        {rank.category} · {rank.rankName}
                      </span>
                      <span className="font-label text-[9px] uppercase tracking-wider text-tertiary shrink-0">
                        {rank.maxed ? "Top rank" : `${rank.xpToNext} XP to next`}
                      </span>
                    </span>
                    <span className="block mt-1.5 h-1.5 bg-surface-container-high">
                      <span
                        className={`block h-full ${tier.bar} transition-[width] duration-1000 ease-out motion-reduce:transition-none`}
                        style={{ width: hasOpened ? `${Math.max(rank.progressPct, 3)}%` : "0%", transitionDelay: "700ms" }}
                      />
                    </span>
                  </span>
                </div>
              ) : (
                <p className="font-body text-xs text-tertiary">Log sets to start ranking up your muscle groups.</p>
              )}
            </Block>

            {/* HABITS + MEMBERSHIP */}
            <Block title="Habits & plan" icon="schedule" delay={blockDelay(8)} played={hasOpened}>
              <div className="flex flex-wrap gap-2">
                {habits.bestDays.length > 0 && <Chip icon="calendar_month">Best {habits.bestDays.map((d) => d.slice(0, 3)).join(" & ")}</Chip>}
                {habits.timeOfDay && <Chip icon="schedule">{habits.timeOfDay === "Mixed" ? "Any time of day" : `${habits.timeOfDay} person`}</Chip>}
                {activity.sessions > 0 && <Chip icon="bolt">{activity.perWeek} days / week</Chip>}
                {records.thisMonth > 0 && (
                  <Chip icon="emoji_events">
                    {records.thisMonth} PR{records.thisMonth === 1 ? "" : "s"} this month
                  </Chip>
                )}
                {membership.plan && <Chip icon="verified">{membership.plan} plan</Chip>}
                {membership.since && (
                  <Chip icon="badge">
                    Since {membership.since}
                    {membership.months >= 1 ? ` · ${membership.months} mo` : ""}
                  </Chip>
                )}
                {fee.kind !== "none" && (
                  <Link
                    href="/dashboard/fees"
                    className={`inline-flex items-center gap-1.5 border px-2.5 py-1.5 font-label text-[10px] uppercase tracking-wider ${FEE_TONE[fee.kind]}`}
                  >
                    <span className="material-symbols-outlined text-sm leading-none">payments</span>
                    {fee.label}
                  </Link>
                )}
              </div>
              {activity.sessions === 0 && (
                <p className="mt-3 font-body text-xs text-tertiary">Check in a few times and your habits show up here.</p>
              )}
            </Block>

            {/* ALL INSIGHTS */}
            {standouts.length > 0 && (
              <Block title="What stands out" icon="stars" delay={blockDelay(9)} played={hasOpened} wide>
                <ul className="grid gap-2 lg:grid-cols-2">
                  {standouts.map((insight, i) => (
                    <li
                      key={insight.text}
                      style={{ animationDelay: `${520 + i * 60}ms` }}
                      className={`flex items-start gap-3 bg-surface-container border border-surface-variant/40 px-3 py-2.5 ${
                        hasOpened ? "animate-snap-tick" : "opacity-0"
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg leading-none text-primary-container shrink-0 mt-0.5">{insight.icon}</span>
                      <span className="font-body text-sm text-on-surface leading-snug">{insight.text}</span>
                    </li>
                  ))}
                </ul>
              </Block>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
