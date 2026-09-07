-- Fitness Future Gym — core schema
-- Run this in the Supabase SQL editor for your project.

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  membership_number text not null unique,
  full_name text not null,
  phone text unique,
  date_of_birth date,
  plan text,
  joined_at date not null default current_date,
  fee_due_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  checked_in_at timestamptz not null default now()
);

create index if not exists attendance_member_id_checked_in_at_idx
  on attendance (member_id, checked_in_at desc);

create table if not exists login_otps (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists login_otps_phone_idx on login_otps (phone);
