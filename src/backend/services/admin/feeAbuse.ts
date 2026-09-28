import "server-only";
import { after } from "next/server";
import { getDb } from "@/backend/db/client";
import { isMissingColumnError } from "@/backend/db/errors";
import type { AdminMember } from "@/types/admin";
import { sendWhatsAppTemplate } from "@/backend/services/whatsapp";
import { sendEmailTemplate } from "@/backend/services/email";
import { createNotification } from "@/backend/services/memberNotifications";
import { sendPushToMember } from "@/backend/services/pushNotifications";
import { mapWithConcurrency } from "@/backend/lib/concurrency";
import { getIstDateString } from "@/frontend/lib/date";
import { hasMissedAtLeastNEligibleDays } from "@/backend/services/gymCalendar";

// How many members get messaged in parallel from the loops below
// (autoBlockOverdueMembers) — high enough to clear a few hundred overdue
// members well inside a serverless function's time limit, low enough not to
// hammer the WhatsApp Cloud API / Resend with a burst of simultaneous
// requests. See backend/lib/concurrency.ts.
const NOTIFY_CONCURRENCY = 8;

function mapRow(row: Record<string, unknown>): AdminMember {
  return {
    id: row.id as string,
    membershipNumber: row.membership_number as string,
    fullName: row.full_name as string,
    phone: row.phone as string | null,
    email: row.email as string | null,
    dateOfBirth: row.date_of_birth as string | null,
    // Not selected here (see SELECT_COLUMNS) — this fee-abuse list never
    // displays it.
    address: null,
    notes: null,
    plan: row.plan as string | null,
    feeAmount: row.fee_amount as number | null,
    feeDueDate: row.fee_due_date as string | null,
    joinedAt: row.joined_at as string,
    isActive: row.is_active as boolean,
    isBlocked: row.is_frozen as boolean,
    blockedReason: (row.frozen_reason as string | null) ?? null,
  };
}

const SELECT_COLUMNS =
  "id, membership_number, full_name, phone, email, date_of_birth, plan, fee_amount, fee_due_date, joined_at, is_active, is_frozen, last_checked_in_at";

// "Actively using the floor without paying for it": checking in recently
// (last 7 days — genuinely still coming in, not just a stale account) but
// never billed at all, or genuinely overdue — and not already blocked (a
// blocked member can't check in anymore, so they'd drop out of "actively
// using" on their own once the block takes effect). This is the
// admin-visibility list — distinct from the 5-day auto-block below, which
// only fires once a fee was actually assigned and is now overdue; a member
// who was NEVER billed has no due date for the auto-block to measure
// against at all, so this list is the only way admin ever finds out about
// them.
//
// Deliberately keyed ONLY on fee_due_date, not plan/fee_amount — those two
// used to also trigger this flag, which was a real bug: recordManualPayment
// only ever touched fee_due_date, so a member who paid but whose
// plan/fee_amount happened to never get typed in via Admin -> Members
// stayed stuck in this list forever, genuinely paid up or not. A real due
// date in the future IS "paid up," full stop, regardless of whether those
// two text fields happen to be filled in — that's a separate, unrelated
// data-completeness concern, not a payment-status one.
const RECENTLY_ACTIVE_DAYS = 7;

export type UnpaidActiveMember = AdminMember & { lastCheckedInAt: string | null; flagReason: string };

// The total count of never-billed members — everyone with no fee_due_date
// on file, regardless of activity or block status. Distinct from
// listUnpaidActiveMembers below, which only surfaces the ones actively
// using the floor recently; this answers the broader "how many members
// have we never actually billed" question, which that list can't (it's
// scoped to active + recently-checked-in + not-already-blocked). Currently
// only consumed by the admin AI assistant's count_never_billed_members tool.
export async function countNeverBilledMembers(): Promise<number> {
  const db = getDb();
  const { count, error } = await db.from("members").select("id", { count: "exact", head: true }).is("fee_due_date", null);
  if (error) throw new Error(`Failed to count never-billed members: ${error.message}`);
  return count ?? 0;
}

function computeFlagReason(row: Record<string, unknown>): string {
  const dueDate = row.fee_due_date as string | null;
  if (!dueDate) return "Never billed — no fee due date on file";
  if (dueDate < new Date().toISOString().slice(0, 10)) return `Fee overdue since ${dueDate}`;
  return "Fee status needs review";
}

