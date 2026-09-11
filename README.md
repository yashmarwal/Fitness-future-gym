# Fitness Future Gym 2.0

Gym website: public marketing pages, a member dashboard, an admin panel, and
the supporting attendance/fees/WhatsApp backend.

## Stack

Next.js (App Router) + TypeScript + Tailwind, Supabase (Postgres), Razorpay,
WhatsApp Business Cloud API, deployed on Vercel (with Vercel Cron for the
daily birthday/fee-reminder jobs).

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
   the app locally. WhatsApp and Razorpay can stay blank while developing —
   see "Dev mode" below.

4. **Create your first admin login**:
   ```bash
   node scripts/seed-admin.mjs your-username your-password
   ```

5. **Run the dev server**:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` for the public site, `/admin/login` for the
   admin panel, and `/login` for the member dashboard (member login requires
   a member row with a matching `phone` in the `members` table — add one via
   the admin panel first).

## Dev mode (no WhatsApp/Razorpay yet)

- **WhatsApp**: without `WHATSAPP_ACCESS_TOKEN`/`WHATSAPP_PHONE_NUMBER_ID` set,
  OTP codes are logged to the server console and also returned directly in
  the `/api/auth/request-otp` response (shown on the login screen) so you can
  test the full member login flow without a real WhatsApp account. Every
  send attempt is still logged to the `whatsapp_messages` table either way.
- **Razorpay**: fee payments need real `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`
  to work — there's no dev-mode fallback for real money. The admin panel's
  "Fees" page can record cash/manual payments without Razorpay.

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
token to the two `/api/cron/*` routes once it's set, per `vercel.json`). Add
`https://yourdomain.com/api/fees/webhook` as a Razorpay webhook (subscribed
to `payment.captured`) once you have a domain.
