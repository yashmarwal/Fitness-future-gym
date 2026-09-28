import "server-only";
import { after } from "next/server";
import { getDb } from "@/backend/db/client";
import type { AdminMember, MemberInput, MemberSearchResult } from "@/types/admin";
import { deliverMembershipCard } from "@/backend/services/membershipCardDelivery";
import { normalizePhone } from "@/backend/lib/phone";
import { normalizeEmail } from "@/backend/lib/email";
import { isMissingColumnError } from "@/backend/db/errors";
import { getIstDateString } from "@/frontend/lib/date";
import { liftAutomaticFeeBlock } from "@/backend/services/admin/feeAbuse";

function mapRow(row: Record<string, unknown>): AdminMember {
  return {
    id: row.id as string,
    membershipNumber: row.membership_number as string,
    fullName: row.full_name as string,
    phone: row.phone as string | null,
    email: row.email as string | null,
    dateOfBirth: row.date_of_birth as string | null,
    address: (row.address as string | null | undefined) ?? null,
    plan: row.plan as string | null,
    feeAmount: row.fee_amount as number | null,
    feeDueDate: row.fee_due_date as string | null,
    joinedAt: row.joined_at as string,
    isActive: row.is_active as boolean,
    isBlocked: row.is_frozen as boolean,
    // Not selected here — frozen_reason needs a migration (see schema.sql)
    // that may not have run yet, and this general member list/CRUD only
    // needs to know IF someone's blocked, not why. The dedicated blocked-
    // members list in feeAbuse.ts selects it separately and degrades
    // gracefully if the column isn't there yet.
    blockedReason: null,
    notes: (row.notes as string | null | undefined) ?? null,
  };
}

const BASE_COLUMNS =
  "id, membership_number, full_name, phone, email, date_of_birth, plan, fee_amount, fee_due_date, joined_at, is_active, is_frozen";
// `address` and `notes` are both newer/optional columns — select them
// separately and fall back to BASE_COLUMNS if a migration hasn't run yet
// (see isMissingColumnError), same pattern as member.ts::getMemberById, so
// a pending migration doesn't 500 the entire admin Members page.
const FULL_COLUMNS = `${BASE_COLUMNS}, address, notes`;

export async function listMembers(): Promise<AdminMember[]> {
  const db = getDb();
  const full = await db.from("members").select(FULL_COLUMNS).order("created_at", { ascending: false });
  if (!full.error) return (full.data ?? []).map(mapRow);
  if (!isMissingColumnError(full.error)) throw new Error(`Failed to load members: ${full.error.message}`);

  const base = await db.from("members").select(BASE_COLUMNS).order("created_at", { ascending: false });
  if (base.error) throw new Error(`Failed to load members: ${base.error.message}`);
  return (base.data ?? []).map(mapRow);
}

// A cheap head-count query (no rows fetched) rather than listMembers().length
// — powers the admin AI assistant's "how many members" question (see
// aiAssistant.ts's count_members tool). Without a dedicated count tool the
// model's only option was list_members, and its own system prompt telling
// it to "never guess or invent a number" made it reluctant to count that
// list itself rather than risk being wrong — the same reasoning already
// applied to count_overdue_members/count_todays_checkins elsewhere.
export async function countMembers(): Promise<{ total: number; active: number; blocked: number }> {
  const db = getDb();
  const [totalRes, activeRes, blockedRes] = await Promise.all([
    db.from("members").select("id", { count: "exact", head: true }),
    db.from("members").select("id", { count: "exact", head: true }).eq("is_active", true),
    db.from("members").select("id", { count: "exact", head: true }).eq("is_frozen", true),
  ]);
  if (totalRes.error) throw new Error(`Failed to count members: ${totalRes.error.message}`);
  if (activeRes.error) throw new Error(`Failed to count members: ${activeRes.error.message}`);
  if (blockedRes.error) throw new Error(`Failed to count members: ${blockedRes.error.message}`);
  return { total: totalRes.count ?? 0, active: activeRes.count ?? 0, blocked: blockedRes.count ?? 0 };
}

// Minimal batch lookup (name + membership number only) — powers the Audit
// Log page's "which member was this about" resolution, one query for every
// memberId referenced on the page instead of one per row.
export async function getMemberLabelsByIds(ids: string[]): Promise<Map<string, { fullName: string; membershipNumber: string }>> {
  const map = new Map<string, { fullName: string; membershipNumber: string }>();
  if (ids.length === 0) return map;
  const db = getDb();
  const { data, error } = await db.from("members").select("id, full_name, membership_number").in("id", ids);
  if (error) throw new Error(`Failed to load member labels: ${error.message}`);
  for (const row of data ?? []) {
    map.set(row.id as string, { fullName: row.full_name as string, membershipNumber: row.membership_number as string });
  }
  return map;
}

export async function getMember(id: string): Promise<AdminMember | null> {
  const db = getDb();
  const full = await db.from("members").select(FULL_COLUMNS).eq("id", id).maybeSingle();
  if (!full.error) return full.data ? mapRow(full.data) : null;
  if (!isMissingColumnError(full.error)) throw new Error(`Failed to load member: ${full.error.message}`);

  const base = await db.from("members").select(BASE_COLUMNS).eq("id", id).maybeSingle();
  if (base.error) throw new Error(`Failed to load member: ${base.error.message}`);
  return base.data ? mapRow(base.data) : null;
}

