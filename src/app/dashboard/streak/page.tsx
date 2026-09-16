import { getMemberSession } from "@/backend/auth/session";
import { getMemberById } from "@/backend/services/member";
import StreakTracker from "@/frontend/components/dashboard/StreakTracker";

export default async function StreakPage() {
  const session = await getMemberSession();
  const member = await getMemberById(session!.memberId);

  return (
    <StreakTracker currentStreakDays={member?.currentStreakDays ?? 0} longestStreakDays={member?.longestStreakDays ?? 0} />
  );
}
