# Fitness Future Gym 2.0

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
   admin panel, and `/login` for the member dashboard (member login requires
   a member row with a matching `phone` in the `members` table — add one via
   the admin panel first).

## Dev mode (no WhatsApp yet)

- **WhatsApp**: without `WHATSAPP_ACCESS_TOKEN`/`WHATSAPP_PHONE_NUMBER_ID` set,
  OTP codes are logged to the server console and also returned directly in
  the `/api/auth/request-otp` response (shown on the login screen) so you can
  test the full member login flow without a real WhatsApp account. Every
  send attempt is still logged to the `whatsapp_messages` table either way.

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
