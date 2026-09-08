// Creates or updates an admin_users row. Requires SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY to be set (e.g. via `.env.local`, loaded by your shell).
//
// Usage: node scripts/seed-admin.mjs <username> <password>

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const [, , username, password] = process.argv;

if (!username || !password) {
  console.error("Usage: node scripts/seed-admin.mjs <username> <password>");
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.");
  process.exit(1);
}

const db = createClient(supabaseUrl, serviceRoleKey);
const passwordHash = await bcrypt.hash(password, 10);

const { error } = await db
  .from("admin_users")
  .upsert({ username, password_hash: passwordHash }, { onConflict: "username" });

if (error) {
  console.error("Failed to seed admin:", error.message);
  process.exit(1);
}

console.log(`Admin user "${username}" created/updated.`);
