-- Fitness Future Gym — full schema
-- Run this in the Supabase SQL editor for your project.

create extension if not exists pgcrypto;

-- ── Members ─────────────────────────────────────────────────────────────

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  membership_number text not null unique,
  full_name text not null,
  phone text unique,
  email text,
  date_of_birth date,
  plan text,
  fee_amount numeric(10, 2),
  joined_at date not null default current_date,
  fee_due_date date,
  is_active boolean not null default true,
  is_frozen boolean not null default false,
  notes text,
  -- Persists independently of the attendance log's 2-month retention policy
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
