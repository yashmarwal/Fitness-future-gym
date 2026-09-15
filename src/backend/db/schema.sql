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

-- ── Members ─────────────────────────────────────────────────────────────

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  membership_number text not null unique,
  full_name text not null,
  phone text unique,
  email text unique,
  date_of_birth date,
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
  created_at timestamptz not null default now()
);

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
  created_at timestamptz not null default now()
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