export async function listUnpaidActiveMembers(): Promise<UnpaidActiveMember[]> {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RECENTLY_ACTIVE_DAYS);
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await db
    .from("members")
    .select(SELECT_COLUMNS)
    .eq("is_active", true)
    .eq("is_frozen", false)
    .gte("last_checked_in_at", cutoff.toISOString())
    .or(`fee_due_date.is.null,fee_due_date.lt.${today}`);

  if (error) throw new Error(`Failed to load unpaid active members: ${error.message}`);
  return (data ?? []).map((row) => ({
    ...mapRow(row),
    lastCheckedInAt: row.last_checked_in_at as string | null,
    flagReason: computeFlagReason(row),
  }));
}

// Tries to include frozen_reason (needs the migration in schema.sql) so
// admin can see *why* someone was blocked, not just that they are — falls
// back to the base columns if that migration hasn't landed yet, same
// degrade-gracefully approach as block/unblock below.
export async function listBlockedMembers(): Promise<AdminMember[]> {
  const db = getDb();
  const { data, error } = await db
    .from("members")
    .select(`${SELECT_COLUMNS}, frozen_reason`)
    .eq("is_frozen", true);

  if (!error) return (data ?? []).map(mapRow);
  if (!isMissingColumnError(error)) throw new Error(`Failed to load blocked members: ${error.message}`);

  const { data: fallbackData, error: fallbackError } = await db
    .from("members")
    .select(SELECT_COLUMNS)
    .eq("is_frozen", true);
  if (fallbackError) throw new Error(`Failed to load blocked members: ${fallbackError.message}`);
  return (fallbackData ?? []).map(mapRow);
}

// Tells the member their access has been put on hold, on every channel —
// fires for BOTH ways a member ends up blocked (admin doing it directly
// from Admin -> Members, or autoBlockOverdueMembers below catching an
// overdue fee automatically) since it lives inside blockMember itself
// instead of being left for each call site to remember. That used to be
// exactly the gap: admin's manual block sent nothing at all, so a manually
// blocked member had no idea why their access stopped, while an
// auto-blocked one was told. Deferred via after() — same reasoning as
// notifyUnblocked below, this is best-effort and shouldn't hold up the
// block/unblock action's own response.
async function notifyBlocked(
  id: string,
  member: { full_name: string; phone: string | null; email: string | null } | null,
  reason: string
): Promise<void> {
  if (!member) return;
  if (member.phone) {
    await sendWhatsAppTemplate({
      phone: member.phone,
      template: "account_blocked",
      bodyParams: [member.full_name],
      memberId: id,
    }).catch(() => {});
  }
  if (member.email) {
    await sendEmailTemplate({
      to: member.email,
      template: "account_blocked",
      bodyParams: [member.full_name],
      memberId: id,
    }).catch(() => {});
  }
  const body = `Your check-in and dashboard access is on hold — ${reason}. Please contact the front desk to reactivate.`;
  await createNotification({
    memberId: id,
    type: "account_blocked",
    title: "Membership Blocked",
    body,
  }).catch(() => {});
  await sendPushToMember(id, { title: "Membership Blocked", body, url: "/dashboard/fees" }).catch(() => {});
}

// Writes frozen_reason/frozen_at too when those columns exist (see the
// migration in schema.sql), but falls back to just the core is_frozen flag
// if that migration hasn't been run yet — the actual block/unblock
// mechanism (denying check-in and dashboard access) works either way, it's
// only the audit trail (why/when) that needs the migration.
export async function blockMember(id: string, reason: string): Promise<void> {
  const db = getDb();

  // Was this member already blocked? The write below always happens
  // regardless — admin might be correcting the reason text on someone
  // already blocked, and that edit should stick — but only a genuine
  // not-blocked -> blocked transition should tell the member their access
  // was just cut off. Without this, re-saving an existing block (or
  // autoBlockOverdueMembers somehow re-processing the same member) would
  // re-send "Membership Blocked" to someone who already knows.
  const { data: before } = await db.from("members").select("is_frozen").eq("id", id).maybeSingle();
  const wasAlreadyBlocked = before?.is_frozen === true;

  const { data, error } = await db
    .from("members")
    .update({ is_frozen: true, frozen_reason: reason, frozen_at: new Date().toISOString() })
    .eq("id", id)
    .select("full_name, phone, email")
    .maybeSingle();

  if (error) {
    if (!isMissingColumnError(error)) throw new Error(`Failed to block member: ${error.message}`);
    const { data: fallbackData, error: fallbackError } = await db
      .from("members")
      .update({ is_frozen: true })
      .eq("id", id)
      .select("full_name, phone, email")
      .maybeSingle();
    if (fallbackError) throw new Error(`Failed to block member: ${fallbackError.message}`);
    if (!wasAlreadyBlocked) after(() => notifyBlocked(id, fallbackData, reason));
    return;
  }
  if (!wasAlreadyBlocked) after(() => notifyBlocked(id, data, reason));
}

