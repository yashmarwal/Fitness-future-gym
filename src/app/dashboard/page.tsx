import Link from "next/link";
import { getMemberSession } from "@/backend/auth/session";
import { getMemberById } from "@/backend/services/member";
import { getRecentAttendance } from "@/backend/services/attendance";
import { findTodaysWorkout } from "@/backend/services/workoutPlans";
import { daysUntil } from "@/frontend/lib/date";
import { StatCard } from "@/frontend/components/dashboard/Primitives";
import PersonalNoteArea from "@/frontend/components/dashboard/PersonalNoteArea";
import AttendanceCheckInButton from "@/frontend/components/dashboard/AttendanceCheckInButton";
import NotificationBar from "@/frontend/components/dashboard/NotificationBar";
import TodayWorkoutBanner from "@/frontend/components/dashboard/TodayWorkoutBanner";

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
  { href: "/dashboard/plan", label: "Plan Workouts", icon: "event_note" },
  { href: "/dashboard/plan?tab=templates", label: "Workout Templates", icon: "auto_awesome" },
  { href: "/dashboard/nutrition", label: "Log Food", icon: "restaurant" },
  { href: "/dashboard/timer", label: "Rest Timer", icon: "timer" },
  { href: "/dashboard/streak", label: "Streak Tracker", icon: "local_fire_department" },
  { href: "/dashboard/fees", label: "Fee Status", icon: "payments" },
];

export default async function DashboardPage() {
  const session = await getMemberSession();
  const [member, attendance, todaysWorkout] = await Promise.all([
    getMemberById(session!.memberId),
    getRecentAttendance(session!.memberId, 60),
    findTodaysWorkout(session!.memberId),
  ]);
  const streak = computeStreak(attendance);

  const daysUntilDue = member?.feeDueDate ? daysUntil(member.feeDueDate) : null;

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-(--container-max) mx-auto">
      <PersonalNoteArea />

      {todaysWorkout && (
        <TodayWorkoutBanner
          planName={todaysWorkout.planName}
          day={todaysWorkout.day}
          focus={todaysWorkout.focus}
          exercises={todaysWorkout.exercises}
        />
      )}

      <AttendanceCheckInButton />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard value={streak} label="Day Streak" tone="accent" />
        <StatCard value={attendance.length} label="Recent Check-Ins" />
        <StatCard value={member?.plan ?? "—"} label="Current Plan" size="md" uppercase />
        <StatCard
          value={daysUntilDue !== null ? `${daysUntilDue}d` : "—"}
          label="Until Fee Due"
          size="md"
          uppercase
          tone={daysUntilDue !== null && daysUntilDue <= 3 ? "alert" : "default"}
        />
      </div>

      <h2 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-surface-container p-5 shadow-hard flex flex-col gap-3 hover:border-primary-container border border-transparent active:scale-[0.98] transition-all"
          >
            <span className="inline-flex items-center justify-center w-10 h-10 bg-surface-container-high text-primary-container shrink-0">
              <span className="material-symbols-outlined text-xl leading-none">{link.icon}</span>
            </span>
            <span className="font-label text-xs uppercase tracking-wide text-on-surface">{link.label}</span>
          </Link>
        ))}
      </div>

      <NotificationBar />
    </div>
  );
}
