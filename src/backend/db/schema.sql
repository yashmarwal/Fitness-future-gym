-- Fitness Future Gym — full schema
-- Run this in the Supabase SQL editor for your project.

create extension if not exists pgcrypto;

-- ── Migration for an already-existing database (2026-09-14) ───────────────
-- `create table if not exists` below won't retroactively add a constraint
-- to a table that already exists. If you've run this schema before, run
-- this one statement in the Supabase SQL editor once — it's what stops two
-- different phone numbers from completing signup with the same email
-- (which used to silently break email-based login for both of them):
--
--   alter table members add constraint members_email_key unique (email);
--
-- If it fails with a duplicate-email error, that means real dirty data
-- already exists — find it first with:
--   select email, count(*) from members where email is not null group by email having count(*) > 1;
-- and fix those rows (merge or clear the duplicate email) before retrying.
--
-- Also run this one, for OTP brute-force lockout (see checkOtp in otp.ts):
--
--   alter table login_otps add column if not exists attempt_count integer not null default 0;
--
-- Also run these two, for the fee-abuse block/unblock feature (see
-- admin/feeAbuse.ts) — `is_frozen` already existed unused in this table
-- from the original schema, now wired up as the actual block flag; these
-- two are genuinely new:
--
--   alter table members add column if not exists frozen_reason text;
--   alter table members add column if not exists frozen_at timestamptz;
--
-- Also run this one — an index on the column every fee-reminder/alerts/
-- access-control query filters on (create index if not exists is safe to
-- run standalone, no need to re-run the whole file):
--
--   create index if not exists members_active_fee_due_date_idx
--     on members (fee_due_date) where is_active = true;
--
-- Also run these three, for the opt-in water/meal-log/streak reminder
-- toggles on the dashboard (see reminders.ts):
--
--   alter table members add column if not exists notify_water boolean not null default false;
--   alter table members add column if not exists notify_meal_log boolean not null default false;
--   alter table members add column if not exists notify_streak boolean not null default false;
--
-- Also run this one, for the opt-in "Workout Prompt" push (a nudge to start
-- logging after a front-desk QR check-in — see workoutPrompt.ts). Without it
-- everything still works; the toggle just can't be switched on:
--
--   alter table members add column if not exists notify_workout boolean not null default false;
--
-- Also run these two — fixes the "Day Streak" dashboard stat silently
-- capping at ~30 days once a member's older attendance rows get purged
-- (see checkInMemberRow in attendance.ts):
--
--   alter table members add column if not exists current_streak_days integer not null default 0;
--   alter table members add column if not exists longest_streak_days integer not null default 0;
--
-- Also run these two — adds the member's home address, collected at signup
-- and editable from Admin -> Members (see memberAuth.ts, admin/members.ts):
--
--   alter table members add column if not exists address text;
--   alter table pending_signups add column if not exists address text;
--
-- Also run this — creates the two tables behind the one-time old-software
-- migration (see legacyFeeImport.ts): matches a new signup's phone number
-- against imported legacy records and silently carries over their plan/due
-- date from the old system, so members who paid under the old software
-- don't show up as unpaid the moment they join the new app.
--
--   create table if not exists legacy_fee_imports (
--     id uuid primary key default gen_random_uuid(),
--     phone text not null unique,
--     start_date date not null,
--     fee_due_date date not null,
--     imported_at timestamptz not null default now()
--   );
--   create table if not exists legacy_fee_import_batches (
--     id uuid primary key default gen_random_uuid(),
--     total_rows integer not null,
--     matched_count integer not null default 0,
--     imported_at timestamptz not null default now()
--   );
--
-- Also run this — carries the old system's actual fee amount over too
-- (not just plan/due date), so a legacy-matched member's profile and
-- membership card are fully correct from day one instead of missing the
-- one field deliverMembershipCard actually requires to send the card:
--
--   alter table legacy_fee_imports add column if not exists fee_amount numeric(10, 2);