// Tells the member their access is back, on every channel — the same
// courtesy blocking already gets, just in reverse. Lives in this one shared
// function rather than at each call site so both ways a member actually
// gets unblocked (an admin doing it directly, or recordManualPayment lifting
// it automatically once a fee is paid) send it for free, with nothing to
// keep in sync between them. Deferred via after() at both call sites below
// (unblockMember is always invoked from a Route Handler — the admin unblock
// route, or recordManualPayment which is itself called from one) so
// unblocking never waits on 4 sequential network calls before responding.
async function notifyUnblocked(id: string, member: { full_name: string; phone: string | null; email: string | null } | null): Promise<void> {
  if (!member) return;
  if (member.phone) {
    await sendWhatsAppTemplate({
      phone: member.phone,
      template: "account_unblocked",
      bodyParams: [member.full_name],
      memberId: id,
    }).catch(() => {});
  }
  if (member.email) {
    await sendEmailTemplate({
      to: member.email,
      template: "account_unblocked",
      bodyParams: [member.full_name],
      memberId: id,
    }).catch(() => {});
  }
  await createNotification({
    memberId: id,
    type: "account_unblocked",
    title: "Membership Reactivated",
    body: "Your check-in and dashboard access have been restored. See you on the floor!",
  }).catch(() => {});
  await sendPushToMember(id, {
    title: "Membership Reactivated",
    body: "Your check-in and dashboard access have been restored. See you on the floor!",
    url: "/dashboard",
  }).catch(() => {});
}

export async function unblockMember(id: string): Promise<void> {
  const db = getDb();

  // recordManualPayment calls this UNCONDITIONALLY on every single payment
  // (see feesAdmin.ts) so a fee-abuse block gets lifted automatically the
  // moment a member pays, without every caller needing to check first — but
  // that means the overwhelming majority of calls are for a member who was
  // never blocked at all. Checking is_frozen before touching anything is
  // what makes this a REAL no-op for them, instead of what it used to be: a
  // "Your membership has been reactivated!" WhatsApp/email/push firing on
  // every routine renewal payment, for members who were never deactivated.
  const { data: before, error: beforeError } = await db.from("members").select("is_frozen").eq("id", id).maybeSingle();
  if (beforeError) throw new Error(`Failed to load member: ${beforeError.message}`);
  if (!before?.is_frozen) return;

  // unblocked_at starts the inactivity rule's grace window below
  // (autoBlockInactiveMembers) — without it, a member unblocked in the
  // evening could be caught by the very next 8:30 AM cron for "no check-in"
  // before ever having a chance to come in, since that rule otherwise
  // measures purely from their last real check-in, which happened BEFORE
  // they were locked out. The fee-overdue and never-billed rules don't need
  // this: a payment either brings fee_due_date into the future (they're
  // simply not in those queries anymore) or doesn't (and the owner wants
  // them to stay blockable until it does) — see recordManualPayment.
  // Written in tiers so a not-yet-run migration degrades to the old
  // behavior instead of failing the unblock.
  const payloads: Record<string, unknown>[] = [
    { is_frozen: false, frozen_reason: null, frozen_at: null, unblocked_at: new Date().toISOString() },
    { is_frozen: false, frozen_reason: null, frozen_at: null },
    { is_frozen: false },
  ];
  for (let i = 0; i < payloads.length; i++) {
    const { data, error } = await db
      .from("members")
      .update(payloads[i])
      .eq("id", id)
      .select("full_name, phone, email")
      .maybeSingle();
    if (!error) {
      after(() => notifyUnblocked(id, data));
      return;
    }
    if (!isMissingColumnError(error) || i === payloads.length - 1) {
      throw new Error(`Failed to unblock member: ${error.message}`);
    }
  }
}

