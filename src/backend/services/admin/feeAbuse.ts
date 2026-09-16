import "server-only";
import { getDb } from "@/backend/db/client";
import { isMissingColumnError } from "@/backend/db/errors";
import type { AdminMember } from "@/types/admin";
import { sendWhatsAppTemplate } from "@/backend/services/whatsapp";
import { sendEmailTemplate } from "@/backend/services/email";
import { createNotification } from "@/backend/services/memberNotifications";
import { sendPushToMember } from "@/backend/services/pushNotifications";

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
// either never had a plan/fee assigned at all, or their fee is overdue —
// and not already blocked (a blocked member can't check in anymore, so
// they'd drop out of "actively using" on their own once the block takes
// effect). This is the admin-visibility list — distinct from the 5-day
// auto-block below, which only fires once a fee was actually assigned and
// is now overdue; a member who was NEVER billed has no due date for the
// auto-block to measure against at all, so this list is the only way
// admin ever finds out about them.
const RECENTLY_ACTIVE_DAYS = 7;

export type UnpaidActiveMember = AdminMember & { lastCheckedInAt: string | null; flagReason: string };

function computeFlagReason(row: Record<string, unknown>): string {
  if (!row.plan) return "No plan assigned";
  if (row.fee_amount == null) return "No fee amount set";
  const dueDate = row.fee_due_date as string | null;
  if (dueDate && dueDate < new Date().toISOString().slice(0, 10)) return `Fee overdue since ${dueDate}`;
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
    .or(`plan.is.null,fee_amount.is.null,fee_due_date.lt.${today}`);

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

// Writes frozen_reason/frozen_at too when those columns exist (see the
// migration in schema.sql), but falls back to just the core is_frozen flag
// if that migration hasn't been run yet — the actual block/unblock
// mechanism (denying check-in and dashboard access) works either way, it's
// only the audit trail (why/when) that needs the migration.
export async function blockMember(id: string, reason: string): Promise<void> {
  const db = getDb();
  const { error } = await db
    .from("members")
    .update({ is_frozen: true, frozen_reason: reason, frozen_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    if (!isMissingColumnError(error)) throw new Error(`Failed to block member: ${error.message}`);
    const { error: fallbackError } = await db.from("members").update({ is_frozen: true }).eq("id", id);
    if (fallbackError) throw new Error(`Failed to block member: ${fallbackError.message}`);
  }
}

export async function unblockMember(id: string): Promise<void> {
  const db = getDb();
  const { error } = await db
    .from("members")
    .update({ is_frozen: false, frozen_reason: null, frozen_at: null })
    .eq("id", id);

  if (error) {
    if (!isMissingColumnError(error)) throw new Error(`Failed to unblock member: ${error.message}`);
    const { error: fallbackError } = await db.from("members").update({ is_frozen: false }).eq("id", id);
    if (fallbackError) throw new Error(`Failed to unblock member: ${fallbackError.message}`);
  }
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

  for (const member of members ?? []) {
    await blockMember(member.id, `Fee overdue ${AUTO_BLOCK_OVERDUE_DAYS}+ days (automatic)`);

    if (member.phone) {
      await sendWhatsAppTemplate({
        phone: member.phone,
        template: "account_blocked",
        bodyParams: [member.full_name],
        memberId: member.id,
      }).catch(() => {});
    }
    if (member.email) {
      await sendEmailTemplate({
        to: member.email,
        template: "account_blocked",
        bodyParams: [member.full_name],
        memberId: member.id,
      }).catch(() => {});
    }
    await createNotification({
      memberId: member.id,
      type: "account_blocked",
      title: "Membership Blocked — Fee Overdue",
      body: "Your check-in and dashboard access is on hold until your fee is paid. Please pay at the front desk to reactivate.",
    }).catch(() => {});
    await sendPushToMember(member.id, {
      title: "Membership Blocked — Fee Overdue",
      body: "Your check-in and dashboard access is on hold until your fee is paid. Please pay at the front desk to reactivate.",
      url: "/dashboard/fees",
    }).catch(() => {});
  }

  return { blocked: (members ?? []).length };
}
