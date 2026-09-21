import { getMemberSession } from "@/backend/auth/session";
import { getAttendanceStatus } from "@/backend/services/attendance";
import AttendanceLock from "@/frontend/components/dashboard/AttendanceLock";
import RestTimer from "@/frontend/components/dashboard/RestTimer";

export default async function TimerPage() {
  const session = await getMemberSession();
  // Server-side check first — see the workouts page.
  const { checkedIn } = await getAttendanceStatus(session!.memberId);
  if (!checkedIn) return <AttendanceLock />;

  return <RestTimer />;
}
