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
-- Also run these three, for the water/meal-log/streak reminder toggles on
-- the dashboard (see reminders.ts) — default true, same as notify_workout
-- below: on unless a member turns it off, not opt-in. (If you already ran
-- this migration with the old `default false`, also run:
--   update members set notify_water = true, notify_meal_log = true, notify_streak = true;
-- to bring existing members up to the new default — a column default only
-- applies to rows inserted after it changes, not retroactively.)
--
--   alter table members add column if not exists notify_water boolean not null default true;
--   alter table members add column if not exists notify_meal_log boolean not null default true;
--   alter table members add column if not exists notify_streak boolean not null default true;
--
-- Also run this one, for the opt-in "Workout Prompt" push (a nudge to start
-- logging after a front-desk QR check-in — see workoutPrompt.ts). Without it
-- everything still works; the toggle just can't be switched on:
--
--   alter table members add column if not exists notify_workout boolean not null default true;
--
-- Also run this one, for the nightly "share your achievements" push (10 PM
-- IST, see reminders.ts's runShareReminderCheck) — default true, unlike
-- the water/meal/streak reminders above: this only ever reaches someone
-- who actually trained that day (see the cron's own "has logged a workout
-- today" check), so it's closer in spirit to notify_workout's "on unless
-- you turn it off" than to the opt-in health nudges:
--
--   alter table members add column if not exists notify_share_reminder boolean not null default true;
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
--
-- Also run this — the fitness-onboarding wizard's saved answers (height,
-- weight, age, gender, activity level, goal, experience, days/week; see
-- fitnessProfile.ts). One jsonb column rather than several scalar ones:
-- nothing ever filters members by an individual field in SQL, it's always
-- read and written as one unit, matching workout_plans.days' existing use
-- of jsonb for the same reason. Without this migration the wizard still
-- shows results (all computed client-side), it just can't save them.
--
--   alter table members add column if not exists fitness_profile jsonb;
--
-- Also run this — tracks whether a member has ever been shown the "leave
-- us a Google review" prompt (fires once, ever, right after a genuine 30+
-- day streak milestone — see attendance.ts::checkInMemberRow /
-- StreakMilestoneCelebration.tsx). Without this migration the app still
-- works exactly as before; the review ask just silently never fires
-- (isMissingColumnError falls back to the base check-in columns).
--
--   alter table members add column if not exists review_prompted_at timestamptz;
--
-- Also run this — the gym-closure calendar behind admin's "Mark Holiday"
-- button on the Broadcast page (see gymCalendar.ts). Each row is one closed
-- date; attendance check-in is blocked on it (attendance.ts) and it's
-- excluded from both the streak-gap calc and the 3-day inactivity
-- auto-block (admin/feeAbuse.ts), same as a Sunday. Without this migration
-- the "Mark Holiday" action fails with a clear error instead of silently
-- doing nothing — Sunday closures still work either way, since those are
-- pure day-of-week logic with no dependency on this table.
--
--   create table if not exists gym_holidays (
--     id uuid primary key default gen_random_uuid(),
--     holiday_date date not null unique,
--     reason text,
--     created_at timestamptz not null default now()
--   );
--
-- Also run this — the grace window after an unblock (see admin/feeAbuse.ts):
-- every automatic block rule (no check-in, never billed, fee overdue) leaves
-- a member alone for a few days after they were unblocked, and the
-- inactivity rule counts from this moment instead of a last check-in that
-- happened before they were locked out. Without it everything still works,
-- a just-unblocked member can just be re-blocked by the next daily cron.
--
--   alter table members add column if not exists unblocked_at timestamptz;
--
-- Also run this — the permanent "already had a free trial" record (see
-- trial.ts::claimTrial). trial_registrations itself is now purged 30 days
-- after creation (deleteOldTrialRegistrations, wired into the nightly
-- /api/cron/logs-cleanup run) to stop an old lead's full name/email/trial
-- code sitting in the database forever — but "one free trial per phone,
-- ever" still has to hold after that row is gone, so the phone number
-- (and nothing else) moves into this tiny table permanently instead.
--
--   create table if not exists trial_phone_claims (
--     phone text primary key,
--     claimed_at timestamptz not null default now()
--   );
--
-- Also run these — the Achievement Badges feature (see badges.ts). The two
-- new columns are permanent counters, same reasoning as current_streak_days
-- above: total_checkins can't be derived from the attendance log (purged
-- after 30 days) or playground_wins from playground_rooms (a room is
-- deleted outright once everyone's left it — see leaveRoom in
-- playground.ts), so both have to be incremented at the moment they happen
-- instead of ever being counted after the fact.
--
--   alter table members add column if not exists total_checkins integer not null default 0;
--   alter table members add column if not exists playground_wins integer not null default 0;
--
--   create table if not exists member_badges (
--     id uuid primary key default gen_random_uuid(),
--     member_id uuid not null references members(id) on delete cascade,
--     badge_id text not null,
--     earned_at timestamptz not null default now(),
--     unique (member_id, badge_id)
--   );
--   create index if not exists member_badges_member_id_idx on member_badges (member_id);

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
  -- Set by unblockMember; the automatic block rules measure their grace
  -- window from this — see the migration note near the top of this file.
  unblocked_at timestamptz,
  -- Internal, staff-only — never shown to the member. Edited from the
  -- admin member profile page (admin/members/[id]).
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
  -- Personal reminder toggles, shown on the dashboard (not a separate
  -- settings page) — each independently controls whether that member gets
  -- pinged by the matching cron (reminders.ts). All default true: on
  -- unless a member turns one off, same posture as fee/birthday/broadcast
  -- pushes (which don't need opt-in at all) rather than requiring every
  -- member to find Settings and switch each one on individually first.
  notify_water boolean not null default true,
  notify_meal_log boolean not null default true,
  notify_streak boolean not null default true,
  notify_workout boolean not null default true,
  notify_share_reminder boolean not null default true,
  -- The fitness-onboarding wizard's saved answers — see the migration note
  -- above and fitnessProfile.ts. Null until a member completes (or redoes)
  -- the wizard.
  fitness_profile jsonb,
  -- Set the one time a member is ever shown the "leave us a Google review"
  -- prompt — see the migration note above and attendance.ts. Null forever
  -- for a member who hasn't yet hit a 30+ day streak milestone.
  review_prompted_at timestamptz,
  -- Permanent counters behind the Achievement Badges feature (badges.ts) —
  -- see the migration note above for why these can't be derived from the
  -- attendance log or playground_rooms after the fact.
  total_checkins integer not null default 0,
  playground_wins integer not null default 0,
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

-- Admin-marked gym closures (see the migration note above and
-- gymCalendar.ts) — one row per closed calendar date, up to 5 at a time via
-- the Broadcast page's "Mark Holiday" action. Sundays are a standing
-- closure handled in code with no row needed here at all.
create table if not exists gym_holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null unique,
  reason text,
  created_at timestamptz not null default now()
);

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

