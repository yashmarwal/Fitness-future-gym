import Link from "next/link";
import { getMemberSession } from "@/backend/auth/session";
import { getMemberById } from "@/backend/services/member";
import { getRecentAttendance } from "@/backend/services/attendance";
import { daysUntil } from "@/frontend/lib/date";

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
  { href: "/dashboard/nutrition", label: "Log Food", icon: "restaurant" },
  { href: "/dashboard/timer", label: "Rest Timer", icon: "timer" },
  { href: "/dashboard/fees", label: "Fee Status", icon: "payments" },
];

export default async function DashboardPage() {
  const session = await getMemberSession();
  const member = await getMemberById(session!.memberId);
  const attendance = await getRecentAttendance(session!.memberId, 60);
  const streak = computeStreak(attendance);

  const daysUntilDue = member?.feeDueDate ? daysUntil(member.feeDueDate) : null;

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-(--container-max) mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="bg-surface-container-low p-5 shadow-hard">
          <span className="font-display text-3xl text-primary-container">{streak}</span>
          <p className="font-label text-[10px] uppercase tracking-wider text-tertiary mt-1">Day Streak</p>
        </div>
        <div className="bg-surface-container-low p-5 shadow-hard">
          <span className="font-display text-3xl text-on-surface">{attendance.length}</span>
          <p className="font-label text-[10px] uppercase tracking-wider text-tertiary mt-1">Recent Check-Ins</p>
        </div>
        <div className="bg-surface-container-low p-5 shadow-hard">
          <span className="font-display text-2xl text-on-surface uppercase">{member?.plan ?? "—"}</span>
          <p className="font-label text-[10px] uppercase tracking-wider text-tertiary mt-1">Current Plan</p>
        </div>
        <div className="bg-surface-container-low p-5 shadow-hard">
          <span className={`font-display text-2xl uppercase ${daysUntilDue !== null && daysUntilDue <= 3 ? "text-error" : "text-on-surface"}`}>
            {daysUntilDue !== null ? `${daysUntilDue}d` : "—"}
          </span>
          <p className="font-label text-[10px] uppercase tracking-wider text-tertiary mt-1">Until Fee Due</p>
        </div>
      </div>

      <h2 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-surface-container p-5 shadow-hard flex flex-col gap-2 hover:border-primary-container border border-transparent transition-colors"
          >
            <span className="material-symbols-outlined text-primary-container text-2xl">{link.icon}</span>
            <span className="font-label text-xs uppercase tracking-wide text-on-surface">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
