import Link from "next/link";
import { listTodaysAttendance } from "@/backend/services/admin/attendanceAdmin";
import { listMembers } from "@/backend/services/admin/members";
import AttendanceManager from "@/frontend/components/admin/AttendanceManager";
import MemberAttendanceCalendar from "@/frontend/components/admin/MemberAttendanceCalendar";

export default async function AdminAttendancePage() {
  const [records, members] = await Promise.all([listTodaysAttendance(), listMembers()]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide">Today&apos;s Attendance</h1>
          <Link
            href="/admin/attendance/monthly"
            className="flex items-center gap-1.5 font-label text-xs uppercase font-bold px-4 py-2.5 rounded-full bg-surface-container-low border-2 border-surface-variant hover:border-primary-container text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-base leading-none">calendar_month</span>
            Monthly Check-In Data
            <span className="material-symbols-outlined text-base leading-none">arrow_forward</span>
          </Link>
        </div>
        <AttendanceManager records={records} members={members} />
      </div>

      <div>
        <h2 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-2">Member Calendar</h2>
        <p className="font-body text-sm text-tertiary mb-6">
          Pick a member to see which days they checked in, month by month.
        </p>
        <MemberAttendanceCalendar members={members} />
      </div>
    </div>
  );
}
