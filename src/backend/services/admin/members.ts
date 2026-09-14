import "server-only";
import { getDb } from "@/backend/db/client";
import type { AdminMember, MemberInput } from "@/types/admin";
import { deliverMembershipCard } from "@/backend/services/membershipCardDelivery";

function mapRow(row: Record<string, unknown>): AdminMember {
  return {
    id: row.id as string,
    membershipNumber: row.membership_number as string,
    fullName: row.full_name as string,
    phone: row.phone as string | null,
    email: row.email as string | null,
    dateOfBirth: row.date_of_birth as string | null,
    plan: row.plan as string | null,
    feeAmount: row.fee_amount as number | null,
    feeDueDate: row.fee_due_date as string | null,
    joinedAt: row.joined_at as string,
    isActive: row.is_active as boolean,
  };
}

const SELECT_COLUMNS =
  "id, membership_number, full_name, phone, email, date_of_birth, plan, fee_amount, fee_due_date, joined_at, is_active";

export async function listMembers(): Promise<AdminMember[]> {
  const db = getDb();
  const { data, error } = await db.from("members").select(SELECT_COLUMNS).order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load members: ${error.message}`);
  return (data ?? []).map(mapRow);
}

export async function getMember(id: string): Promise<AdminMember | null> {
  const db = getDb();
  const { data, error } = await db.from("members").select(SELECT_COLUMNS).eq("id", id).maybeSingle();

  if (error) throw new Error(`Failed to load member: ${error.message}`);
  return data ? mapRow(data) : null;
}

export async function createMember(input: MemberInput): Promise<AdminMember> {
  const db = getDb();
  const { data, error } = await db
    .from("members")
    .insert({
      membership_number: input.membershipNumber,
      full_name: input.fullName,
      phone: input.phone || null,
      email: input.email || null,
      date_of_birth: input.dateOfBirth || null,
      plan: input.plan || null,
      fee_amount: input.feeAmount ?? null,
      fee_due_date: input.feeDueDate || null,
      joined_at: input.joinedAt || undefined,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new Error(`Failed to create member: ${error.message}`);
  return mapRow(data);
}

export async function updateMember(id: string, input: Partial<MemberInput> & { isActive?: boolean }): Promise<void> {
  const db = getDb();
  const patch: Record<string, unknown> = {};
  if (input.membershipNumber !== undefined) patch.membership_number = input.membershipNumber;
  if (input.fullName !== undefined) patch.full_name = input.fullName;
  if (input.phone !== undefined) patch.phone = input.phone || null;
  if (input.email !== undefined) patch.email = input.email || null;
  if (input.dateOfBirth !== undefined) patch.date_of_birth = input.dateOfBirth || null;
  if (input.plan !== undefined) patch.plan = input.plan || null;
  if (input.feeAmount !== undefined) patch.fee_amount = input.feeAmount;
  if (input.feeDueDate !== undefined) patch.fee_due_date = input.feeDueDate || null;
  if (input.joinedAt !== undefined) patch.joined_at = input.joinedAt;
  if (input.isActive !== undefined) patch.is_active = input.isActive;

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

  if (cardRelevantChange) {
    const { data: member } = await db
      .from("members")
      .select("id, full_name, membership_number, phone, email, plan, fee_amount, joined_at")
      .eq("id", id)
      .maybeSingle();
    if (member) {
      await deliverMembershipCard({
        id: member.id,
        fullName: member.full_name,
        membershipNumber: member.membership_number,
        phone: member.phone,
        email: member.email,
        plan: member.plan,
        feeAmount: member.fee_amount,
        joinedAt: member.joined_at,
      }).catch(() => {});
    }
  }
}

export async function deleteMember(id: string): Promise<void> {
  const db = getDb();
  const { error } = await db.from("members").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete member: ${error.message}`);
}
