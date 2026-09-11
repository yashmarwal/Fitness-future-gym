import "server-only";
import { getDb } from "@/backend/db/client";
import type { AdminMember, MemberInput } from "@/types/admin";

function mapRow(row: Record<string, unknown>): AdminMember {
  return {
    id: row.id as string,
    membershipNumber: row.membership_number as string,
    fullName: row.full_name as string,
    phone: row.phone as string | null,
    dateOfBirth: row.date_of_birth as string | null,
    plan: row.plan as string | null,
    feeAmount: row.fee_amount as number | null,
    feeDueDate: row.fee_due_date as string | null,
    joinedAt: row.joined_at as string,
    isActive: row.is_active as boolean,
  };
}

export async function listMembers(): Promise<AdminMember[]> {
  const db = getDb();
  const { data, error } = await db
    .from("members")
    .select("id, membership_number, full_name, phone, date_of_birth, plan, fee_amount, fee_due_date, joined_at, is_active")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load members: ${error.message}`);
  return (data ?? []).map(mapRow);
}

export async function getMember(id: string): Promise<AdminMember | null> {
  const db = getDb();
  const { data, error } = await db
    .from("members")
    .select("id, membership_number, full_name, phone, date_of_birth, plan, fee_amount, fee_due_date, joined_at, is_active")
    .eq("id", id)
    .maybeSingle();

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
      date_of_birth: input.dateOfBirth || null,
      plan: input.plan || null,
      fee_amount: input.feeAmount ?? null,
      fee_due_date: input.feeDueDate || null,
    })
    .select("id, membership_number, full_name, phone, date_of_birth, plan, fee_amount, fee_due_date, joined_at, is_active")
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
  if (input.dateOfBirth !== undefined) patch.date_of_birth = input.dateOfBirth || null;
  if (input.plan !== undefined) patch.plan = input.plan || null;
  if (input.feeAmount !== undefined) patch.fee_amount = input.feeAmount;
  if (input.feeDueDate !== undefined) patch.fee_due_date = input.feeDueDate || null;
  if (input.isActive !== undefined) patch.is_active = input.isActive;

  const { error } = await db.from("members").update(patch).eq("id", id);
  if (error) throw new Error(`Failed to update member: ${error.message}`);
}

export async function deleteMember(id: string): Promise<void> {
  const db = getDb();
  const { error } = await db.from("members").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete member: ${error.message}`);
}
