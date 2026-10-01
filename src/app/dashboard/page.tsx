import { Suspense } from "react";
import Link from "next/link";
import { getMemberSession } from "@/backend/auth/session";
import { getMemberById } from "@/backend/services/member";
import { getRecentAttendance, getAttendanceStatus } from "@/backend/services/attendance";
import { findTodaysWorkout } from "@/backend/services/workoutPlans";
import { getMemberMuscleProgress } from "@/backend/services/muscleProgress";
import { listPersonalRecords } from "@/backend/services/personalRecords";
import { listWorkoutLogs } from "@/backend/services/workouts";
import { listTodaysFoodLogs } from "@/backend/services/nutrition";
import { getFitnessProfile } from "@/backend/services/fitnessProfile";
import { daysUntil, getIstHour, greetingForHour, isWithinMinutes } from "@/frontend/lib/date";
import { buildMemberSnapshot } from "@/frontend/lib/memberSnapshot";
import { StatCard, Skeleton } from "@/frontend/components/dashboard/Primitives";
import PersonalNoteArea from "@/frontend/components/dashboard/PersonalNoteArea";
import AttendanceCheckInButton from "@/frontend/components/dashboard/AttendanceCheckInButton";
import PersonalRecordsBar from "@/frontend/components/dashboard/PersonalRecordsBar";
import TodayWorkoutBanner from "@/frontend/components/dashboard/TodayWorkoutBanner";
import MuscleProgressTeaser from "@/frontend/components/dashboard/MuscleProgressTeaser";
import WorkoutTimerWidget from "@/frontend/components/dashboard/WorkoutTimerWidget";
import DashboardSnapshot from "@/frontend/components/dashboard/DashboardSnapshot";
import WorkoutPromptBanner from "@/frontend/components/dashboard/WorkoutPromptBanner";
import RestTimerPill from "@/frontend/components/dashboard/RestTimerPill";
import FitnessProfileNudge from "@/frontend/components/dashboard/FitnessProfileNudge";
import GeneratePlanBar from "@/frontend/components/dashboard/GeneratePlanBar";

const GREETING_SUBLINES: Record<string, string> = {
  "Good Morning": "Early floor time — get the first set in.",
  "Good Afternoon": "Halfway through the day. Keep the momentum.",
  "Good Evening": "Prime time on the floor. Let's move.",
  "Good Night": "Late one? Recovery counts too.",
  "Still Grinding": "Burning the midnight oil.",
};

// `gated: true` marks a link to one of the three attendance-locked pages
// (workouts, plan, timer — see AttendanceLock.tsx / getAttendanceStatus)
// — everything else here works with no check-in, matching the exemptions
// already decided (snapshot, attendance history, muscle progress, streak,
// fee status, membership card, personal records). Still clickable either
// way: tapping a gated one while not checked in just lands on that page's
// own "mark attendance" screen, same as always — this is only about giving
// a visual heads-up before the tap, not a new block.
// Ordered by priority — daily/frequent actions first, admin/reference
// stuff (fees, the exercise library) last — not alphabetical or by
// whenever each was added. `featured` marks the two standout, high-energy
// features (Beast Mode, Playground) for the distinct card treatment below;
// everything else shares the one plain "quick link" look.
const QUICK_LINKS = [
  { href: "/dashboard/workouts?beastMode=open", label: "Beast Mode", icon: "bolt", gated: true, featured: true },
  { href: "/dashboard/playground", label: "Playground", icon: "group", gated: true, featured: true },
  { href: "/dashboard/workouts", label: "Log A Workout", icon: "fitness_center", gated: true, featured: false },
  { href: "/dashboard/plan", label: "Plan Workouts", icon: "event_note", gated: true, featured: false },
  { href: "/dashboard/nutrition", label: "Log Food", icon: "restaurant", gated: false, featured: false },
  { href: "/dashboard/timer", label: "Rest Timer", icon: "timer", gated: true, featured: false },
  { href: "/dashboard/progress", label: "Muscle Progress", icon: "military_tech", gated: false, featured: false },
  { href: "/dashboard/streak", label: "Streak Tracker", icon: "local_fire_department", gated: false, featured: false },
  { href: "/dashboard/plan?tab=templates", label: "Workout Templates", icon: "auto_awesome", gated: true, featured: false },
  { href: "/dashboard/attendance", label: "Attendance History", icon: "calendar_month", gated: false, featured: false },
  { href: "/dashboard/exercises", label: "Exercise Library", icon: "menu_book", gated: false, featured: false },
  { href: "/dashboard/fees", label: "Fee Status", icon: "payments", gated: false, featured: false },
];

