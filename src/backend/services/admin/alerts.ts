import "server-only";
import { getDb } from "@/backend/db/client";
import type { AlertMember } from "@/types/admin";

const INACTIVE_DAYS = 120;
const TRIAL_DAYS = 2;
const UPCOMING_DUE_DAYS = 3;
const UPCOMING_BIRTHDAY_DAYS = 7;

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function daysAhead(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const today = () => new Date().toISOString().slice(0, 10);

export async function listOverdueFeeMembers(): Promise<AlertMember[]> {
  const db = getDb();
  const { data, error } = await db
    .from("members")
    .select("id, full_name, membership_number, fee_due_date")
    .eq("is_active", true)
    .not("fee_due_date", "is", null)
    .lt("fee_due_date", today());

  if (error) throw new Error(`Failed to load overdue members: ${error.message}`);
  return (data ?? []).map((m) => ({
    id: m.id,
    fullName: m.full_name,
    membershipNumber: m.membership_number,
    detail: `Due since ${m.fee_due_date}`,
  }));
}

export async function listUpcomingDueMembers(): Promise<AlertMember[]> {
  const db = getDb();
  const { data, error } = await db
    .from("members")
    .select("id, full_name, membership_number, fee_due_date")
    .eq("is_active", true)
    .not("fee_due_date", "is", null)
    .gte("fee_due_date", today())
    .lte("fee_due_date", daysAhead(UPCOMING_DUE_DAYS));

  if (error) throw new Error(`Failed to load upcoming due members: ${error.message}`);
  return (data ?? []).map((m) => ({
    id: m.id,
    fullName: m.full_name,
    membershipNumber: m.membership_number,
    detail: `Due ${m.fee_due_date}`,
  }));
}

export async function listInactiveMembers(): Promise<AlertMember[]> {
  const db = getDb();
  const cutoff = daysAgo(INACTIVE_DAYS);

  const { data, error } = await db
    .from("members")
    .select("id, full_name, membership_number, last_checked_in_at, joined_at")
    .eq("is_active", true)
    .lt("joined_at", cutoff.slice(0, 10))
    .or(`last_checked_in_at.is.null,last_checked_in_at.lt.${cutoff}`);

  if (error) throw new Error(`Failed to load inactive members: ${error.message}`);
  return (data ?? []).map((m) => ({
    id: m.id,
    fullName: m.full_name,
    membershipNumber: m.membership_number,
    detail: m.last_checked_in_at
      ? `Last visit ${new Date(m.last_checked_in_at).toLocaleDateString()}`
      : `Never checked in (joined ${m.joined_at})`,
  }));
}

export async function listTrialOverMembers(): Promise<AlertMember[]> {
  const db = getDb();
  const { data, error } = await db
    .from("members")
    .select("id, full_name, membership_number, joined_at")
    .eq("is_active", true)
    .is("plan", null)
    .lte("joined_at", daysAgo(TRIAL_DAYS).slice(0, 10));

  if (error) throw new Error(`Failed to load trial-over members: ${error.message}`);
  return (data ?? []).map((m) => ({
    id: m.id,
    fullName: m.full_name,
    membershipNumber: m.membership_number,
    detail: `Joined ${m.joined_at}, no plan selected yet`,
  }));
}

export async function listUpcomingBirthdays(): Promise<AlertMember[]> {
  const db = getDb();
  const { data, error } = await db
    .from("members")
    .select("id, full_name, membership_number, date_of_birth")
    .eq("is_active", true)
    .not("date_of_birth", "is", null);

  if (error) throw new Error(`Failed to load birthdays: ${error.message}`);

  const now = new Date();
  return (data ?? [])
    .filter((m) => {
      const dob = new Date(m.date_of_birth as string);
      const nextBirthday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      const diffDays = (nextBirthday.getTime() - new Date(now.toDateString()).getTime()) / 86400000;
      return diffDays >= 0 && diffDays <= UPCOMING_BIRTHDAY_DAYS;
    })
    .map((m) => ({
      id: m.id,
      fullName: m.full_name,
      membershipNumber: m.membership_number,
      detail: `Birthday: ${m.date_of_birth}`,
    }));
}
