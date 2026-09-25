import "server-only";
import { getDb } from "@/backend/db/client";

export type MemberNotificationType = "broadcast" | "fee_reminder" | "account_blocked" | "account_unblocked";

export type MemberNotification = {
  id: string;
  type: MemberNotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export async function createNotification(input: {
  memberId: string;
  type: MemberNotificationType;
  title: string;
  body: string;
}): Promise<void> {
  const db = getDb();
  const { error } = await db.from("member_notifications").insert({
    member_id: input.memberId,
    type: input.type,
    title: input.title,
    body: input.body,
  });
  if (error) throw new Error(`Failed to create notification: ${error.message}`);
}

export async function listNotifications(memberId: string, limit = 20): Promise<MemberNotification[]> {
  const db = getDb();
  const { data, error } = await db
    .from("member_notifications")
    .select("id, type, title, body, read_at, created_at")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load notifications: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    isRead: row.read_at != null,
    createdAt: row.created_at,
  }));
}

// A head-count query (no rows fetched or serialized) — deliberately not
// `listNotifications(...).filter(unread)`, which would pull all 20 rows
// just to answer a yes/no question. This is what powers the red dot on
// DashboardHeader's Settings button (see unread-count/route.ts): cheap
// enough to call on every page load without reintroducing the latency
// dashboard/layout.tsx got fixed for eagerly fetching the full list.
export async function countUnreadNotifications(memberId: string): Promise<number> {
  const db = getDb();
  const { count, error } = await db
    .from("member_notifications")
    .select("id", { count: "exact", head: true })
    .eq("member_id", memberId)
    .is("read_at", null);

  if (error) throw new Error(`Failed to count unread notifications: ${error.message}`);
  return count ?? 0;
}

export async function markNotificationsRead(memberId: string): Promise<void> {
  const db = getDb();
  const { error } = await db
    .from("member_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("member_id", memberId)
    .is("read_at", null);

  if (error) throw new Error(`Failed to mark notifications read: ${error.message}`);
}

const NOTIFICATION_RETENTION_DAYS = 7;

export async function deleteOldNotifications(): Promise<{ deleted: number }> {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - NOTIFICATION_RETENTION_DAYS);

  const { data, error } = await db
    .from("member_notifications")
    .delete()
    .lt("created_at", cutoff.toISOString())
    .select("id");

  if (error) throw new Error(`Failed to delete old notifications: ${error.message}`);
  return { deleted: data?.length ?? 0 };
}
