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

  const { data, error } = await db
    .from("members")
    .update({ is_frozen: false, frozen_reason: null, frozen_at: null })
    .eq("id", id)
    .select("full_name, phone, email")
    .maybeSingle();

  if (error) {
    if (!isMissingColumnError(error)) throw new Error(`Failed to unblock member: ${error.message}`);
    const { data: fallbackData, error: fallbackError } = await db
      .from("members")
      .update({ is_frozen: false })
      .eq("id", id)
      .select("full_name, phone, email")
      .maybeSingle();
    if (fallbackError) throw new Error(`Failed to unblock member: ${fallbackError.message}`);
    after(() => notifyUnblocked(id, fallbackData));
    return;
  }
  after(() => notifyUnblocked(id, data));
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

  const { data: members, error } = await db
    .from("members")
    .select("id, full_name, phone, email")
    .eq("is_active", true)
    .eq("is_frozen", false)
    .not("fee_due_date", "is", null)
    .lt("fee_due_date", cutoffStr);

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