-- ── Members ─────────────────────────────────────────────────────────────

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  membership_number text not null unique,
  full_name text not null,
  phone text unique,
  email text unique,
  date_of_birth date,
  address text,
  plan text,
  fee_amount numeric(10, 2),
  joined_at date not null default current_date,
  fee_due_date date,
  is_active boolean not null default true,
  -- Blocks self-service check-in and all dashboard access (both front-desk
  -- QR and the dashboard's own one-tap check-in). Set manually from Admin
  -- -> Access Control, or automatically by the fee-abuse cron once a fee
  -- has been overdue 5+ days — see admin/feeAbuse.ts.
  is_frozen boolean not null default false,
  frozen_reason text,
  frozen_at timestamptz,
  notes text,
  -- Persists independently of the attendance log's 1-month retention policy
  -- (see deleteOldAttendance), so long-term inactivity (e.g. 4+ months) can
  -- still be detected after the underlying check-in rows have been purged.
  last_checked_in_at timestamptz,
  -- The real, attendance-based "Day Streak" dashboard stat — a permanent
  -- running count updated on every check-in (see checkInMemberRow), NOT
  -- recomputed by walking the attendance log on read. That log is purged
  -- after 30 days (deleteOldAttendance), so a member with a genuine 45-day
  -- streak would otherwise see it silently cut down to ~30 once their
  -- oldest rows aged out — the exact same "derived-from-a-purged-log"
  -- bug class already avoided for Muscle Progress XP (member_muscle_xp).
  current_streak_days integer not null default 0,
  longest_streak_days integer not null default 0,
  -- Opt-in personal reminder toggles, shown on the dashboard (not a
  -- separate settings page) — each independently controls whether that
  -- member gets pinged by the matching cron (reminders.ts). All default
  -- false: these are never sent to anyone who hasn't explicitly turned
  -- them on, unlike fee/birthday/broadcast pushes which don't need opt-in.
  notify_water boolean not null default false,
  notify_meal_log boolean not null default false,
  notify_streak boolean not null default false,
  notify_workout boolean not null default false,
  created_at timestamptz not null default now()
);

-- Matches the exact filter every fee-related query already uses
-- (`is_active = true` plus a `fee_due_date` range or comparison) —
-- notifications.ts::runFeeReminderCheck, admin/alerts.ts, and
-- admin/feeAbuse.ts's overdue/auto-block checks all hit this. Partial (only
-- active members) since blocked/inactive members are excluded from all of
-- those queries anyway. At this gym's current scale (low hundreds of rows)
-- a sequential scan would already be fast — this is headroom for when that
-- stops being true, not a fix for a measured slowdown.
create index if not exists members_active_fee_due_date_idx
  on members (fee_due_date) where is_active = true;

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  checked_in_at timestamptz not null default now()
);

create index if not exists attendance_member_id_checked_in_at_idx
  on attendance (member_id, checked_in_at desc);

-- ── Auth ────────────────────────────────────────────────────────────────

create table if not exists login_otps (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  -- Counts wrong-code guesses against this row; checkOtp locks it out
  -- (treats it as invalid regardless of the code entered) once this hits
  -- MAX_VERIFY_ATTEMPTS, forcing a resend rather than allowing unlimited
  -- brute-force guesses at a 6-digit code within its 15-minute TTL.
  attempt_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists login_otps_phone_idx on login_otps (phone);

-- Holds a signup's details between "Create Account" and OTP verification.
-- The members row (and its membership number) is only created once the code
-- is verified — otherwise an abandoned/never-finished signup would burn a
-- membership number and permanently occupy that phone/email, blocking the
-- person from ever successfully signing up with it again.
create table if not exists pending_signups (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  full_name text not null,
  email text,
  date_of_birth date,
  address text,
  created_at timestamptz not null default now()
);

-- One-time migration aid from the old gym software (see
-- legacyFeeImport.ts) — populated by scripts/import-legacy-fees.mjs, drained
-- as new signups match by phone (each matched row is deleted immediately;
-- see the 6-month deleteExpiredLegacyFeeImports cleanup in logs-cleanup for
-- whatever's left unmatched after that window).
create table if not exists legacy_fee_imports (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  start_date date not null,
  fee_due_date date not null,
  fee_amount numeric(10, 2),
  imported_at timestamptz not null default now()
);

-- One row per import run — total_rows/matched_count power the admin status
-- card; imported_at is what the 6-month cleanup measures against.
create table if not exists legacy_fee_import_batches (
  id uuid primary key default gen_random_uuid(),
  total_rows integer not null,
  matched_count integer not null default 0,
  imported_at timestamptz not null default now()
);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- ── Fees & payments ────────────────────────────────────────────────────

create table if not exists fee_payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  amount numeric(10, 2) not null,
  method text not null default 'upi', -- 'upi' | 'cash' | 'manual'
  status text not null default 'paid', -- 'paid' | 'pending_confirmation'
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists fee_payments_member_id_idx on fee_payments (member_id);

-- ── Member dashboard data ──────────────────────────────────────────────

create table if not exists workout_logs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  exercise_name text not null,
  sets integer not null,
  reps integer not null,
  weight_kg numeric(6, 2),
  logged_at timestamptz not null default now()
);

create index if not exists workout_logs_member_id_logged_at_idx
  on workout_logs (member_id, logged_at desc);

-- Permanent XP totals per member per muscle group, powering the Muscle
-- Progress dashboard feature. Deliberately NOT derived from workout_logs on
-- read (that table is purged after 30 days — see WORKOUT_LOG_RETENTION_DAYS
-- in workouts.ts), which would silently regress a member's rank every month
-- as old logs age out. Instead this accumulates permanently, incremented
-- once per logged set at insert time (see awardWorkoutXp in
-- muscleProgress.ts) and never decremented or purged.
create table if not exists member_muscle_xp (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  category text not null,
  xp integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (member_id, category)
);

-- Permanent per-exercise personal bests, powering the "New PR!" celebration
-- and the Personal Records page. Same reasoning as member_muscle_xp above:
-- deliberately NOT derived from workout_logs on read (purged after 30 days),
-- which would silently forget a real PR the moment its original log aged
-- out. Updated once per logged set, only when that set actually beats the
-- stored best (see checkAndRecordPr in personalRecords.ts) — never purged,
-- never decremented.
create table if not exists member_exercise_prs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  -- Trimmed + lowercased match key ("bench press") so casing differences
  -- across logs ("Bench Press" vs "bench press") don't fragment one
  -- exercise into two separate PR rows. exercise_name keeps the most
  -- recently-logged casing, for display.
  exercise_key text not null,
  exercise_name text not null,
  best_weight_kg numeric(6, 2),
  best_reps integer not null,
  achieved_at timestamptz not null default now(),
  unique (member_id, exercise_key)
);