// The reason text of an active block, for the member-facing blocked screen.
// Null when not blocked or the frozen_reason migration hasn't run.
export async function getBlockReason(id: string): Promise<string | null> {
  const { data, error } = await getDb().from("members").select("frozen_reason").eq("id", id).maybeSingle();
  if (error) return null;
  return (data?.frozen_reason as string | null) ?? null;
}

// Editing a member's fee due date to a future date is the admin saying
// "this member is billed and current" — if they were sitting in an
// AUTOMATIC fee-type block (never billed / fee overdue), lift it, instead
// of leaving the admin to also remember a separate Unblock click. Only
// touches automatic fee blocks: a manual block, or an inactivity block
// (unrelated to the fee), is left exactly as it was.
const AUTO_FEE_BLOCK_RE = /^(never billed|fee overdue).*\(automatic\)$/i;

export async function liftAutomaticFeeBlock(id: string): Promise<void> {
  const reason = await getBlockReason(id);
  if (reason && AUTO_FEE_BLOCK_RE.test(reason)) await unblockMember(id);
}

const AUTO_BLOCK_OVERDUE_DAYS = 5;

// Daily cron (piggybacks on the existing fee-reminders cron — see
// api/cron/fee-reminders/route.ts, no new cron needed): once a member's
// fee has been overdue this long, block them automatically and tell them
// why, on both channels plus an in-app notification. Only touches members
// who actually HAVE a fee_due_date (were billed) and aren't blocked
// already — reversed the moment admin records a payment
// (see feesAdmin.ts::recordManualPayment) or explicitly unblocks them.
export async function autoBlockOverdueMembers(): Promise<{ blocked: number }> {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - AUTO_BLOCK_OVERDUE_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  // No post-unblock grace window here (unlike the inactivity rule below) —
  // deliberately: once a payment is recorded, fee_due_date is either back in
  // the future (this member simply isn't in this query at all) or still in
  // the past because the payment didn't cover the full gap, in which case
  // the owner wants them to stay blockable, not get a few free days.
  const { data: members, error } = await db
    .from("members")
    .select("id, full_name, phone, email")
    .eq("is_active", true)
    .eq("is_frozen", false)
    .not("fee_due_date", "is", null)
    // <= , not < : a fee_due_date exactly `cutoffStr` (today - N days) means
    // exactly N days have elapsed since it was due, which is what "overdue
    // N+ days" actually promises. `.lt` here would only ever catch N+1 days,
    // silently giving every member a free extra day.
    .lte("fee_due_date", cutoffStr);

  if (error) throw new Error(`Failed to load overdue members: ${error.message}`);

  // blockMember (above) already notifies on every channel via notifyBlocked
  // — no need to duplicate that here. Concurrency-limited (not a plain
  // sequential loop) since this cron has no maxDuration override and a
  // gym-wide overdue sweep could realistically hit dozens of members; see
  // backend/lib/concurrency.ts.
  await mapWithConcurrency(members ?? [], NOTIFY_CONCURRENCY, (member) =>
    blockMember(member.id, `Fee overdue ${AUTO_BLOCK_OVERDUE_DAYS}+ days (automatic)`)
  );

  return { blocked: (members ?? []).length };
}

const AUTO_BLOCK_INACTIVE_ELIGIBLE_DAYS = 3;

