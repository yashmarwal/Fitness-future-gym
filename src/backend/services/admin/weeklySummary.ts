import "server-only";
import { getDb } from "@/backend/db/client";
import { getIstDateString } from "@/frontend/lib/date";
import { sendEmailTemplate } from "@/backend/services/email";
import { getDailySummary, OWNER_EMAILS, type DailySummary } from "@/backend/services/admin/dailySummary";
import { countCheckInsOn, listAttendanceSince } from "@/backend/services/admin/attendanceStats";
import { listMembers } from "@/backend/services/admin/members";
import { writeWeeklyNarrative, type OwnerNarrative } from "@/backend/services/admin/ownerInsights";

// The owners' Sunday-night report: this week (the last 7 IST days including
// today) against the 7 before it. Everything numeric is computed here in code;
// the AI section on top only comments on these figures (see ownerInsights.ts),
// and the "highlights" list below is plain rules, so the email is useful even
// when the AI is off.

const DAY_MS = 86_400_000;
const AT_RISK_MIN_LAST_WEEK = 3; // "regular" = at least this many visits the week before…
const AT_RISK_MAX_THIS_WEEK = 1; // …and at most this many this week
const AT_RISK_LIMIT = 8;

export type WeeklySummary = {
  rangeLabel: string;
  checkIns: {
    thisWeek: number;
    lastWeek: number;
    pctChange: number | null;
    perDay: { label: string; count: number }[];
    busiestDay: { label: string; count: number } | null;
    quietestDay: { label: string; count: number } | null;
  };
  revenue: {
    thisWeek: number;
    lastWeek: number;
    pctChange: number | null;
    monthToDate: number;
    overdueCount: number;
    overdueAmount: number;
  };
  members: { active: number; joinedThisWeek: number; joinedLastWeek: number; trialSignups: number; trialsConverted: number };
  atRisk: { name: string; membershipNumber: string; visitsThisWeek: number; visitsLastWeek: number }[];
  overdueExamples: string[];
  alerts: DailySummary["alerts"];
  highlights: string[];
  narrative: OwnerNarrative | null;
};

function istDatesEndingToday(from: number, to: number): string[] {
  // `from`/`to` are "days back from today" (6 → 0 gives the last 7 days, oldest first).
  const now = Date.now();
  return Array.from({ length: from - to + 1 }, (_, i) => getIstDateString(new Date(now - (from - i) * DAY_MS)));
}

function weekdayShort(istDate: string): string {
  return new Date(`${istDate}T12:00:00+05:30`).toLocaleDateString("en-US", { weekday: "short", timeZone: "Asia/Kolkata" });
}

function shortDate(istDate: string, withYear = false): string {
  return new Date(`${istDate}T12:00:00+05:30`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "Asia/Kolkata",
  });
}

function pctChange(current: number, base: number): number | null {
  return base > 0 ? Math.round(((current - base) / base) * 100) : null;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

async function rows<T>(query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>, what: string): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw new Error(`Failed to load ${what}: ${error.message}`);
  return data ?? [];
}

// Plain-rule bullets, always included whether or not the AI section is.
function buildHighlights(w: Omit<WeeklySummary, "highlights" | "narrative">): string[] {
  const out: string[] = [];
  const { checkIns, revenue, members } = w;

  out.push(
    checkIns.pctChange == null
      ? `${plural(checkIns.thisWeek, "check-in")} this week.`
      : `${plural(checkIns.thisWeek, "check-in")} this week — ${checkIns.pctChange >= 0 ? "up" : "down"} ${Math.abs(checkIns.pctChange)}% on last week (${checkIns.lastWeek}).`
  );
  if (checkIns.busiestDay && checkIns.busiestDay.count > 0) {
    out.push(`Busiest day was ${checkIns.busiestDay.label} with ${checkIns.busiestDay.count}.`);
  }
  out.push(
    revenue.pctChange == null
      ? `${inr(revenue.thisWeek)} collected this week.`
      : `${inr(revenue.thisWeek)} collected this week — ${revenue.pctChange >= 0 ? "up" : "down"} ${Math.abs(revenue.pctChange)}% on last week (${inr(revenue.lastWeek)}).`
  );
  out.push(
    `${plural(members.joinedThisWeek, "new member")} joined; ${plural(members.trialSignups, "trial signup")}, ${members.trialsConverted} converted.`
  );
  if (w.atRisk.length > 0) {
    out.push(`${plural(w.atRisk.length, "regular member")} came far less than usual this week — listed below.`);
  }
  if (revenue.overdueCount > 0) {
    out.push(`${plural(revenue.overdueCount, "overdue fee")} outstanding, worth ${inr(revenue.overdueAmount)} in total.`);
  }
  return out;
}