-- Achievement Badges — one row per member per badge ever earned, never
-- removed. badge_id is a plain text key matching BADGES in
-- frontend/lib/badges.ts, not a foreign key to its own table — the catalog
-- is static app code, not data that needs its own table to be queried or
-- edited. unique(member_id, badge_id) is what makes awarding idempotent:
-- checkAndAwardBadges (badges.ts) re-evaluates every condition on every
-- call and just lets a duplicate insert fail silently on this constraint
-- rather than tracking "did I already check this one" separately.
create table if not exists member_badges (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null default now(),
  unique (member_id, badge_id)
);

create index if not exists member_badges_member_id_idx on member_badges (member_id);

-- Beast Mode: a guided, live progressive-overload session (setup → tap to
-- confirm each set → auto rest → summary). Each confirmed set is ALSO
-- logged through the normal workout_logs/PR/XP path (one POST
-- /api/dashboard/workouts call per set) — this table is only the
-- session-level record ("3 sets, 2 hit, 240kg total volume") used for
-- history and for deciding gym records below. Short-lived on purpose: kept
-- 7 days (see deleteOldBeastModeSessions), then purged, so storage never
-- grows unbounded from session history the same way workout_logs is purged
-- after 30 days.
create table if not exists beast_mode_sessions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  exercise_name text not null,
  rest_seconds integer not null,
  -- One entry per attempted set, in order: {plannedWeightKg, plannedReps,
  -- actualWeightKg, actualReps, hit}. Kept as the full breakdown for the
  -- session summary/history view; not queried by column.
  sets jsonb not null,
  sets_completed integer not null,
  sets_hit integer not null,
  total_volume_kg numeric(10, 2) not null default 0,
  completed_at timestamptz not null default now()
);

create index if not exists beast_mode_sessions_member_id_idx
  on beast_mode_sessions (member_id, completed_at desc);
create index if not exists beast_mode_sessions_completed_at_idx
  on beast_mode_sessions (completed_at);

-- Gym-wide — one row per exercise, holding whoever has lifted the heaviest
-- COMPLETED (target hit, not a target fail) weight for that exercise in
-- any Beast Mode session. Deliberately NOT derived from
-- beast_mode_sessions on read (purged after 7 days), so a record set today
-- is still on the board long after the session itself has aged out.
-- Unlike member_exercise_prs, this ISN'T kept forever: a record nobody
-- beats within 30 days clears (deleteStaleGymBeastModeRecords,
-- beastMode.ts), so the board turns over instead of one lift being
-- permanently unbeatable.
create table if not exists gym_beast_mode_records (
  id uuid primary key default gen_random_uuid(),
  exercise_key text not null unique,
  exercise_name text not null,
  member_id uuid not null references members(id) on delete cascade,
  weight_kg numeric(6, 2) not null,
  reps integer not null,
  achieved_at timestamptz not null default now()
);