// Small badge shown on a gated tile/link when the member hasn't checked in
// yet — the dim/grayscale treatment alone can read as "broken" rather than
// "locked," this makes the reason explicit at a glance.
function LockBadge() {
  return (
    <span
      aria-hidden="true"
      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center bg-surface-container-lowest/90 text-tertiary"
    >
      <span className="material-symbols-outlined text-xs leading-none">lock</span>
    </span>
  );
}

// The four top-of-page shortcuts — a bold brand gradient with a glossy
// corner highlight (bottom-right, so it never fights LockBadge's own
// top-right spot), an icon housed in a frosted chip rather than bare, and
// tighter rounding than the Quick Actions grid below — deliberately a
// different card language for what's the primary CTA row, not a
// browsable list.
// Restrained glass, not decorated glass: a neutral (never brand-tinted)
// translucent fill, a thin low-opacity border, backdrop-blur — no glow,
// no icon chip-inside-a-chip. Two things make it read as real glass
// rather than a flat tinted panel, both subtle: backdrop-saturate (the
// same blur+saturate pairing Apple's own glass recipe uses, so whatever's
// faintly visible through it looks a little richer, not washed out) and a
// two-layer shadow — an inset hairline highlight along the top edge
// (light catching the glass) plus a soft, neutral outer shadow (real
// depth, not a colored glow).
const GLASS_SHADOW = "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_8px_24px_-4px_rgba(0,0,0,0.35)]";

function ShortcutTile({ href, icon, label, locked }: { href: string; icon: string; label: string; locked: boolean }) {
  return (
    <Link
      href={href}
      className={`relative bg-white/6 backdrop-blur-xl backdrop-saturate-150 ${GLASS_SHADOW} p-4 rounded-2xl border border-white/10 hover:bg-white/8 hover:border-white/20 active:scale-95 transition-all duration-200 flex flex-col items-center gap-2 text-center ${
        locked ? "opacity-40 grayscale" : ""
      }`}
    >
      {locked && <LockBadge />}
      <span className="material-symbols-outlined text-2xl leading-none text-primary-container">{icon}</span>
      <span className="font-label text-[10px] uppercase font-bold tracking-wide text-on-surface">{label}</span>
    </Link>
  );
}

// The plain Quick Actions tile — same premium glass as above, tighter
// padding since there are a dozen of these on screen at once.
function QuickLink({ href, icon, label, dim }: { href: string; icon: string; label: string; dim: boolean }) {
  return (
    <Link
      href={href}
      className={`relative bg-white/4 backdrop-blur-xl backdrop-saturate-150 ${GLASS_SHADOW} p-4 rounded-2xl border border-white/10 hover:bg-white/6 hover:border-white/20 active:scale-[0.97] transition-all duration-200 flex flex-col gap-3 ${
        dim ? "opacity-40 grayscale" : ""
      }`}
    >
      {dim && <LockBadge />}
      <span className="material-symbols-outlined text-2xl leading-none text-primary-container">{icon}</span>
      <span className="font-label text-[11px] uppercase tracking-wide text-on-surface font-bold">{label}</span>
    </Link>
  );
}

