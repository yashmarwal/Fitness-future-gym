# Fitness Future Gym

Gym website: public marketing pages, a member dashboard, an admin panel, and
the supporting attendance/fees/WhatsApp backend.

## Stack

Next.js (App Router) + TypeScript + Tailwind, Supabase (Postgres), direct
UPI for fee payments (no gateway/commission), WhatsApp Business Cloud API,
deployed on Vercel (with Vercel Cron for the daily birthday/fee-reminder
jobs).

## First-time setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier is enough
   to start), then run `src/backend/db/schema.sql` in its SQL editor to create
   all the tables.

3. **Copy `.env.example` to `.env.local`** and fill in the values — see the
   comments in that file for where each one comes from. At minimum, set
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SESSION_SECRET` to run
   the app locally. WhatsApp can stay blank while developing — see "Dev
   mode" below. `GYM_UPI_ID` needs the gym's real UPI handle before fee
   payment is real, but any placeholder works for testing the flow.

4. **Create your first admin login**:
   ```bash
   node scripts/seed-admin.mjs your-username your-password
   ```

5. **Run the dev server**:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` for the public site, `/admin/login` for the
   admin panel, `/login` for member sign-in, and `/signup` for a member to
   create their own account (no admin step needed — see below).

## Dev mode (no WhatsApp yet)

- **WhatsApp**: without `WHATSAPP_ACCESS_TOKEN`/`WHATSAPP_PHONE_NUMBER_ID` set,
  OTP codes are logged to the server console and also returned directly in
  the `/api/auth/request-otp` response (shown on the login screen) so you can
  test the full member login flow without a real WhatsApp account. Every
  send attempt is still logged to the `whatsapp_messages` table either way.
  If the member also has an email on file, the same code is sent by email
  too (see below) — WhatsApp is still required (it's the only channel every
  member is guaranteed to have), email is just a second copy of the code.
- **Email**: without `RESEND_API_KEY` set, emails are logged to the server
  console instead of sent, and still recorded in `email_messages`.

## Email (Resend) — second notification channel

Mirrors WhatsApp's scope, including OTP now: login/signup codes go out on
WhatsApp always, and by email too whenever the member has one on file
(email is a convenience copy, not a replacement — WhatsApp/phone is still
required to have an account at all). Email also covers the welcome
message, fee reminders, birthdays, and admin broadcasts (**Admin →
Broadcast** sends over both channels at once — whichever contact info
each member has on file). Content is composed directly in
`src/backend/services/email.ts` since Resend doesn't require Meta-style
pre-approved templates. Requires a verified sending domain in Resend (or
their `onboarding@resend.dev` test address, which can only send to your
own account email, not real members) — `RESEND_FROM_EMAIL` sets the
from-address.

## Fee payments (direct UPI, not a gateway)

The client asked to drop Razorpay to avoid its ~2% per-transaction fee. Fee
payment is a direct UPI transfer instead: the member dashboard shows a QR
code and a tappable `upi://pay` link (built from `GYM_UPI_ID` +
`GYM_UPI_PAYEE_NAME`) that opens their UPI app with the amount pre-filled —
a normal bank-to-bank transfer, no aggregator, no commission.

The tradeoff is there's no webhook to auto-confirm payment (that automation
is exactly what a gateway's fee pays for). Staff confirm it manually in
**Admin → Fees → Record Manual Payment** (method: UPI) once they see it land
in the gym's own bank/UPI app — same flow already used for cash payments.

## Member accounts

Members self-register at `/signup` (name, phone, optional DOB) — no admin
step required. Registration generates a membership number (`FF-1001`,
incrementing — "FF" fixed, the number variable) and sends a login OTP, the
same as `/login`. Once that first OTP is verified (i.e. the phone is
confirmed to actually belong to the signer-upper), the welcome/card message
with their membership number goes out over WhatsApp — deliberately *after*
verification, not at registration, so a mistyped number never receives
someone else's card. Admins see every member (self-registered or
admin-added) in **Admin → Members**, with full edit access to every field,
including membership number, plan, fee amount, fee due date, and joined
date.