-- Playground: opt-in 1v1/group challenges between members who are
-- currently checked in. A room is created by inviting other
-- playground-enabled, currently-checked-in members; once everyone invited
-- has responded, the room auto-starts and runs for its chosen duration.
-- The live leaderboard is computed on read from data that already exists
-- (workout_logs, member_muscle_xp) — a room never intercepts or
-- duplicates normal logging, it just measures the delta from when it
-- started. See playground.ts.
create table if not exists playground_rooms (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references members(id) on delete cascade,
  -- Member-chosen ("Friday Night Showdown") — required by createRoom
  -- (playground.ts), not enforced here at the column level (same
  -- convention as the other createRoom validations, e.g. exercise being
  -- required for common_exercise mode) since this table's "if not exists"
  -- migration path can't safely retrofit a not-null constraint onto rows
  -- that might already exist without one. displayName() still falls back
  -- to the mode/exercise label for any such row.
  name text,
  mode text not null check (mode in ('common_exercise', 'xp_race')),
  -- Only set (and only meaningful) for 'common_exercise' mode.
  exercise_name text,
  duration_minutes integer not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'ended')),
  started_at timestamptz,
  ends_at timestamptz,
  -- Set once, when the room's time runs out and the leaderboard is
  -- finalized (getRoom in playground.ts) — kept even after the fact so the
  -- /tv feed can show "X won a challenge" without recomputing the whole
  -- leaderboard from scratch.
  winner_member_id uuid references members(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists playground_rooms_status_idx on playground_rooms (status);

create table if not exists playground_room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references playground_rooms(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  status text not null default 'invited' check (status in ('invited', 'accepted', 'declined')),
  -- Total XP (summed across every muscle category) at the moment the room
  -- started — only meaningful for 'xp_race' mode, where the leaderboard
  -- ranks by how much each accepted member's total has grown SINCE this
  -- snapshot, not their all-time total.
  xp_snapshot integer,
  -- Same total, captured again the moment the room FINISHES (xp_race
  -- only). Without this, viewing an ended room later would keep showing a
  -- growing delta as the member's real total XP climbs from ordinary
  -- training that happened after the room closed — freezing xp_final at
  -- finalization is what makes the result actually final.
  xp_final integer,
  -- Set once this member explicitly leaves an ENDED room (leaveRoom,
  -- playground.ts) — once every accepted member has left, the whole room
  -- (this table's rows and the playground_rooms row) gets deleted outright.
  -- Playground deliberately doesn't keep a history: once nobody's left to
  -- look at the result, there's nothing to look at it for.
  left_at timestamptz,
  unique (room_id, member_id)
);

create index if not exists playground_room_members_member_id_idx
  on playground_room_members (member_id);

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

-- A named, reusable set of food_logs-shaped items (e.g. "My Usual
-- Breakfast") a member builds once from what they already logged today and
-- quick-adds on later days — see savedMeals.ts. `items` is read and written
-- as one unit, same reasoning as workout_plans.days' existing jsonb use:
-- there's no independent query need per item, so a child table would only
-- add a join for no benefit. `category` is a free-typed label
-- (Breakfast/Lunch/Dinner by default, or anything the member types under
-- "Custom") rather than an enum/lookup table — this app already favors a
-- flat string over a join table for this level of complexity (see
-- QuickActionCard's `category` eyebrow label).
create table if not exists saved_meals (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  name text not null,
  category text not null default 'Breakfast',
  items jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists saved_meals_member_id_idx on saved_meals (member_id);

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
  template text not null, -- 'otp' | 'fee_reminder' | 'fee_received' | 'birthday' | 'announcement' | 'welcome_card' | 'trial_pass' | 'trial_reminder' | 'account_blocked' | 'account_unblocked' | 'auto_reply_contact_info' (webhook auto-reply, see whatsappInbound.ts)
  status text not null default 'sent', -- 'sent' | 'failed' | 'dev_mode' (no WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID configured — nothing was actually sent, see whatsapp.ts)
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
  status text not null default 'sent', -- 'sent' | 'failed' | 'dev_mode' (no RESEND_API_KEY configured — nothing was actually sent, see email.ts)
  error text,
  created_at timestamptz not null default now()
);

-- ── Free trial (marketing site "2-Day Free Trial" claim) ───────────────
-- Separate from `members` entirely — a trial claim is a lead, not yet an
-- account. The full detail row is purged 30 days after creation
-- (deleteOldTrialRegistrations), so `phone unique` here only blocks a
-- second claim while the row is still live — trial_phone_claims below is
-- what actually enforces "one trial per mobile number, ever" past that
-- 30-day window.

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

-- Permanent record of "this phone number already had a free trial" — the
-- only thing that survives trial_registrations' 30-day purge. See the
-- schema migration note near the top of this file.
create table if not exists trial_phone_claims (
  phone text primary key,
  claimed_at timestamptz not null default now()
);

-- ── Admin audit log ─────────────────────────────────────────────────────

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references admin_users(id) on delete set null,
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);