create index if not exists member_exercise_prs_member_id_idx
  on member_exercise_prs (member_id);

create table if not exists workout_plans (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  name text not null,
  days jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists food_logs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  description text not null,
  calories integer not null,
  protein_g numeric(6, 2),
  carbs_g numeric(6, 2),
  fat_g numeric(6, 2),
  logged_at timestamptz not null default now()
);

create index if not exists food_logs_member_id_logged_at_idx
  on food_logs (member_id, logged_at desc);

-- ── In-app notifications (dashboard notification bar) ──────────────────
-- Mirrors what already goes out over WhatsApp/email for broadcasts and fee
-- reminders, so members also see it inside the dashboard itself. Purged
-- after 7 days by the same cron that cleans up workout/food logs.

create table if not exists member_notifications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  type text not null, -- 'broadcast' | 'fee_reminder'
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists member_notifications_member_id_created_at_idx
  on member_notifications (member_id, created_at desc);

-- Real OS-level push notifications (Web Push API) — a member can have
-- multiple rows (one per device/browser they've enabled notifications on).
-- `endpoint` is unique because re-subscribing the same device/browser
-- produces the same endpoint URL; upserting on it avoids duplicate rows
-- instead of erroring. Dead subscriptions (member uninstalled, revoked
-- permission, cleared site data) are pruned automatically the next time a
-- send to them 404s/410s — see pushNotifications.ts.
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_member_id_idx on push_subscriptions (member_id);

-- ── WhatsApp ────────────────────────────────────────────────────────────

create table if not exists whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete set null,
  phone text not null,
  template text not null, -- 'otp' | 'fee_reminder' | 'birthday' | 'announcement' | 'welcome_card'
  status text not null default 'sent', -- 'sent' | 'failed'
  error text,
  created_at timestamptz not null default now()
);

-- ── Email (Resend) ──────────────────────────────────────────────────────
-- Same four categories as WhatsApp minus OTP — login stays WhatsApp-only.

create table if not exists email_messages (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete set null,
  email text not null,
  template text not null, -- 'welcome_card' | 'fee_reminder' | 'birthday' | 'announcement'
  status text not null default 'sent', -- 'sent' | 'failed'
  error text,
  created_at timestamptz not null default now()
);

-- ── Free trial (marketing site "2-Day Free Trial" claim) ───────────────
-- Separate from `members` entirely — a trial claim is a lead, not yet an
-- account. `phone unique` is what enforces "one trial per mobile number,
-- ever" at the database level (client-side localStorage is just a fast-path
-- UX hint, not the real guard).

create table if not exists trial_registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null unique,
  email text not null,
  shift text not null, -- 'morning' | 'evening'
  trial_code text not null,
  status text not null default 'active', -- 'active' | 'converted' | 'expired'
  starts_at date not null default current_date,
  ends_at date not null,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── Admin audit log ─────────────────────────────────────────────────────

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references admin_users(id) on delete set null,
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);
