import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
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
// already decided (snapshot, muscle progress, streak, membership card,
// personal records). Still clickable either way: tapping a gated one while
// not checked in just lands on that page's own "mark attendance" screen,
// same as always — this is only about giving a visual heads-up before the
// tap, not a new block. Fee Status and Attendance History used to be here
// too — moved into Settings (dashboard/settings/page.tsx) as account
// lookups rather than frequent actions.
// Ordered by priority — daily/frequent actions first, the exercise library
// last — not alphabetical or by whenever each was added. `featured` marks
// the two standout, high-energy features (Beast Mode, Playground) for an
// extra accent border in QuickActionCard below; `category` is the small
// eyebrow label every card shows above its bold title; `image` is the
// filename (no extension) under public/images/quick-actions/ — real
// illustrated card art the user supplied as one combined grid image,
// cropped into these 10 individual files (see the crop script's row/column
// boundary detection — not a plain even split, the source grid's cells
// weren't perfectly uniform).
// `filter`/`iconColor`: a per-card hue-rotate (same technique as the
// Workout Timer and Generate Plan bars — recolors the existing art, no new
// images) grouping cards by function so the color itself carries meaning
// rather than being decorative: blue for training, green for nutrition,
// cyan for recovery, purple/magenta for social & growth, gold for streaks,
// teal for programs, slate for reference material. Beast Mode keeps the
// original orange — it's the flagship feature, not part of the system.
const QUICK_LINKS = [
  { href: "/dashboard/workouts?beastMode=open", label: "Beast Mode", category: "Beast Mode", icon: "bolt", image: "beast-mode", gated: true, featured: true },
  { href: "/dashboard/playground", label: "Playground", category: "Community", icon: "group", image: "playground", gated: true, featured: true, filter: "hue-rotate(-85deg) saturate(1) brightness(1.1)", iconColor: "text-purple-400" },
  { href: "/dashboard/workouts", label: "Log A Workout", category: "Training", icon: "fitness_center", image: "log-workout", gated: true, featured: false, filter: "hue-rotate(200deg) saturate(1.15)", iconColor: "text-blue-400" },
  { href: "/dashboard/plan", label: "Plan Workouts", category: "Planning", icon: "event_note", image: "plan-workouts", gated: true, featured: false, filter: "hue-rotate(265deg)", iconColor: "text-violet-400" },
  { href: "/dashboard/nutrition", label: "Log Food", category: "Nutrition", icon: "restaurant", image: "log-food", gated: false, featured: false, filter: "hue-rotate(36deg)", iconColor: "text-yellow-400" },
  { href: "/dashboard/timer", label: "Rest Timer", category: "Recovery", icon: "timer", image: "rest-timer", gated: true, featured: false, filter: "hue-rotate(174deg) saturate(0.9) brightness(1.15)", iconColor: "text-cyan-400" },
  { href: "/dashboard/progress", label: "Muscle Progress", category: "Progress", icon: "military_tech", image: "muscle-progress", gated: false, featured: false, filter: "hue-rotate(-76deg) brightness(1.05)", iconColor: "text-fuchsia-400" },
  { href: "/dashboard/streak", label: "Streak Tracker", category: "Consistency", icon: "local_fire_department", image: "streak-tracker", gated: false, featured: false, filter: "hue-rotate(29deg) brightness(1.1)", iconColor: "text-amber-400" },
  { href: "/dashboard/plan?tab=templates", label: "Workout Templates", category: "Programs", icon: "auto_awesome", image: "workout-templates", gated: true, featured: false, filter: "hue-rotate(159deg) saturate(0.95) brightness(1.05)", iconColor: "text-teal-400" },
  { href: "/dashboard/exercises", label: "Exercise Library", category: "Reference", icon: "menu_book", image: "exercise-library", gated: false, featured: false, filter: "hue-rotate(194deg) saturate(0.4) brightness(1.1)", iconColor: "text-slate-400" },
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

// Every Quick Action is this one card now — the real illustrated card art
// (public/images/quick-actions/, see the QUICK_LINKS comment above) as a
// full-bleed background, with the small category eyebrow + bold title laid
// over it. `featured` (Beast Mode, Playground) gets a brand-orange border;
// everything else gets a plain hairline one — matching the reference,
// where only those two stood out with an accent outline. `image` is
// optional: a card with none falls back to a plain dark fill with a corner
// gradient instead of either breaking or reverting to the old,
// visually-inconsistent tile style — only used until real art exists.
function QuickActionCard({
  href,
  icon,
  category,
  label,
  image,
  featured,
  dim,
  priority = false,
  filter,
  iconColor = "text-primary-container",
}: {
  href: string;
  icon: string;
  category: string;
  label: string;
  image?: string;
  featured: boolean;
  dim: boolean;
  /** Preload instead of lazy-loading — only for cards visible on first
   * paint with no scroll, so they never flash in after the frame. */
  priority?: boolean;
  /** CSS filter (hue-rotate/saturate/brightness) recoloring the shared art
   * per-card — see the QUICK_LINKS comment above. */
  filter?: string;
  iconColor?: string;
}) {
  return (
    <Link
      href={href}
      className={`relative overflow-hidden rounded-2xl min-h-28 border active:scale-[0.97] transition-all duration-200 ${
        featured ? "border-primary-container/70" : "border-white/10"
      } ${dim ? "opacity-40 grayscale" : ""} ${image ? "bg-black" : "bg-surface-container-high"}`}
      style={
        image
          ? undefined
          : {
              backgroundImage:
                "radial-gradient(130% 130% at 100% 100%, rgba(199,62,10,0.55) 0%, rgba(199,62,10,0.18) 35%, rgba(0,0,0,0) 65%)",
            }
      }
    >
      {dim && <LockBadge />}
      {image && (
        <Image
          src={`/images/quick-actions/${image}.jpg`}
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 1024px) 50vw, 33vw"
          className="object-cover pointer-events-none"
          style={filter ? { filter } : undefined}
        />
      )}
      <div className="relative z-10 h-full flex flex-col justify-between p-4">
        <span className={`material-symbols-outlined text-xl leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] ${iconColor}`}>
          {icon}
        </span>
        <div>
          <p className="font-body text-[11px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{category}</p>
          <p className="font-display text-lg uppercase tracking-wide text-white leading-tight max-w-[75%] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            {label}
          </p>
        </div>
      </div>
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

      {/* One-tap access to the four most prominent actions — Beast Mode
          and Playground first, matching their featured treatment in the
          Quick Actions grid below — kept right at the top so they never
          require scrolling past everything else. Distinct from that full
          "Quick Actions" link grid further down, which covers every
          dashboard route rather than just these four. */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${checkedIn ? "mb-6" : "mb-2"}`}>
        <QuickActionCard
          href="/dashboard/workouts?beastMode=open"
          icon="bolt"
          category="Beast Mode"
          label="Beast Mode"
          image="beast-mode"
          featured
          dim={!checkedIn}
          priority
        />
        <QuickActionCard
          href="/dashboard/playground"
          icon="group"
          category="Community"
          label="Playground"
          image="playground"
          featured
          dim={!checkedIn}
          priority
          filter="hue-rotate(-85deg) saturate(1) brightness(1.1)"
          iconColor="text-purple-400"
        />
        <QuickActionCard
          href="/dashboard/workouts"
          icon="fitness_center"
          category="Training"
          label="Log Workout"
          image="log-workout"
          featured={false}
          dim={!checkedIn}
          priority
          filter="hue-rotate(200deg) saturate(1.15)"
          iconColor="text-blue-400"
        />
        <QuickActionCard
          href="/dashboard/bmi"
          icon="calculate"
          category="Health"
          label="BMI Calc"
          image="bmi-calc"
          featured={false}
          dim={false}
          priority
          filter="hue-rotate(150deg) saturate(0.9) brightness(1.1)"
          iconColor="text-emerald-400"
        />
      </div>
      {!checkedIn && (
        <p className="font-label text-[9px] uppercase tracking-wider text-tertiary mb-6">
          <span className="material-symbols-outlined text-xs leading-none align-text-bottom mr-0.5">lock</span>
          Faded tiles need a check-in first
        </p>
      )}

      <AttendanceCheckInButton initialStatus={attendanceStatus} />

      <WorkoutTimerWidget />

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
        <StatCard
          value={member?.currentStreakDays ?? 0}
          label="Day Streak"
          tone="accent"
          icon="local_fire_department"
          image="/images/dashboard-stats/day-streak.jpg"
          priority
        />
        <StatCard
          value={attendance.length}
          label="Recent Check-Ins"
          icon="calendar_month"
          image="/images/dashboard-stats/recent-checkins.jpg"
          priority
        />
        <StatCard
          value={member?.plan ?? "—"}
          label="Current Plan"
          size="md"
          uppercase
          icon="badge"
          image="/images/dashboard-stats/current-plan.jpg"
          priority
        />
        <StatCard
          value={daysUntilDue !== null ? `${daysUntilDue}d` : "—"}
          label="Until Fee Due"
          size="md"
          uppercase
          icon="payments"
          tone={daysUntilDue !== null && daysUntilDue <= 3 ? "alert" : "default"}
          image="/images/dashboard-stats/fee-due.jpg"
          priority
        />
      </div>

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
        {QUICK_LINKS.map((link) => (
          <QuickActionCard key={link.href} {...link} dim={link.gated && !checkedIn} />
        ))}
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