// Daily cron (same fee-reminders cron as autoBlockOverdueMembers above — no
// new cron needed). Blocks a member who hasn't checked in for 3 continuous
// *attendance-eligible* days: Sundays and admin-marked holidays
// (gymCalendar.ts) don't count against this clock, same "not a member-side
// issue" reasoning the streak calc uses (see attendance.ts) — a member
// can't be penalized for a day the gym itself was closed. Only ever
// considers members who have checked in at least once (last_checked_in_at
// not null); a member who hasn't had their first visit yet is governed by
// autoBlockNeverBilledMembers below instead, not this one.
export async function autoBlockInactiveMembers(): Promise<{ blocked: number }> {
  const db = getDb();
  const today = getIstDateString();
  // Loose calendar-day pre-filter, done in SQL to avoid pulling every
  // active member: the real eligible-day count (which excludes Sundays and
  // holidays) can only ever be <= the raw calendar gap, so this can exclude
  // members who are definitely not due yet, but never miss one who is.
  const looseCutoff = new Date();
  looseCutoff.setDate(looseCutoff.getDate() - AUTO_BLOCK_INACTIVE_ELIGIBLE_DAYS);

  type Row = {
    id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    last_checked_in_at: string;
    unblocked_at?: string | null;
  };
  const query = (columns: string) =>
    db
      .from("members")
      .select(columns)
      .eq("is_active", true)
      .eq("is_frozen", false)
      .not("last_checked_in_at", "is", null)
      .lt("last_checked_in_at", looseCutoff.toISOString());

  // unblocked_at needs its migration; without it this degrades to counting
  // from the last check-in alone (the pre-grace behavior).
  let res = await query("id, full_name, phone, email, last_checked_in_at, unblocked_at");
  if (res.error && isMissingColumnError(res.error)) res = await query("id, full_name, phone, email, last_checked_in_at");
  if (res.error) throw new Error(`Failed to load inactive members: ${res.error.message}`);
  const members = (res.data ?? []) as unknown as Row[];

  const toBlock: Row[] = [];
  for (const member of members) {
    // The clock starts at the LATER of their last real check-in and the
    // moment they were last unblocked — a blocked member can't check in, so
    // measuring only from last_checked_in_at would count the whole time they
    // were locked out against them and re-block them the morning after they
    // pay, before they've had one open day to show up.
    const lastDay = getIstDateString(new Date(member.last_checked_in_at));
    const unblockedDay = member.unblocked_at ? getIstDateString(new Date(member.unblocked_at)) : null;
    const fromDay = unblockedDay && unblockedDay > lastDay ? unblockedDay : lastDay;
    if (await hasMissedAtLeastNEligibleDays(fromDay, today, AUTO_BLOCK_INACTIVE_ELIGIBLE_DAYS)) {
      toBlock.push(member);
    }
  }

  await mapWithConcurrency(toBlock, NOTIFY_CONCURRENCY, (member) =>
    blockMember(member.id, `No check-in for ${AUTO_BLOCK_INACTIVE_ELIGIBLE_DAYS}+ attendance days (automatic)`)
  );

  return { blocked: toBlock.length };
}

const NEVER_BILLED_GRACE_DAYS = 3;

// Daily cron (same fee-reminders cron). A member who was never billed at
// all (no fee_due_date ever set — front desk simply hasn't entered a
// plan/fee for them yet) gets a short grace window from their joining date,
// then is blocked automatically so an unbilled membership can't quietly use
// the floor for free indefinitely. Plain calendar days, not eligible-day
// counting — this is a billing-hygiene grace period tied to a fixed joining
// date, not an attendance expectation, so gym-closure days don't extend it.
export async function autoBlockNeverBilledMembers(): Promise<{ blocked: number }> {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - NEVER_BILLED_GRACE_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  // No post-unblock grace window here either, same reasoning as
  // autoBlockOverdueMembers above — a member only leaves this query once a
  // real fee_due_date is actually recorded for them (recordManualPayment),
  // at which point they're governed by that rule instead, not this one.
  const { data: members, error } = await db
    .from("members")
    .select("id, full_name, phone, email")
    .eq("is_active", true)
    .eq("is_frozen", false)
    .is("fee_due_date", null)
    // <= , not < : same off-by-one fix as autoBlockOverdueMembers above — a
    // joined_at exactly `cutoffStr` (today - N days) means exactly N days
    // have elapsed since joining, which is what "blocked after N days"
    // actually means. `.lt` only ever caught N+1 days, giving every new
    // member a free extra day of unbilled access.
    .lte("joined_at", cutoffStr);

  if (error) throw new Error(`Failed to load never-billed members: ${error.message}`);

  await mapWithConcurrency(members ?? [], NOTIFY_CONCURRENCY, (member) =>
    blockMember(member.id, `Never billed — ${NEVER_BILLED_GRACE_DAYS}+ days since joining (automatic)`)
  );

  return { blocked: (members ?? []).length };
}
