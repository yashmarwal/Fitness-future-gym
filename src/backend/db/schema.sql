-- Fitness Future Gym — full schema
-- Run this in the Supabase SQL editor for your project.

create extension if not exists pgcrypto;

-- ── Members ─────────────────────────────────────────────────────────────

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  membership_number text not null unique,
  full_name text not null,
  phone text unique,
  date_of_birth date,
  plan text,
  fee_amount numeric(10, 2),
  joined_at date not null default current_date,
  fee_due_date date,
  is_active boolean not null default true,
  is_frozen boolean not null default false,
  notes text,
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

-- ── Content management ─────────────────────────────────────────────────

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  tag text,
  excerpt text,
  body text,
  is_published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ── WhatsApp ────────────────────────────────────────────────────────────

create table if not exists whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete set null,
  phone text not null,
  template text not null, -- 'otp' | 'fee_reminder' | 'birthday' | 'announcement'
  status text not null default 'sent', -- 'sent' | 'failed'
  error text,
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
