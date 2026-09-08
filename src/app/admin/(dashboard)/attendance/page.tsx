import { listRecentAttendance } from "@/server/services/admin/attendanceAdmin";
import { listMembers } from "@/server/services/admin/members";
import AttendanceManager from "@/components/admin/AttendanceManager";

export default async function AdminAttendancePage() {
  const [records, members] = await Promise.all([listRecentAttendance(100), listMembers()]);

  return (
    <div>
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-6">Attendance Log</h1>
      <AttendanceManager records={records} members={members} />
    </div>
  );
}
