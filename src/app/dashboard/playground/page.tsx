import { getMemberSession } from "@/backend/auth/session";
import { getAttendanceStatus } from "@/backend/services/attendance";
import { listMyRooms } from "@/backend/services/playground";
import AttendanceLock from "@/frontend/components/dashboard/AttendanceLock";
import PlaygroundHub from "@/frontend/components/dashboard/PlaygroundHub";

export default async function PlaygroundPage() {
  const session = await getMemberSession();
  const { checkedIn } = await getAttendanceStatus(session!.memberId);
  if (!checkedIn) return <AttendanceLock />;

  const rooms = await listMyRooms(session!.memberId);

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-6">Playground</h1>
      <PlaygroundHub initialRooms={rooms} myMemberId={session!.memberId} />
    </div>
  );
}