// Powers the admin nav's global quick-search — a small, fast, on-demand
// query (not a full listMembers() fetch, which would mean re-downloading
// every member on every keystroke). Matches name OR membership number,
// case-insensitively, capped at `limit` results. Empty/whitespace-only
// query returns nothing rather than the first N members alphabetically,
// which would look like a bug ("why do these specific people show up").
export async function searchMembers(query: string, limit = 8): Promise<MemberSearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  const db = getDb();
  const { data, error } = await db
    .from("members")
    .select("id, full_name, membership_number, phone")
    .or(`full_name.ilike.%${q}%,membership_number.ilike.%${q}%`)
    .order("full_name", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`Failed to search members: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    membershipNumber: row.membership_number,
    phone: row.phone,
  }));
}

export async function createMember(input: MemberInput): Promise<AdminMember> {
  const db = getDb();
  const { data, error } = await db
    .from("members")
    .insert({
      membership_number: input.membershipNumber,
      full_name: input.fullName,
      phone: input.phone ? normalizePhone(input.phone) : null,
      email: input.email ? normalizeEmail(input.email) : null,
      date_of_birth: input.dateOfBirth || null,
      address: input.address || null,
      plan: input.plan || null,
      fee_amount: input.feeAmount ?? null,
      fee_due_date: input.feeDueDate || null,
      joined_at: input.joinedAt || undefined,
      notes: input.notes || null,
    })
    .select(FULL_COLUMNS)
    .single();

  if (error) throw new Error(`Failed to create member: ${error.message}`);
  return mapRow(data);
}

export async function updateMember(id: string, input: Partial<MemberInput> & { isActive?: boolean }): Promise<void> {
  const db = getDb();
  const patch: Record<string, unknown> = {};
  if (input.membershipNumber !== undefined) patch.membership_number = input.membershipNumber;
  if (input.fullName !== undefined) patch.full_name = input.fullName;
  if (input.phone !== undefined) patch.phone = input.phone ? normalizePhone(input.phone) : null;
  if (input.email !== undefined) patch.email = input.email ? normalizeEmail(input.email) : null;
  if (input.dateOfBirth !== undefined) patch.date_of_birth = input.dateOfBirth || null;
  if (input.address !== undefined) patch.address = input.address || null;
  if (input.plan !== undefined) patch.plan = input.plan || null;
  if (input.feeAmount !== undefined) patch.fee_amount = input.feeAmount;
  if (input.feeDueDate !== undefined) patch.fee_due_date = input.feeDueDate || null;
  if (input.joinedAt !== undefined) patch.joined_at = input.joinedAt;
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (input.notes !== undefined) patch.notes = input.notes || null;

  // Only attempt a card (re)send when plan or fee actually changes — not on
  // every edit, since the admin form always submits the full record whether
  // or not those two fields were touched. deliverMembershipCard itself
  // still won't send anything unless BOTH end up set — this just avoids the
  // wasted attempt (and a duplicate audit-log-worthy send) on an unrelated
  // save once a member is already fully set up.
  let cardRelevantChange = false;
  if (input.plan !== undefined || input.feeAmount !== undefined) {
    const { data: before } = await db.from("members").select("plan, fee_amount").eq("id", id).maybeSingle();
    if (before) {
      const newPlan = input.plan !== undefined ? input.plan || null : before.plan;
      const newFeeAmount = input.feeAmount !== undefined ? input.feeAmount : before.fee_amount;
      cardRelevantChange =
        (before.plan || null) !== newPlan || (before.fee_amount ?? null) !== (newFeeAmount ?? null);
    }
  }

  const { error } = await db.from("members").update(patch).eq("id", id);
  if (error) throw new Error(`Failed to update member: ${error.message}`);

  // Setting a due date in the future means "billed and current" — lifts an
  // automatic never-billed / fee-overdue block without a separate Unblock
  // click (see liftAutomaticFeeBlock for exactly what it will and won't touch).
  if (input.feeDueDate && input.feeDueDate > getIstDateString()) {
    await liftAutomaticFeeBlock(id).catch(() => {});
  }

  if (cardRelevantChange) {
    const { data: member } = await db
      .from("members")
      .select("id, full_name, membership_number, phone, email, plan, fee_amount, joined_at")
      .eq("id", id)
      .maybeSingle();
    if (member) {
      // Deferred via after() — same reasoning as recordManualPayment in
      // admin/feesAdmin.ts: WhatsApp + email + PDF, best-effort, not worth
      // making this save wait on it.
      after(() =>
        deliverMembershipCard({
          id: member.id,
          fullName: member.full_name,
          membershipNumber: member.membership_number,
          phone: member.phone,
          email: member.email,
          plan: member.plan,
          feeAmount: member.fee_amount,
          joinedAt: member.joined_at,
        }).catch(() => {})
      );
    }
  }
}

export async function deleteMember(id: string): Promise<void> {
  const db = getDb();
  const { error } = await db.from("members").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete member: ${error.message}`);
}
