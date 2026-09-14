import { listRecentAttendance } from "@/backend/services/admin/attendanceAdmin";
import { listMembers } from "@/backend/services/admin/members";
import AttendanceManager from "@/frontend/components/admin/AttendanceManager";
import MemberAttendanceCalendar from "@/frontend/components/admin/MemberAttendanceCalendar";

export default async function AdminAttendancePage() {
  const [records, members] = await Promise.all([listRecentAttendance(100), listMembers()]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-6">Attendance Log</h1>
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
