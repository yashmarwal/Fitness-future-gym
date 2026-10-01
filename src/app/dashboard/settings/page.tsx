import Link from "next/link";
import { getMemberSession } from "@/backend/auth/session";
import { getMemberById } from "@/backend/services/member";
import { getWorkoutPromptEnabled } from "@/backend/services/workoutPrompt";
import { listNotifications } from "@/backend/services/memberNotifications";
import NotificationsCard from "@/frontend/components/dashboard/NotificationsCard";
import NotificationBar from "@/frontend/components/dashboard/NotificationBar";
import SignOutButton from "@/frontend/components/dashboard/SignOutButton";

// A real page — reached from the Settings tab in DashboardTabBar /
// DashboardDesktopNav — not the bottom-sheet overlay this used to be
// (SettingsPanel.tsx). That overlay toggled open/closed via plain React
// state with no history entry of its own, so the device back button had
// nothing to pop and fell through to whatever was behind the whole app
// instead of just closing the sheet. A normal route gives the back button
// a normal entry to land on, the same as every other dashboard page.
export default async function SettingsPage() {
  const session = await getMemberSession();
  const [member, workoutPromptEnabled, notifications] = await Promise.all([
    getMemberById(session!.memberId),
    getWorkoutPromptEnabled(session!.memberId),
    listNotifications(session!.memberId),
  ]);

  if (!member) return null;

  const prefs = {
    water: member.notifyWater,
    mealLog: member.notifyMealLog,
    streak: member.notifyStreak,
    workout: workoutPromptEnabled,
  };

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-md mx-auto flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide">Settings</h1>
        <p className="font-body text-sm text-tertiary mt-1">{member.fullName}</p>
      </div>

      <div className="flex flex-col gap-3">
        <SettingsLink
          href="/dashboard/card"
          icon="badge"
          label="Membership Card"
          detail={`${member.membershipNumber}${member.plan ? ` · ${member.plan}` : ""}`}
        />
        {/* Fee Status and Attendance History used to be their own Quick
            Actions tiles on the dashboard home page — moved in here instead,
            alongside Membership Card, since all three are "check on your
            account" lookups rather than things done often enough to deserve
            top-level real estate. */}
        <SettingsLink href="/dashboard/fees" icon="payments" label="Fee Status" />
        <SettingsLink href="/dashboard/attendance" icon="calendar_month" label="Attendance History" />
      </div>

      <div>
        <h3 className="font-label text-[11px] uppercase tracking-widest text-tertiary px-1 mb-3">Notifications</h3>
        <NotificationsCard initialPrefs={prefs} />
        <NotificationBar initialNotifications={notifications} />
      </div>

      <SignOutButton />
    </div>
  );
}

function SettingsLink({ href, icon, label, detail }: { href: string; icon: string; label: string; detail?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 bg-surface-container-low border border-surface-variant/40 hover:border-primary-container/50 rounded-2xl px-4 py-3.5 shadow-soft transition-colors active:scale-[0.99]"
    >
      <span className="w-11 h-11 rounded-xl flex items-center justify-center bg-surface-container-high text-primary-container shrink-0">
        <span className="material-symbols-outlined text-xl leading-none">{icon}</span>
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-label text-xs uppercase tracking-wide text-on-surface">{label}</p>
        {detail && <p className="font-body text-xs text-tertiary truncate">{detail}</p>}
      </div>
      <span className="material-symbols-outlined text-lg text-tertiary leading-none shrink-0">chevron_right</span>
    </Link>
  );
}