export async function getWeeklySummary(): Promise<WeeklySummary> {
  const thisWeek = istDatesEndingToday(6, 0);
  const lastWeek = istDatesEndingToday(13, 7);
  const today = thisWeek[thisWeek.length - 1];
  const sinceIso = new Date(`${lastWeek[0]}T00:00:00+05:30`).toISOString();
  const db = getDb();

  const [daily, dayCounts, payments, joined, trials, conversions, attendance, members] = await Promise.all([
    getDailySummary(),
    Promise.all([...lastWeek, ...thisWeek].map(countCheckInsOn)),
    rows(db.from("fee_payments").select("amount, paid_at").eq("status", "paid").gte("paid_at", sinceIso), "payments"),
    rows(db.from("members").select("joined_at").gte("joined_at", lastWeek[0]), "new members"),
    rows(db.from("trial_registrations").select("created_at").gte("created_at", sinceIso), "trial signups"),
    rows(db.from("audit_log").select("created_at").eq("action", "convert_trial").gte("created_at", sinceIso), "trial conversions"),
    listAttendanceSince(sinceIso),
    listMembers(),
  ]);

  const thisSet = new Set(thisWeek);
  const lastSet = new Set(lastWeek);
  const inThis = (istDate: string) => thisSet.has(istDate);
  const inLast = (istDate: string) => lastSet.has(istDate);
  const dateOf = (iso: string) => getIstDateString(new Date(iso));

  // Check-ins
  const perDay = thisWeek.map((date, i) => ({ label: weekdayShort(date), count: dayCounts[7 + i] }));
  const checkInsThis = perDay.reduce((sum, d) => sum + d.count, 0);
  const checkInsLast = dayCounts.slice(0, 7).reduce((sum, c) => sum + c, 0);
  const byCount = [...perDay].sort((a, b) => b.count - a.count);

  // Money
  let revThis = 0;
  let revLast = 0;
  for (const p of payments) {
    if (!p.paid_at) continue;
    const date = dateOf(p.paid_at as string);
    if (inThis(date)) revThis += Number(p.amount);
    else if (inLast(date)) revLast += Number(p.amount);
  }
  const overdue = members.filter((m) => m.isActive && m.feeDueDate && m.feeDueDate.slice(0, 10) < today);

  // Members
  const joinedThis = joined.filter((j) => inThis(String(j.joined_at).slice(0, 10))).length;
  const joinedLast = joined.filter((j) => inLast(String(j.joined_at).slice(0, 10))).length;
  const trialsThis = trials.filter((t) => inThis(dateOf(t.created_at as string))).length;
  const convertedThis = conversions.filter((c) => inThis(dateOf(c.created_at as string))).length;

  // Regulars whose attendance fell off a cliff: worth a phone call.
  const visits = new Map<string, { thisWeek: number; lastWeek: number }>();
  for (const a of attendance) {
    const date = dateOf(a.checkedInAt);
    const entry = visits.get(a.memberId) ?? { thisWeek: 0, lastWeek: 0 };
    if (inThis(date)) entry.thisWeek++;
    else if (inLast(date)) entry.lastWeek++;
    visits.set(a.memberId, entry);
  }
  const memberById = new Map(members.map((m) => [m.id, m]));
  const atRisk = [...visits.entries()]
    .filter(([id, v]) => memberById.get(id)?.isActive && v.lastWeek >= AT_RISK_MIN_LAST_WEEK && v.thisWeek <= AT_RISK_MAX_THIS_WEEK)
    .sort((a, b) => b[1].lastWeek - b[1].thisWeek - (a[1].lastWeek - a[1].thisWeek))
    .slice(0, AT_RISK_LIMIT)
    .map(([id, v]) => ({
      name: memberById.get(id)!.fullName,
      membershipNumber: memberById.get(id)!.membershipNumber,
      visitsThisWeek: v.thisWeek,
      visitsLastWeek: v.lastWeek,
    }));

  const base: Omit<WeeklySummary, "highlights" | "narrative"> = {
    rangeLabel: `${shortDate(thisWeek[0])} – ${shortDate(today, true)}`,
    checkIns: {
      thisWeek: checkInsThis,
      lastWeek: checkInsLast,
      pctChange: pctChange(checkInsThis, checkInsLast),
      perDay,
      busiestDay: byCount[0] ?? null,
      quietestDay: byCount[byCount.length - 1] ?? null,
    },
    revenue: {
      thisWeek: revThis,
      lastWeek: revLast,
      pctChange: pctChange(revThis, revLast),
      monthToDate: daily.revenueThisMonth,
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((sum, m) => sum + (m.feeAmount ?? 0), 0),
    },
    members: {
      active: daily.activeMembersCount,
      joinedThisWeek: joinedThis,
      joinedLastWeek: joinedLast,
      trialSignups: trialsThis,
      trialsConverted: convertedThis,
    },
    atRisk,
    overdueExamples: daily.names.overdue,
    alerts: daily.alerts,
  };

  return { ...base, highlights: buildHighlights(base), narrative: null };
}

