import Link from "next/link";
import { getMemberSession } from "@/backend/auth/session";
import { getMemberById } from "@/backend/services/member";
import { getRecentAttendance, getAttendanceStatus } from "@/backend/services/attendance";
import { findTodaysWorkout } from "@/backend/services/workoutPlans";
import { listNotifications } from "@/backend/services/memberNotifications";
import { getMemberMuscleProgress } from "@/backend/services/muscleProgress";
import { daysUntil, getIstHour, greetingForHour } from "@/frontend/lib/date";
import { StatCard } from "@/frontend/components/dashboard/Primitives";
import PersonalNoteArea from "@/frontend/components/dashboard/PersonalNoteArea";
import AttendanceCheckInButton from "@/frontend/components/dashboard/AttendanceCheckInButton";
import NotificationBar from "@/frontend/components/dashboard/NotificationBar";
import TodayWorkoutBanner from "@/frontend/components/dashboard/TodayWorkoutBanner";
import MuscleProgressTeaser from "@/frontend/components/dashboard/MuscleProgressTeaser";
import NotificationsCard from "@/frontend/components/dashboard/NotificationsCard";

const GREETING_SUBLINES: Record<string, string> = {
  "Good Morning": "Early floor time — get the first set in.",
  "Good Afternoon": "Halfway through the day. Keep the momentum.",
  "Good Evening": "Prime time on the floor. Let's move.",
  "Good Night": "Late one? Recovery counts too.",
  "Still Grinding": "Burning the midnight oil.",
};

function computeStreak(checkIns: string[]): number {
  if (checkIns.length === 0) return 0;

  const days = new Set(checkIns.map((iso) => new Date(iso).toDateString()));
  let streak = 0;
  const cursor = new Date();

  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

const QUICK_LINKS = [
  { href: "/dashboard/card", label: "Membership Card", icon: "badge" },
  { href: "/dashboard/attendance", label: "Attendance History", icon: "calendar_month" },
  { href: "/dashboard/workouts", label: "Log A Workout", icon: "fitness_center" },
  { href: "/dashboard/progress", label: "Muscle Progress", icon: "military_tech" },
  { href: "/dashboard/plan", label: "Plan Workouts", icon: "event_note" },
  { href: "/dashboard/plan?tab=templates", label: "Workout Templates", icon: "auto_awesome" },
  { href: "/dashboard/nutrition", label: "Log Food", icon: "restaurant" },
  { href: "/dashboard/timer", label: "Rest Timer", icon: "timer" },
  { href: "/dashboard/streak", label: "Streak Tracker", icon: "local_fire_department" },
  { href: "/dashboard/fees", label: "Fee Status", icon: "payments" },
];

export default async function DashboardPage() {
  const session = await getMemberSession();
  const [member, attendance, todaysWorkout, attendanceStatus, notifications, muscleProgress] = await Promise.all([
    getMemberById(session!.memberId),
    getRecentAttendance(session!.memberId, 60),
    findTodaysWorkout(session!.memberId),
    getAttendanceStatus(session!.memberId),
    listNotifications(session!.memberId),
    getMemberMuscleProgress(session!.memberId),
  ]);
  const streak = computeStreak(attendance);

  const daysUntilDue = member?.feeDueDate ? daysUntil(member.feeDueDate) : null;
  const greeting = greetingForHour(getIstHour());
  const greetingLine = GREETING_SUBLINES[greeting] ?? GREETING_SUBLINES["Good Morning"];

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-(--container-max) mx-auto">
      {/* DashboardHeader (dashboard/layout.tsx) already says "Welcome Back
          {fullName}" persistently above this on every route — repeating the
          name here would just be redundant, so this stays purely
          time-contextual instead. */}
      <div className="mb-6">
        <p className="font-label text-xs uppercase tracking-widest text-primary-container mb-0.5">{greeting}</p>
        <p className="font-body text-sm text-tertiary">{greetingLine}</p>
      </div>

      <NotificationsCard
        initialPrefs={{
          water: member?.notifyWater ?? false,
          mealLog: member?.notifyMealLog ?? false,
          streak: member?.notifyStreak ?? false,
        }}
      />

      <PersonalNoteArea />

      {todaysWorkout && (
        <TodayWorkoutBanner
          planName={todaysWorkout.planName}
          day={todaysWorkout.day}
          focus={todaysWorkout.focus}
          exercises={todaysWorkout.exercises}
        />
      )}

      <AttendanceCheckInButton initialStatus={attendanceStatus} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard value={streak} label="Day Streak" tone="accent" icon="local_fire_department" />
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

      <MuscleProgressTeaser progress={muscleProgress} />

      <h2 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-surface-container p-5 shadow-hard flex flex-col gap-3 hover:border-primary-container hover:-translate-y-0.5 border border-transparent active:scale-[0.98] transition-all"
          >
            <span className="inline-flex items-center justify-center w-10 h-10 bg-surface-container-high text-primary-container shrink-0">
              <span className="material-symbols-outlined text-xl leading-none">{link.icon}</span>
            </span>
            <span className="font-label text-xs uppercase tracking-wide text-on-surface">{link.label}</span>
          </Link>
        ))}
      </div>

      <NotificationBar initialNotifications={notifications} />
    </div>
  );
}
