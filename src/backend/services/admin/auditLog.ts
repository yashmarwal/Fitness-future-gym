import "server-only";
import { getDb } from "@/backend/db/client";

export async function recordAuditLog(adminId: string, action: string, details?: Record<string, unknown>): Promise<void> {
  const db = getDb();
  await db.from("audit_log").insert({ admin_id: adminId, action, details: details ?? null });
}

export type AuditLogEntry = {
  id: string;
  adminUsername: string | null;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
};

// Powers the Audit Log admin page — every write here already happens
// throughout the admin routes (block/unblock, payments, member edits,
// broadcasts, trial conversions, attendance edits), this is just the first
// place any of it gets read back instead of sitting in the table unused.
// admin_users(username) is a PostgREST embedded select over the
// audit_log.admin_id -> admin_users.id foreign key (see schema.sql) — one
// query, not N+1 per row.
export async function listAuditLog(limit = 200): Promise<AuditLogEntry[]> {
  const db = getDb();
  const { data, error } = await db
    .from("audit_log")
    .select("id, action, details, created_at, admin_users(username)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load audit log: ${error.message}`);
  return (data ?? []).map((row) => {
    const admin = row.admin_users as unknown as { username: string } | { username: string }[] | null;
    const adminUsername = Array.isArray(admin) ? (admin[0]?.username ?? null) : (admin?.username ?? null);
    return {
      id: row.id as string,
      adminUsername,
      action: row.action as string,
      details: row.details as Record<string, unknown> | null,
      createdAt: row.created_at as string,
    };
  });
}