// Every figure the AI commentary may use, worked out here so the model only
// has to put it into words (and anything else it writes gets rejected).
function weeklyFacts(w: WeeklySummary) {
  return {
    windowDays: 7,
    weekRange: w.rangeLabel,
    checkInsThisWeek: w.checkIns.thisWeek,
    checkInsLastWeek: w.checkIns.lastWeek,
    checkInsChangePercent: w.checkIns.pctChange,
    checkInsByDay: w.checkIns.perDay,
    busiestDay: w.checkIns.busiestDay,
    quietestDay: w.checkIns.quietestDay,
    revenueThisWeek: w.revenue.thisWeek,
    revenueLastWeek: w.revenue.lastWeek,
    revenueChangePercent: w.revenue.pctChange,
    revenueThisMonthSoFar: w.revenue.monthToDate,
    membersWithOverdueFees: w.revenue.overdueCount,
    totalOverdueAmount: w.revenue.overdueAmount,
    overdueFeeExamples: w.overdueExamples,
    activeMembers: w.members.active,
    newMembersThisWeek: w.members.joinedThisWeek,
    newMembersLastWeek: w.members.joinedLastWeek,
    trialSignupsThisWeek: w.members.trialSignups,
    trialsConvertedThisWeek: w.members.trialsConverted,
    regularsWhoDroppedOff: w.atRisk.map((m) => ({
      name: m.name,
      visitsThisWeek: m.visitsThisWeek,
      visitsLastWeek: m.visitsLastWeek,
    })),
    feesDueWithin3Days: w.alerts.dueWithin3Days,
    membersNotSeenFor3PlusDays: w.alerts.noCheckIn3Days,
    trialsNotConverted: w.alerts.trialNotConverted,
    usingGymWithoutPaying: w.alerts.usingGymUnpaid,
    currentlyBlocked: w.alerts.currentlyBlocked,
  };
}

export async function sendWeeklySummaryEmail(): Promise<{ sent: number; failed: number }> {
  const summary = await getWeeklySummary();
  summary.narrative = await writeWeeklyNarrative(weeklyFacts(summary));
  const json = JSON.stringify(summary);

  // Same reasoning as the daily digest: separate emails per owner.
  const results = await Promise.allSettled(
    OWNER_EMAILS.map((to) => sendEmailTemplate({ to, template: "weekly_summary", bodyParams: [json] }))
  );
  const sent = results.filter((r) => r.status === "fulfilled").length;
  return { sent, failed: results.length - sent };
}