WhatsApp only fires for five things, on purpose — **not** on every admin
edit or every payment recorded (that was tried and deliberately walked
back): login/signup OTP, the signup welcome/card message, fee-due
reminders (cron), birthday messages (cron), and admin-sent offers/gym
updates via the broadcast tool. Email mirrors that same list one-for-one,
sent additionally whenever the member has an email on file.

### Fee due-date logic

Paying late must not drift the billing cycle. If a member's fee is due on
the 1st and they pay on the 11th, the **next** due date is still calculated
from the 1st (their existing `fee_due_date`), not from the day they paid —
so it lands on the next 1st, not the 11th of the following month. The
member's `joined_at` is never touched by a payment. Admins can still
directly edit either date by hand in the member edit form when a real
exception is needed.

### Admin alerts

**Admin → Alerts** (and a summary strip on the Overview page) surfaces:
fee overdue, fee due within 3 days, inactive 4+ months (no check-in —
tracked via `members.last_checked_in_at`, which persists independently of
the attendance log's 2-month retention below), trial not converted (no
plan selected 2+ days after joining), and birthdays this week.

### Attendance retention

Individual check-in rows in `attendance` are deleted after 60 days by a
daily cron job (`/api/cron/attendance-cleanup`) — only the log entries, not
the member record itself, and not the `last_checked_in_at` marker alerts
rely on for long-term inactivity detection.

## Member dashboard extras

**Workout planner** (`/dashboard/plan`) — a real structured planner, not a
notes field: pick days, add real exercises (autocompleted from a bundled
~180-exercise list in `src/frontend/lib/exerciseLibrary.ts`) with target
sets/reps per day, save multiple named plans. That exercise list is bundled
rather than pulled from a live API on purpose — wger.de's public API was
tested and its search/filter query params don't actually filter server-side,
and the genuinely-free tier of ExerciseDB has largely moved to a commercial
platform; a static list keeps this working offline, instantly, and forever
with no new external account.

**Auto calorie lookup** (in the food log on `/dashboard/nutrition`) — type a
food name, pick a match, calories/protein/carbs/fat fill in automatically
(still editable before saving). Backed by USDA FoodData Central, which is
genuinely free forever and works out of the box with no signup (falls back
to USDA's shared `DEMO_KEY`) — see `USDA_FDC_API_KEY` in `.env.example` for
getting your own free key with a much higher rate limit.

## Project structure

The codebase is split into three top-level pieces under `src/`:

- **`src/app/`** — routing only. Next.js requires this exact folder (it can't
  be renamed or moved) since it's how the framework maps URLs to code. Page
  files here import from `frontend/`, and `api/*/route.ts` files import from
  `backend/` — this folder is the thin wiring layer between the two, not
  where logic lives.
  - `(marketing)/` — public pages (Home, About, Programs, Membership,
    Location, FAQ, Blog, Calculator), plus `/attendance` outside that group.
  - `dashboard/` — logged-in member area (membership card, attendance
    history, workouts, nutrition, rest timer, fees).
  - `admin/` — staff-only panel (members, attendance, fees, content,
    WhatsApp broadcast, QR code).
  - `api/` — HTTP endpoints; each is a thin wrapper around a function in
    `src/backend/services/`, never raw database calls inline.
- **`src/backend/`** — all backend logic: database access (`db/`), auth
  (`auth/`), and business rules (`services/`) — payments, WhatsApp, members,
  attendance, etc. Every file starts with `import "server-only"`, which fails
  the build if anything in `frontend/` ever imports it by mistake.
- **`src/frontend/`** — all UI: `components/` (receives data via props only,
  never queries the database) and `lib/` (pure client-safe helpers).
- **`src/types/`** — shared contracts (e.g. `AdminMember`, `FeePaymentRow`)
  that both `backend/` and `frontend/` import, so the UI never has to reach
  into `backend/` just to know a type's shape.

## Deploying

Push to a Git repo and import it in Vercel. Add every variable from
`.env.example` in the Vercel project's Environment Variables settings
(`CRON_SECRET` in particular — Vercel automatically sends it as a Bearer
token to the two `/api/cron/*` routes once it's set, per `vercel.json`).
