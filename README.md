# NBCC Membership Portal

Membership portal for the **Nigerian-British Chamber of Commerce**, built by **Zypa Tech Limited**.
Members apply, pay and renew, download receipts and use the member directory.
Chamber staff approve applications, manage members, send announcements and track renewals from a separate admin subdomain.

This is the demo build and the foundation of the Phase 1 product. Demo-only behaviour sits behind `DEMO_MODE`.

## Stack

Next.js 15 (App Router, TypeScript strict) · Tailwind CSS + shadcn/ui · Supabase (Postgres, Auth, Storage) · Prisma ·
Zod + React Hook Form · Paystack · Resend + React Email · @react-pdf/renderer · Recharts · Vercel.

## Quick start (local)

```bash
pnpm install
cp .env.example .env        # then fill in the values (see "Environment" below)
pnpm db:deploy              # apply migrations
pnpm db:seed                # tiers, sectors, demo members and demo logins
pnpm dev
```

- Member portal: http://localhost:3000
- Admin portal: http://admin.localhost:3000 (`*.localhost` resolves to your machine in modern browsers)

Demo logins (when `DEMO_MODE=true`): `admin@demo.nbcc.test` (super admin), `staff@demo.nbcc.test` (staff),
`member@demo.nbcc.test` (active member). Password: the value of `DEMO_PASSWORD`. The sign-in pages have quick-fill buttons.

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Run the app locally |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm lint` · `pnpm typecheck` | ESLint · TypeScript |
| `pnpm db:migrate` | Create a new migration from `prisma/schema.prisma` (development) |
| `pnpm db:deploy` | Apply migrations (production and CI) |
| `pnpm db:seed` | Seed tiers/sectors, plus demo data if the database is empty |
| `pnpm db:reset-demo` | Wipe and rebuild all demo data (keeps staff accounts) |
| `pnpm db:studio` | Prisma Studio |
| `pnpm test:e2e` | Playwright smoke test (register → approve → pay → receipt) |

## Setup

### 1. Supabase

1. Create a project at supabase.com (choose a region close to Nigeria or the UK, e.g. London, `eu-west-2`).
2. **Project Settings → API**: copy the URL, the `anon` key and the `service_role` key into `.env`.
3. **Project Settings → Database → Connection string**:
   - `DATABASE_URL`: the **pooled** connection (Supavisor, transaction mode, port 6543), with `?pgbouncer=true&connection_limit=1`.
   - `DIRECT_URL`: the **direct/session** connection (port 5432), used for migrations.
4. **Authentication → Providers → Email**: keep email sign-in enabled and **Confirm email** on.
   The portal sends its own branded verification and reset emails, so Supabase's built-in templates are not used.
5. **Authentication → URL Configuration**: Site URL = your main domain. Add both domains to the redirect allow-list:
   `https://portal.example.org/**` and `https://admin.portal.example.org/**` (plus the `localhost` ones for development).
6. **Storage**: `pnpm db:seed` creates the buckets automatically:
   - `member-documents`: private, 5 MB limit, PDF/JPG/PNG (CAC certificates, company profiles; viewed through short-lived signed URLs)
   - `member-logos`: public, 2 MB limit, PNG/JPG/WEBP
7. Run `pnpm db:deploy && pnpm db:seed`.

> The app reads data only through Prisma on the server, and reaches storage through the service-role key after permission checks.
> The migration `20261112000100_enable_rls` turns on row-level security (with no policies) for every table, so the public
> `anon` key cannot read anything through the Supabase REST API. **When you add a table, enable RLS on it in the same migration.**

### 2. Paystack (test mode)

1. Dashboard → **Settings → API Keys & Webhooks**: copy the **test** secret and public keys into `.env`.
2. Set the **test webhook URL** to `https://<main-domain>/api/webhooks/paystack`.
3. Test card: `4084 0840 8408 4081`, any future expiry, CVV `408`, PIN `0000`, OTP `123456`.

Payments are verified twice: on the callback page and through the signed webhook (HMAC-SHA512 of the raw body).
Both paths use one idempotent function keyed by the payment reference, so a payment is never applied twice.

### 3. Resend (email)

1. Verify your sending domain in Resend and create an API key.
2. Set `RESEND_API_KEY` and `EMAIL_FROM` (an address on the verified domain).
3. Set `ADMIN_ALERT_EMAILS` (comma-separated) for "new application" alerts.

Without `RESEND_API_KEY`, emails are printed to the server console. This is handy locally and in demos.

### 4. Vercel

