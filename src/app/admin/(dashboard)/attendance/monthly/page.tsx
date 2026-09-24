import Link from "next/link";
import { getDailyAttendanceSummary } from "@/backend/services/admin/attendanceAdmin";
import GymAttendanceCalendar from "@/frontend/components/admin/GymAttendanceCalendar";

export default async function AdminMonthlyAttendancePage() {
  const dailySummary = await getDailyAttendanceSummary();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/attendance"
          className="flex items-center gap-1 font-label text-[10px] uppercase tracking-wider text-tertiary hover:text-on-surface transition-colors w-fit mb-3"
        >
          <span className="material-symbols-outlined text-sm leading-none">arrow_back</span>
          Today&apos;s Attendance
        </Link>
        <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-2">Monthly Check-In Data</h1>
        <p className="font-body text-sm text-tertiary mb-6">
          Every member combined — total check-ins per day, morning vs evening, month by month.
        </p>
      </div>

      <GymAttendanceCalendar summary={dailySummary} />
    </div>
  );
}