// Beast Mode and Playground still stand out from the plain tiles, but the
// distinction is just a brand-colored border and label instead of a glow,
// a pulsing dot, and an extra tint layer — one clear signal instead of
// four competing ones.
function FeaturedQuickLink({ href, icon, label, dim }: { href: string; icon: string; label: string; dim: boolean }) {
  return (
    <Link
      href={href}
      className={`relative bg-white/4 backdrop-blur-xl backdrop-saturate-150 ${GLASS_SHADOW} p-4 rounded-2xl border border-primary-container/40 hover:bg-white/6 hover:border-primary-container/70 active:scale-[0.97] transition-all duration-200 flex flex-col gap-3 ${
        dim ? "opacity-40 grayscale" : ""
      }`}
    >
      {dim && <LockBadge />}
      <span className="material-symbols-outlined text-2xl leading-none text-primary-container">{icon}</span>
      <span className="font-label text-[11px] uppercase tracking-wide text-primary-container font-bold">{label}</span>
    </Link>
  );
}

// Only what checking in actually needs — session, member (for the
// greeting/gating), and today's attendance status — awaited directly so
// this paints as fast as possible. Everything else on this page (workout
// history, muscle progress, personal records, food log, fitness profile —
// five separate queries, one of them a 400-row scan) used to block this
// same first paint despite having nothing to do with whether the member
// can check in. That's pulled out into DashboardBelowFold below, which
// streams in on its own once ready instead of holding up the part of the
// page that's actually time-sensitive.
export default async function DashboardPage() {
  const session = await getMemberSession();
  const [member, attendanceStatus] = await Promise.all([
    getMemberById(session!.memberId),
    getAttendanceStatus(session!.memberId),
  ]);

  const checkedIn = attendanceStatus.checkedIn;
  const greeting = greetingForHour(getIstHour());
  const greetingLine = GREETING_SUBLINES[greeting] ?? GREETING_SUBLINES["Good Morning"];

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-(--container-max) mx-auto">
      {/* DashboardHeader (dashboard/layout.tsx) already says "Welcome Back
          {fullName}" persistently above this on every route — repeating the
          name here would just be redundant, so this stays purely
          time-contextual instead. */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <p className="font-label text-xs uppercase tracking-widest text-primary-container mb-0.5">{greeting}</p>
          <p className="font-body text-sm text-tertiary">{greetingLine}</p>
        </div>
        <RestTimerPill />
      </div>

      <PersonalNoteArea />

      {/* One-tap access to the three most common actions, kept right at
          the top so they never require scrolling past everything else —
          distinct from the full "Quick Actions" link grid further down,
          which covers every dashboard route rather than just the top 3. */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${checkedIn ? "mb-6" : "mb-2"}`}>
        <ShortcutTile href="/dashboard/workouts" icon="fitness_center" label="Log Workout" locked={!checkedIn} />
        <ShortcutTile href="/dashboard/nutrition" icon="restaurant" label="Log Food" locked={false} />
        <ShortcutTile href="/dashboard/timer" icon="timer" label="Start Timer" locked={!checkedIn} />
        <ShortcutTile href="/dashboard/bmi" icon="calculate" label="BMI Calc" locked={false} />
      </div>
      {!checkedIn && (
        <p className="font-label text-[9px] uppercase tracking-wider text-tertiary mb-6">
          <span className="material-symbols-outlined text-xs leading-none align-text-bottom mr-0.5">lock</span>
          Faded tiles need a check-in first
        </p>
      )}

      <AttendanceCheckInButton initialStatus={attendanceStatus} />

      <PersonalRecordsBar />

      <Suspense fallback={<DashboardBelowFoldSkeleton />}>
        <DashboardBelowFold
          memberId={session!.memberId}
          member={member}
          checkedIn={checkedIn}
          lastCheckedInAt={attendanceStatus.lastCheckedInAt}
        />
      </Suspense>
    </div>
  );
}

// Everything that ISN'T needed to decide "can this member check in right
// now" — plan-generation nudge, today's planned workout, the four stat
// cards, the workout timer, the full snapshot bar (attendance history +
// workout logs + personal records + today's food + muscle progress, five
// queries combined into one derived view), the post-check-in workout
// prompt, the muscle-progress teaser, and the Quick Actions grid. Reads
// `member`/`checkedIn`/`lastCheckedInAt` from the fast shell above instead
// of re-fetching them.
async function DashboardBelowFold({
  memberId,
  member,
  checkedIn,
  lastCheckedInAt,
}: {
  memberId: string;
  member: Awaited<ReturnType<typeof getMemberById>>;
  checkedIn: boolean;
  lastCheckedInAt: string | null;
}) {
  const [attendance, todaysWorkout, muscleProgress, personalRecords, workoutLogs, todaysFood, fitnessProfile] =
    await Promise.all([
      getRecentAttendance(memberId, 60),
      findTodaysWorkout(memberId),
      getMemberMuscleProgress(memberId),
      listPersonalRecords(memberId),
      // 400 comfortably covers two weeks of even a heavy logger (logs are kept 30 days).
      listWorkoutLogs(memberId, 400),
      listTodaysFoodLogs(memberId),
      getFitnessProfile(memberId),
    ]);

  // After a front-desk QR check-in the popup greets the member on their next
  // visit here. Skipped once they've already logged something since checking
  // in (the check-in cooldown is 3 hours, so an older check-in belongs to a
  // finished session). The check-in time doubles as the popup's identity.
  const promptId =
    lastCheckedInAt &&
    isWithinMinutes(lastCheckedInAt, 170) &&
    !workoutLogs.some((log) => new Date(log.loggedAt) > new Date(lastCheckedInAt))
      ? lastCheckedInAt
      : null;

  const snapshot = buildMemberSnapshot({
    member: {
      currentStreakDays: member?.currentStreakDays ?? 0,
      longestStreakDays: member?.longestStreakDays ?? 0,
      feeDueDate: member?.feeDueDate ?? null,
      plan: member?.plan ?? null,
      joinedAt: member?.joinedAt ?? null,
    },
    attendance,
    workoutLogs,
    todaysFood,
    personalRecords,
    muscleProgress,
  });

  const daysUntilDue = member?.feeDueDate ? daysUntil(member.feeDueDate) : null;

  return (
    <>
      <GeneratePlanBar fitnessProfile={fitnessProfile} />

      {!fitnessProfile && <FitnessProfileNudge />}

      {todaysWorkout && (
        <TodayWorkoutBanner
          planName={todaysWorkout.planName}
          day={todaysWorkout.day}
          focus={todaysWorkout.focus}
          exercises={todaysWorkout.exercises}
        />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard value={member?.currentStreakDays ?? 0} label="Day Streak" tone="accent" icon="local_fire_department" />
        <StatCard value={attendance.length} label="Recent Check-Ins" icon="calendar_month" />
        <StatCard value={member?.plan ?? "—"} label="Current Plan" size="md" uppercase icon="badge" />
        <StatCard
          value={daysUntilDue !== null ? `${daysUntilDue}d` : "—"}
          label="Until Fee Due"
          size="md"
          uppercase
          icon="payments"
          tone={daysUntilDue !== null && daysUntilDue <= 3 ? "alert" : "default"}
        />
      </div>

      <WorkoutTimerWidget />

      <DashboardSnapshot snapshot={snapshot} />

      <WorkoutPromptBanner
        promptId={promptId}
        streak={member?.currentStreakDays ?? 0}
        todaysPlan={
          todaysWorkout
            ? { label: todaysWorkout.focus || todaysWorkout.day, exerciseCount: todaysWorkout.exercises.length }
            : null
        }
      />

      <MuscleProgressTeaser progress={muscleProgress} />

      <h2 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {QUICK_LINKS.map((link) =>
          link.featured ? (
            <FeaturedQuickLink key={link.href} {...link} dim={link.gated && !checkedIn} />
          ) : (
            <QuickLink key={link.href} {...link} dim={link.gated && !checkedIn} />
          )
        )}
      </div>
    </>
  );
}

// Shapes roughly match DashboardBelowFold's real content so nothing visibly
// jumps when it swaps in — same idea as dashboard/loading.tsx, just scoped
// to this one Suspense boundary instead of the whole route.
function DashboardBelowFoldSkeleton() {
  return (
    <>
      <Skeleton className="h-16 w-full mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-19 w-full mb-6" />
      <Skeleton className="h-28 w-full mb-6" />
      <Skeleton className="h-7 w-40 mb-4" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </>
  );
}