1. Import the repository. Framework preset: Next.js. Install command `pnpm install`. Build command `pnpm build`.
2. Add **every variable from `.env.example`** under Project → Settings → Environment Variables
   (set `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_ADMIN_URL` to the real domains).
3. **Domains**: add the main domain (e.g. `portal.nbcc.org.ng`) **and** the admin subdomain (`admin.portal.nbcc.org.ng`)
   to the same project. Middleware rewrites the admin subdomain to the `/admin` routes. `/admin` on the main domain
   redirects to the admin subdomain.
4. **Cron**: `vercel.json` schedules `/api/cron/renewal-reminders` daily at 08:00 UTC (09:00 Lagos). Set `CRON_SECRET`;
   Vercel sends it as `Authorization: Bearer …` automatically.
5. Run migrations against production before (or as part of) the first deploy: `pnpm db:deploy`.

### Going live (Phase 1 checklist)

- `DEMO_MODE=false` removes the banner, demo logins, "Verify now (demo)" and "Reset demo data".
- Replace the Paystack test keys with live keys and set the live webhook URL.
- Replace the demo tier fees in **Admin → Settings**.
- Invite real staff from **Admin → Settings → Staff accounts**, then disable the demo accounts.
- Do not run `pnpm db:reset-demo` against production.

## Architecture

```
src/
  app/
    (public)/            landing, login, register, forgot/reset password
    (member)/member/     member area (dashboard, payments, directory, announcements, profile)
    (admin)/admin/       admin area, served on admin.<domain> via middleware rewrite
    api/                 Paystack webhook, PDF receipts, CSV export, renewal cron
    auth/confirm/        email verification / password reset / invite links
  modules/<feature>/     actions.ts (server actions), queries.ts, schemas.ts (Zod), components/
                         auth, members, payments, renewals, announcements, directory, settings, demo
  lib/                   db, supabase clients, rbac + roles, paystack, email, money, dates, audit, counters, env, config
  emails/                React Email templates
  middleware.ts          session refresh, admin-subdomain routing, role gates
prisma/                  schema, migrations, seed entry point
e2e/                     Playwright smoke test
```

Key rules (full list in `CLAUDE.md`):

- **Security**: every server action validates with Zod and checks the role server-side (`assertPermission`).
  Middleware is the first gate, not the only one. Roles: `SUPER_ADMIN`, `ADMIN`, `STAFF`, `MEMBER`.
- **Money**: integers in minor units (kobo) plus a currency, formatted only through `formatMoney()`.
- **Audit**: approvals, rejections, status/tier changes, payments, reminders, settings and exports write to `AuditLog`.
- **Numbering**: membership numbers (`NBCC-2026-0001`) and receipts (`NBCC-RCT-2026-000001`) come from a locked
  counter row in the same transaction, so they are sequential with no duplicates.
- **Mobile-first**: tables become cards below `md`, 44px tap targets through tablet widths, 16px inputs, `100dvh`, safe areas, PWA.
- **Future phases**: LMS (Phase 2) and AI (Phase 3) slot in as new `src/modules/*` folders and route groups.

### Membership lifecycle

`PENDING_VERIFICATION` (applied) → email confirmed → `PENDING_APPROVAL` → admin approves (membership number issued) →
`INACTIVE` (approved, first fee unpaid) → payment → `ACTIVE` for 12 months → daily job: `INACTIVE` when expired →
`ARCHIVED` after 12 months unpaid. Admins can also reject (`REJECTED`, reason emailed) or blacklist (`BLACKLISTED`, reason required).
Renewing early extends from the current expiry date, so members never lose paid days (`RENEWAL_EXTENDS_FROM_EXPIRY` in `src/lib/config.ts`).

## Testing

`pnpm test:e2e` runs `e2e/smoke.spec.ts` against `pnpm dev` on port 3200 with Paystack mocked (`PAYSTACK_MOCK=true`,
which is ignored in production builds). It needs real Supabase keys, a seeded database and `DEMO_PASSWORD` in `.env`.
Install the browser once with `pnpm exec playwright install chromium`. Without Supabase keys the test is skipped.

## Known limitations / TODO

- Signed-upload URLs for applications are not rate-limited, and abandoned `pending/` uploads are not cleaned up yet.
- Announcements and reminders are sent in-request in small batches. Move them to a queue (or Resend batch API) for thousands of members.
- Revenue figures are NGN only; the schema already supports GBP.
- Admin 2FA: `User.mfaRequired` exists. Enforce it with Supabase MFA (TOTP) in the admin layout when required.
- Members cannot change their login email or logo themselves yet (admin request).
