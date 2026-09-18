import "server-only";
import { getDb } from "@/backend/db/client";
import { getIstStartOfTodayIso, getIstDateString } from "@/frontend/lib/date";
import { sendEmailTemplate } from "@/backend/services/email";
import { countTodaysCheckIns } from "@/backend/services/admin/attendanceAdmin";
import { sumPaidThisMonth, countOverdueMembers } from "@/backend/services/admin/feesAdmin";
import { listMembers } from "@/backend/services/admin/members";
import { listUnpaidActiveMembers, listBlockedMembers } from "@/backend/services/admin/feeAbuse";
import {
  listOverdueFeeMembers,
  listUpcomingDueMembers,
  listRecentlyMissedMembers,
  listInactiveMembers,
  listTrialOverMembers,
  listUpcomingBirthdays,
} from "@/backend/services/admin/alerts";

export type DailySummary = {
  dateLabel: string;
  checkInsToday: number;
  revenueToday: number;
  revenueThisMonth: number;
  paymentsToday: { memberName: string; amount: number; method: string }[];
  newMembersToday: { fullName: string; membershipNumber: string }[];
  newTrialsToday: { fullName: string; shift: string }[];
  trialsConvertedToday: number;
  activeMembersCount: number;
  overdueFeesCount: number;
  alerts: {
    feeOverdue: number;
    dueWithin3Days: number;
    noCheckIn3Days: number;
    inactive4Months: number;
    trialNotConverted: number;
    birthdaysThisWeek: number;
    usingGymUnpaid: number;
    currentlyBlocked: number;
  };
};

async function sumPaidToday(): Promise<number> {
  const db = getDb();
  const { data, error } = await db
    .from("fee_payments")
    .select("amount")
    .eq("status", "paid")
    .gte("paid_at", getIstStartOfTodayIso());
  if (error) throw new Error(`Failed to sum today's payments: ${error.message}`);
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
}

async function listPaymentsToday(): Promise<{ memberName: string; amount: number; method: string }[]> {
  const db = getDb();
  const { data, error } = await db
    .from("fee_payments")
    .select("amount, method, members(full_name)")
    .eq("status", "paid")
    .gte("paid_at", getIstStartOfTodayIso())
    .order("paid_at", { ascending: false });
  if (error) throw new Error(`Failed to list today's payments: ${error.message}`);

  return (data ?? []).map((row) => {
    const member = row.members as unknown as { full_name: string } | null;
    return { memberName: member?.full_name ?? "Unknown", amount: Number(row.amount), method: row.method };
  });
}

async function listNewMembersToday(): Promise<{ fullName: string; membershipNumber: string }[]> {
  const db = getDb();
  const { data, error } = await db
    .from("members")
    .select("full_name, membership_number")
    .eq("joined_at", getIstDateString());
  if (error) throw new Error(`Failed to list today's new members: ${error.message}`);
  return (data ?? []).map((row) => ({ fullName: row.full_name, membershipNumber: row.membership_number }));
}

async function listNewTrialsToday(): Promise<{ fullName: string; shift: string }[]> {
  const db = getDb();
  const { data, error } = await db
    .from("trial_registrations")
    .select("full_name, shift")
    .gte("created_at", getIstStartOfTodayIso());
  if (error) throw new Error(`Failed to list today's new trials: ${error.message}`);
  return (data ?? []).map((row) => ({ fullName: row.full_name, shift: row.shift }));
}

// trial_registrations has no "converted_at" column, only created_at (the
// original registration time) — the audit log entry convertTrialToMember
// writes on every successful conversion (admin/trials.ts) is the only place
// that actually timestamps the conversion itself, so that's the real
// source here, not the trial row.
async function countTrialsConvertedToday(): Promise<number> {
  const db = getDb();
  const { count, error } = await db
    .from("audit_log")
    .select("id", { count: "exact", head: true })
    .eq("action", "convert_trial")
    .gte("created_at", getIstStartOfTodayIso());
  if (error) throw new Error(`Failed to count today's trial conversions: ${error.message}`);
  return count ?? 0;
}

// Gathers the exact same stat set the Admin Overview page shows (current
// status: check-ins, revenue, overdue, active members, and every "Needs
// Attention" alert count) plus genuine today-only events the overview
// doesn't track at all (payments/new members/new trials/conversions today)
// — the full picture a 11pm daily digest actually needs, not just a copy
// of what's already one tap away in the app.
export async function getDailySummary(): Promise<DailySummary> {
  const [
    checkInsToday,
    revenueToday,
    revenueThisMonth,
    overdueFeesCount,
    members,
    paymentsToday,
    newMembersToday,
    newTrialsToday,
    trialsConvertedToday,
    overdue,
    upcomingDue,
    recentlyMissed,
    inactive,
    trialOver,
    birthdays,
    unpaidActive,
    blocked,
  ] = await Promise.all([
    countTodaysCheckIns(),
    sumPaidToday(),
    sumPaidThisMonth(),
    countOverdueMembers(),
    listMembers(),
    listPaymentsToday(),
    listNewMembersToday(),
    listNewTrialsToday(),
    countTrialsConvertedToday(),
    listOverdueFeeMembers(),
    listUpcomingDueMembers(),
    listRecentlyMissedMembers(),
    listInactiveMembers(),
    listTrialOverMembers(),
    listUpcomingBirthdays(),
    listUnpaidActiveMembers(),
    listBlockedMembers(),
  ]);

  return {
    dateLabel: new Date().toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    checkInsToday,
    revenueToday,
    revenueThisMonth,
    paymentsToday,
    newMembersToday,
    newTrialsToday,
    trialsConvertedToday,
    activeMembersCount: members.filter((m) => m.isActive).length,
    overdueFeesCount,
    alerts: {
      feeOverdue: overdue.length,
      dueWithin3Days: upcomingDue.length,
      noCheckIn3Days: recentlyMissed.length,
      inactive4Months: inactive.length,
      trialNotConverted: trialOver.length,
      birthdaysThisWeek: birthdays.length,
      usingGymUnpaid: unpaidActive.length,
      currentlyBlocked: blocked.length,
    },
  };
}

// Fixed recipients, not member/admin rows — the gym's two owners, who
// don't otherwise have accounts in this system. Sent as two separate
// emails (not one email with two "to" addresses) so a bad address for one
// owner can't also suppress the other's copy, and so each gets its own
// email_messages log row for that same reason.
const OWNER_EMAILS = ["hritikronjhwal@outlook.com", "vaibhavronjhwal1@gmail.com"];

export async function sendDailySummaryEmail(): Promise<{ sent: number; failed: number }> {
  const summary = await getDailySummary();
  const json = JSON.stringify(summary);

  const results = await Promise.allSettled(
    OWNER_EMAILS.map((to) => sendEmailTemplate({ to, template: "daily_summary", bodyParams: [json] }))
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - sent;
  return { sent, failed };
}
