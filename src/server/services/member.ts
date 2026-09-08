import "server-only";
import { getDb } from "@/server/db/client";

export type MemberProfile = {
  id: string;
  membershipNumber: string;
  fullName: string;
  phone: string | null;
  plan: string | null;
  feeAmount: number | null;
  feeDueDate: string | null;
  joinedAt: string;
  isActive: boolean;
};

export async function getMemberById(memberId: string): Promise<MemberProfile | null> {
  const db = getDb();
  const { data, error } = await db
    .from("members")
    .select("id, membership_number, full_name, phone, plan, fee_amount, fee_due_date, joined_at, is_active")
    .eq("id", memberId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load member: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    membershipNumber: data.membership_number,
    fullName: data.full_name,
    phone: data.phone,
    plan: data.plan,
    feeAmount: data.fee_amount,
    feeDueDate: data.fee_due_date,
    joinedAt: data.joined_at,
    isActive: data.is_active,
  };
}
