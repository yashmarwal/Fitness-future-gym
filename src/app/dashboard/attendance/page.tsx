import { getMemberSession } from "@/server/auth/session";
import { getRecentAttendance } from "@/server/services/attendance";

export default async function AttendanceHistoryPage() {
  const session = await getMemberSession();
  const attendance = await getRecentAttendance(session!.memberId, 60);

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-6">
        Attendance History
      </h1>

      {attendance.length === 0 ? (
        <p className="font-body text-sm text-tertiary">No check-ins yet. Scan the QR code at the front desk.</p>
      ) : (
        <div className="flex flex-col divide-y divide-surface-variant/40 bg-surface-container-low shadow-hard">
          {attendance.map((iso) => {
            const date = new Date(iso);
            return (
              <div key={iso} className="flex justify-between px-5 py-3">
                <span className="font-label text-xs uppercase tracking-wide text-on-surface">
                  {date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                </span>
                <span className="font-body text-sm text-tertiary">
                  {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
