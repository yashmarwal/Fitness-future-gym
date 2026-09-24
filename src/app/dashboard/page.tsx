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
import { StatCard } from "@/frontend/components/dashboard/Primitives";
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
const QUICK_LINKS = [
  { href: "/dashboard/attendance", label: "Attendance History", icon: "calendar_month", gated: false },
  { href: "/dashboard/workouts", label: "Log A Workout", icon: "fitness_center", gated: true },
  { href: "/dashboard/progress", label: "Muscle Progress", icon: "military_tech", gated: false },
  { href: "/dashboard/plan", label: "Plan Workouts", icon: "event_note", gated: true },
  { href: "/dashboard/plan?tab=templates", label: "Workout Templates", icon: "auto_awesome", gated: true },
  { href: "/dashboard/nutrition", label: "Log Food", icon: "restaurant", gated: false },
  { href: "/dashboard/timer", label: "Rest Timer", icon: "timer", gated: true },
  { href: "/dashboard/streak", label: "Streak Tracker", icon: "local_fire_department", gated: false },
  { href: "/dashboard/fees", label: "Fee Status", icon: "payments", gated: false },
  { href: "/dashboard/exercises", label: "Exercise Library", icon: "menu_book", gated: false },
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

export default async function DashboardPage() {
  const session = await getMemberSession();
  const [member, attendance, todaysWorkout, attendanceStatus, muscleProgress, personalRecords, workoutLogs, todaysFood, fitnessProfile] =
    await Promise.all([
      getMemberById(session!.memberId),
      getRecentAttendance(session!.memberId, 60),
      findTodaysWorkout(session!.memberId),
      getAttendanceStatus(session!.memberId),
      getMemberMuscleProgress(session!.memberId),
      listPersonalRecords(session!.memberId),
      // 400 comfortably covers two weeks of even a heavy logger (logs are kept 30 days).
      listWorkoutLogs(session!.memberId, 400),
      listTodaysFoodLogs(session!.memberId),
      getFitnessProfile(session!.memberId),
    ]);

  // After a front-desk QR check-in the popup greets the member on their next
  // visit here. Skipped once they've already logged something since checking
  // in (the check-in cooldown is 3 hours, so an older check-in belongs to a
  // finished session). The check-in time doubles as the popup's identity.
  const checkedIn = attendanceStatus.checkedIn;
  const checkedInAt = attendanceStatus.lastCheckedInAt;
  const promptId =
    checkedInAt &&
    isWithinMinutes(checkedInAt, 170) &&
    !workoutLogs.some((log) => new Date(log.loggedAt) > new Date(checkedInAt))
      ? checkedInAt
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
        <Link
          href="/dashboard/workouts"
          className={`relative bg-primary-container text-on-primary-container p-4 shadow-soft rounded-2xl flex flex-col items-center gap-1.5 text-center active:scale-[0.98] transition-transform ${
            checkedIn ? "" : "opacity-45 grayscale"
          }`}
        >
          {!checkedIn && <LockBadge />}
          <span className="material-symbols-outlined text-2xl leading-none">fitness_center</span>
          <span className="font-label text-[10px] uppercase tracking-wide">Log Workout</span>
        </Link>
        <Link
          href="/dashboard/nutrition"
          className="bg-primary-container text-on-primary-container p-4 shadow-soft rounded-2xl flex flex-col items-center gap-1.5 text-center active:scale-[0.98] transition-transform"
        >
          <span className="material-symbols-outlined text-2xl leading-none">restaurant</span>
          <span className="font-label text-[10px] uppercase tracking-wide">Log Food</span>
        </Link>
        <Link
          href="/dashboard/timer"
          className={`relative bg-primary-container text-on-primary-container p-4 shadow-soft rounded-2xl flex flex-col items-center gap-1.5 text-center active:scale-[0.98] transition-transform ${
            checkedIn ? "" : "opacity-45 grayscale"
          }`}
        >
          {!checkedIn && <LockBadge />}
          <span className="material-symbols-outlined text-2xl leading-none">timer</span>
          <span className="font-label text-[10px] uppercase tracking-wide">Start Timer</span>
        </Link>
        <Link
          href="/dashboard/bmi"
          className="bg-primary-container text-on-primary-container p-4 shadow-soft rounded-2xl flex flex-col items-center gap-1.5 text-center active:scale-[0.98] transition-transform"
        >
          <span className="material-symbols-outlined text-2xl leading-none">calculate</span>
          <span className="font-label text-[10px] uppercase tracking-wide">BMI Calc</span>
        </Link>
      </div>
      {!checkedIn && (
        <p className="font-label text-[9px] uppercase tracking-wider text-tertiary mb-6">
          <span className="material-symbols-outlined text-xs leading-none align-text-bottom mr-0.5">lock</span>
          Faded tiles need a check-in first
        </p>
      )}

      <AttendanceCheckInButton initialStatus={attendanceStatus} />

      <PersonalRecordsBar />

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
        {QUICK_LINKS.map((link) => {
          const dim = link.gated && !checkedIn;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative bg-surface-container p-5 shadow-soft rounded-2xl flex flex-col gap-3 hover:border-primary-container hover:-translate-y-0.5 border border-transparent active:scale-[0.98] transition-all ${
                dim ? "opacity-45 grayscale" : ""
              }`}
            >
              {dim && <LockBadge />}
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-surface-container-high text-primary-container shrink-0">
                <span className="material-symbols-outlined text-xl leading-none">{link.icon}</span>
              </span>
              <span className="font-label text-xs uppercase tracking-wide text-on-surface">{link.label}</span>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
