import { getMemberSession } from "@/backend/auth/session";
import { getRecentAttendance } from "@/backend/services/attendance";
import { DashboardEmptyState } from "@/frontend/components/dashboard/Primitives";

export default async function AttendanceHistoryPage() {
  const session = await getMemberSession();
  const attendance = await getRecentAttendance(session!.memberId, 60);

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-6">
        Attendance History
      </h1>

      {attendance.length === 0 ? (
        <DashboardEmptyState icon="calendar_month">
          No check-ins yet. Scan the QR code at the front desk.
        </DashboardEmptyState>
      ) : (
        <div className="flex flex-col divide-y divide-surface-variant/40 bg-surface-container-low shadow-hard">
          {attendance.map((iso) => {
            const date = new Date(iso);
            return (
              <div key={iso} className="flex items-center gap-3 px-5 py-3">
                <span className="material-symbols-outlined text-lg text-primary-container leading-none shrink-0">
                  check_circle
                </span>
                <span className="font-label text-xs uppercase tracking-wide text-on-surface flex-1">
                  {date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short" })}
                </span>
                <span className="font-body text-sm text-tertiary">
                  {date.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
