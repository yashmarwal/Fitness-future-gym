import "server-only";
import { cache } from "react";
import { getDb } from "@/backend/db/client";

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
  isBlocked: boolean;
};

// Wrapped in React's cache() so the layout and a page rendering under it
// (both calling this with the same memberId in one request) share a single
// Supabase round-trip instead of each firing its own — this was previously
// duplicated on every dashboard page load (layout + page.tsx both called
// it), doubling that query for no reason.
export const getMemberById = cache(async function getMemberById(memberId: string): Promise<MemberProfile | null> {
  const db = getDb();
  const { data, error } = await db
    .from("members")
    .select("id, membership_number, full_name, phone, plan, fee_amount, fee_due_date, joined_at, is_active, is_frozen")
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
    isBlocked: data.is_frozen,
  };
});
