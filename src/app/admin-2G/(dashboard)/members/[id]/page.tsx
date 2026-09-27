import { notFound } from "next/navigation";
import { getMember } from "@/backend/services/admin/members";
import { listFeePaymentsForMember } from "@/backend/services/admin/feesAdmin";
import { getMemberAttendanceTimestamps } from "@/backend/services/admin/attendanceAdmin";
import { getTrialByPhone } from "@/backend/services/admin/trials";
import MemberProfileView from "@/frontend/components/admin/MemberProfileView";

// The "everything about this one person" view — previously scattered
// across Members (their row), Fees (their payment rows mixed into the
// global feed), Attendance (the separate per-member calendar tool), and
// nowhere at all for their trial history. One page, linked from every
// member row in Members.
export default async function AdminMemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const member = await getMember(id);
  if (!member) notFound();

  const [payments, attendanceTimestamps, trial] = await Promise.all([
    listFeePaymentsForMember(id),
    getMemberAttendanceTimestamps(id),
    member.phone ? getTrialByPhone(member.phone) : Promise.resolve(null),
  ]);

  return <MemberProfileView member={member} payments={payments} attendanceTimestamps={attendanceTimestamps} trial={trial} />;
}
