# Managers Hub — Step-by-step setup guide

This is your checklist to go from “local booking site” to a **Managers Hub** on Vercel with Supabase Auth. Work through the steps in order. Stripe payments can wait (tables are stubbed).

**Decisions baked in:**
- One calendar for all cities (OKC, Tulsa, Enid together)
- All times shown and entered in **America/Chicago (Central)**
- Managers: full hub access, add/remove managers, cancel **and** delete bookings
- Detailers: **view-only** schedule (no edits)
- Promo / discount codes supported in schema (UI phases below)

---

## Phase 0 — Prerequisites

| Item | Status |
|------|--------|
| Supabase project (same one as bookings) | ☐ |
| `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, publishable key, `SUPABASE_SERVICE_ROLE_KEY` | ☐ |
| Bookings migration already run (`20260521000000_bookings.sql`) | ☐ |
| GitHub repo (optional; hub deploys to **Vercel**, not GitHub Pages) | ☐ |

GitHub Pages only serves the marketing site. The hub **requires** a Node host (Vercel recommended).

---

## Phase 1 — Run database migrations (Supabase SQL Editor)

Run each file under `supabase/migrations/` **in filename order** if you have not already:

1. `20260519000000_site_media.sql`
2. `20260520000000_drop_site_media_list_policy.sql` (security advisor fix)
3. `20260521000000_bookings.sql`
4. **`20260522000000_managers_hub.sql`** ← hub tables, RLS, audit, promos, rules

After running, confirm in **Table Editor** you see tables such as:
`profiles`, `staff_members`, `catalog_packages`, `promo_codes`, `blackout_dates`, `schedule_blocks`, `booking_audit_log`, `customers`, etc.

---

## Phase 2 — Seed catalog & staff (terminal)

From the project root (with `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`):

```bash
npm run hub:seed
```

This copies current `lib/data.ts` packages, add-ons, locations, and team into Supabase so the hub and (later) the public site can read from the database.

---

## Phase 3 — Enable Supabase Auth

1. Supabase Dashboard → **Authentication** → **Providers**
2. Enable **Email** (password sign-in)
3. **Authentication** → **URL configuration**
   - Site URL (local): `http://localhost:3000`
   - Redirect URLs: add `http://localhost:3000/auth/callback`
4. For production (after Vercel deploy), add:
   - Site URL: `https://your-app.vercel.app`
   - Redirect: `https://your-app.vercel.app/auth/callback`

Optional: disable public sign-ups under **Auth** → **Settings** → turn off “Allow new users to sign up” after managers exist, and invite only via dashboard.

---

## Phase 4 — Create the first admin (you)

1. **Authentication** → **Users** → **Add user**
   - Email: your work email
   - Password: strong password
   - Copy the user’s **UUID** (`id` column)

2. **SQL Editor** → run (replace placeholders):

```sql
insert into public.profiles (id, role, full_name, email, active)
values (
  'PASTE-AUTH-USER-UUID-HERE',
  'admin',
  'Your Name',
  'your@email.com',
  true
);
```

Roles:
- `admin` — can manage other managers
- `manager` — full hub except some admin-only actions (see app)
- `detailer` — view-only calendar & own row on schedule

3. Add Dave/Gunner as managers the same way (role `manager`), detailers as `detailer` if they need login.

Link detailer logins to staff rows (after seed):

```sql
update public.staff_members
set profile_id = 'DETAILER-AUTH-UUID'
where slug = 'colton';
```

---

## Phase 5 — Local env vars (detailed)

The hub, login, bookings, and seed script all read secrets from **one file** in your project root:

`/Users/coltonzachary/Desktop/lemonheads-main/.env.local`

(Your path may differ — it’s always next to `package.json`.)

That file is **gitignored** (never committed). If it doesn’t exist, copy the template:

```bash
cp .env.example .env.local
```

---

### 5a — Where to get each Supabase value

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Left sidebar → **Project Settings** (gear icon) → **API** (or **API Keys**).

| Variable in `.env.local` | What to copy | Safe in browser? |
|--------------------------|--------------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Project URL** — looks like `https://abcdefgh.supabase.co` | Yes (public) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Publishable key** (or legacy **anon** `eyJ...` key) | Yes (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** `secret` key — click **Reveal** | **No — server only** |

**Do not** put `service_role` in any variable that starts with `NEXT_PUBLIC_` — that would expose it to the website.

**Common mistake:** Using the **anon** key for `SUPABASE_SERVICE_ROLE_KEY`. Bookings and hub seed need **service_role**.

**Legacy names:** If you already use `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead of `PUBLISHABLE_KEY`, that still works for the public client. You still need `SUPABASE_SERVICE_ROLE_KEY` separately.

---

### 5b — Example `.env.local` (hub minimum)

Paste your real values (no quotes needed unless the value has spaces):

```bash
# ── Supabase (required for hub + bookings)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server-only — bookings insert, hub:seed, admin scripts
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── Optional: booking/contact emails (without these, bookings still save; emails log to terminal)
# RESEND_API_KEY=re_xxxx
# RESEND_FROM_EMAIL=Lemonhead's <onboarding@resend.dev>
# RESEND_TO_EMAIL=info@lemonheadsdetail.com

# ── Optional: Stripe (skip until you want card capture)
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
# STRIPE_SECRET_KEY=

# ── Optional: absolute links in emails later
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Save the file in Cursor/VS Code (**Cmd+S**).

---

### 5c — Edit the file in Cursor

1. In the file tree, open the project root `lemonheads-main`.
2. If you don’t see `.env.local`:
   - **Cmd+P** → type `.env.local` → Enter  
   - Or show hidden files in the explorer.
3. Paste/update the three Supabase lines above.
4. No spaces around `=` — good: `KEY=value` — bad: `KEY = value` (usually still works, but avoid).

---

### 5d — Restart the dev server (required)

Next.js only loads `.env.local` when the server **starts**.

1. In the terminal where `npm run dev` is running, press **Ctrl+C** to stop it.
2. Start again:

```bash
cd /Users/coltonzachary/Desktop/lemonheads-main
npm run dev
```

3. Confirm the terminal shows:

```text
- Environments: .env.local
```

If you see that line, the file was found.

---

### 5e — Quick verification checklist

| Check | How |
|-------|-----|
| URL loads | Open `http://localhost:3000` — homepage works |
| Supabase connected | Submit a test booking on `/book` → row appears in **Table Editor → bookings** |
| Hub login config | Open `http://localhost:3000/login` — page loads (not “Supabase is not configured”) |
| After Phase 4 profile | Sign in → redirects to `/hub` (not `?error=profile`) |

**If login says “Supabase is not configured”:** missing URL or publishable key, or dev server wasn’t restarted.

**If login works but hub says unauthorized / `?error=profile`:** Auth is fine; you still need the `profiles` row (Phase 4).

**If bookings don’t save:** missing or wrong `SUPABASE_SERVICE_ROLE_KEY`, or `bookings` migration not run.

---

### 5f — What each key is used for

| Feature | Keys needed |
|---------|-------------|
| Manager login (`/login`, `/hub`) | URL + publishable |
| Public gallery from Supabase | URL + publishable |
| Save web bookings to DB | **service_role** (server action) |
| `npm run hub:seed` | **service_role** |
| Email on booking submit | `RESEND_API_KEY` (optional) |
| Stripe card on booking | Stripe keys (optional, later) |

---

### 5g — Security reminders

- Never commit `.env.local` to GitHub.
- Never put `SUPABASE_SERVICE_ROLE_KEY` in Vercel’s “public” env vars — use **Sensitive** / server-only.
- Rotate keys in Supabase if you accidentally paste them in chat or commit them.

---

## Phase 6 — Test the hub locally

| URL | Who |
|-----|-----|
| `http://localhost:3000/login` | Sign in |
| `http://localhost:3000/hub` | Managers & admins (dashboard) |
| `http://localhost:3000/hub/calendar` | All roles — one calendar, Central time |
| `http://localhost:3000/hub/bookings` | Managers — list / cancel / delete |
| `http://localhost:3000/book` | Public booking (unchanged for now) |

**Detailer test:** sign in as a user with `profiles.role = 'detailer'`. You should see the calendar but not staff/settings/booking edit actions.

---

## Phase 7 — Deploy hub to Vercel (detailed)

The **Managers Hub** (`/login`, `/hub`) needs a Node server. **GitHub Pages cannot run it** — only static HTML. Deploy the full Next.js app to **Vercel** (free tier is fine).

You can keep **both** for a while:
- **GitHub Pages** — old static site at `https://coltonzachary.github.io/lemonheads/`
- **Vercel** — full app + hub at `https://lemonheads-xxxx.vercel.app` (or your custom domain later)

---

### 7a — Before you deploy (checklist)

| Step | Done? |
|------|-------|
| Phases 1–4: migrations, seed, Auth, your `profiles` admin row | ☐ |
| Phase 5–6: `.env.local` works; you can sign in at `localhost:3000/hub` | ☐ |
| Code pushed to GitHub (`ColtonZachary/lemonheads` or your repo) | ☐ |
| You know your Supabase **Project URL** and both API keys | ☐ |

You do **not** need Stripe on Vercel yet.

---

### 7b — Create / connect Vercel to GitHub

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub login is easiest).
2. Click **Add New…** → **Project**.
3. **Import** your `lemonheads` repository.
   - If you don’t see it: **Adjust GitHub App Permissions** and grant access to the repo.
4. On the import screen, confirm:

| Setting | Value |
|---------|--------|
| **Framework Preset** | Next.js (auto-detected) |
| **Root Directory** | `./` (repo root) |
| **Build Command** | `npm run build` (default — **not** `build:pages`) |
| **Output Directory** | leave default (Next.js handles this) |
| **Install Command** | `npm ci` or `npm install` (no quotes — `'npm ci'` makes Vercel fail with “command not found”) |

**Important:** Do **not** override the build to `npm run build:pages`. That command is only for GitHub Pages and **disables** the hub.

5. **Do not click Deploy yet** — add environment variables first (next section).

---

### 7c — Environment variables on Vercel

On the import screen (or later: **Project → Settings → Environment Variables**), add each variable below.

Apply to **Production** and **Preview** (so preview deployments work). **Development** is optional (Vercel CLI only).

| Name | Value | Sensitive? | Required for hub? |
|------|--------|------------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Same as `.env.local` | No | **Yes** |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable / anon key | No | **Yes** |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role secret | **Yes** | **Yes** (bookings save) |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (see below) | No | Recommended |
| `RESEND_API_KEY` | From Resend dashboard | Yes | Optional (emails) |
| `RESEND_FROM_EMAIL` | e.g. `Lemonhead's <onboarding@resend.dev>` | No | Optional |
| `RESEND_TO_EMAIL` | e.g. `info@lemonheadsdetail.com` | No | Optional |

**Do not add these on Vercel:**

| Name | Why |
|------|-----|
| `NEXT_PUBLIC_STATIC_EXPORT` | Would break server actions + hub |
| `NEXT_OUTPUT=export` | Static export only |
| `NEXT_PUBLIC_BASE_PATH=/lemonheads` | Only for GitHub Pages subpath |

**`NEXT_PUBLIC_APP_URL`:** After the first deploy you’ll get a URL like:

`https://lemonheads-abc123.vercel.app`

Use that exact URL (no trailing slash). You can update this later if you add a custom domain.

**Mark `SUPABASE_SERVICE_ROLE_KEY` as Sensitive** in Vercel so it’s never shown in logs UI.

---

### 7d — Deploy

1. Click **Deploy**.
2. Wait for the build log to finish (usually 1–3 minutes).
3. On success, click **Visit** to open the deployment.

If the build **fails**, open the log and look for:
- TypeScript errors
- Missing env at build time (Supabase public vars are sometimes needed for build — add them if the log asks)

---

### 7e — Update Supabase Auth for production URLs

Your production URL is different from `localhost`. Supabase must allow redirects to it.

1. Supabase Dashboard → **Authentication** → **URL configuration**.
2. Set **Site URL** to your Vercel URL, e.g.  
   `https://lemonheads-abc123.vercel.app`
3. Under **Redirect URLs**, **add** (keep localhost for dev):

```text
https://lemonheads-abc123.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

4. Save.

**Test production login:**

1. Open `https://YOUR-VERCEL-URL.vercel.app/login`
2. Sign in with the same email/password you created in Phase 4.
3. You should land on `https://YOUR-VERCEL-URL.vercel.app/hub`.

If you get `?error=profile`, the Auth user exists but `profiles` row is missing — run the Phase 4 SQL in Supabase (same project; profiles are not per-environment).

---

### 7f — Production smoke test

| URL | What to verify |
|-----|----------------|
| `/` | Marketing homepage loads |
| `/book` | Submit a test booking → row in **bookings** table |
| `/login` | Manager sign-in works |
| `/hub` | Dashboard (managers only) |
| `/hub/calendar` | Jobs show in **Central** time |
| `/hub/bookings` | List includes the test booking |

Delete test bookings in Supabase if you want a clean table.

---

### 7g — Custom domain (optional, later)

1. Vercel → **Project → Settings → Domains**.
2. Add e.g. `app.lemonheadsdetail.com` or your main domain.
3. Follow Vercel’s DNS instructions (CNAME / A record at your registrar).
4. Update Supabase **Site URL** and **Redirect URLs** to the new domain.
5. Update `NEXT_PUBLIC_APP_URL` in Vercel env vars → **Redeploy**.

---

### 7h — GitHub Pages vs Vercel (two-site strategy)

| Host | Command | Good for |
|------|---------|----------|
| **GitHub Actions** | `npm run build:pages` | Static marketing site only, no hub |
| **Vercel** | `npm run build` | **Hub**, bookings DB, login, server actions |

Until the public site reads all catalog from Supabase, you may run both:

- Customers find marketing site on GitHub Pages.
- Staff bookmark **Vercel URL** for `/hub`.

Long term: point your main domain to **Vercel** and retire GitHub Pages when ready.

---

### 7i — Redeploying after changes

| Change | What to do |
|--------|------------|
| Push new code to `main` on GitHub | Vercel auto-deploys (if connected) |
| Change env var in Vercel | **Settings → Environment Variables** → edit → **Redeploy** latest deployment |
| New Supabase keys | Update Vercel env → Redeploy |

**Deployments** tab shows every build; **Production** is what users hit on the main URL.

---

### 7j — Troubleshooting production

| Symptom | Likely fix |
|---------|------------|
| 404 on `/hub` | Wrong build command (`build:pages`); use `npm run build` |
| Login redirect loop | Supabase redirect URL missing Vercel `/auth/callback` |
| `?error=profile` | Add `profiles` row for that Auth user UUID |
| Bookings don’t save on Vercel | `SUPABASE_SERVICE_ROLE_KEY` missing or not redeployed after adding |
| Hub works locally, not on Vercel | Compare env vars line-by-line with `.env.local` |
| Times look wrong in Supabase | Table is UTC; hub UI is Central — expected |
| “Server action” errors in build log | Ensure `NEXT_PUBLIC_STATIC_EXPORT` is **not** set on Vercel |

---

### 7k — Security on Vercel

- Treat Vercel **Production** env like production secrets.
- Never enable **Expose to Browser** for `SUPABASE_SERVICE_ROLE_KEY`.
- Limit who has access to the Vercel team/project.
- Rotate Supabase service role if it was ever leaked.

---

## Phase 8 — What’s implemented vs coming next

### In this repo now (foundation)

- Database schema for catalog, staff, promos, rules, blocks, customers, audit, invoice stubs
- RLS: managers write, detailers read schedule, public still uses server role for web bookings
- `/login`, `/hub/*` shell, calendar (read), bookings list
- `/hub/bookings/[id]` — edit schedule/detailer/status/price, cancel, soft-delete, audit log
- Central time formatting helpers
- `npm run hub:seed` to populate catalog from `lib/data.ts`

### Build next (in order)

| # | Feature | Hub UI |
|---|---------|--------|
| 1 | ~~Booking edit + cancel/delete + audit log~~ | `/hub/bookings/[id]` ✅ |
| 2 | ~~Schedule blocks (PTO / block time)~~ | `/hub/blocks` ✅ |
| 3 | ~~Blackout dates & lead-time rules editor~~ | `/hub/settings/rules` ✅ |
| 4 | ~~Service-area ZIP/city validation (hub + public `/book`)~~ | `/hub/settings/coverage` ✅ |
| 5 | ~~Staff + hub access (managers) CRUD~~ | `/hub/staff`, `/hub/managers` ✅ |
| 6 | ~~Packages / add-ons / locations CRUD~~ | `/hub/catalog/*` ✅ |
| 7 | ~~Promo codes (hub CRUD + `/book` apply)~~ | `/hub/promos` ✅ |
| 8 | ~~Customer history by email/phone~~ | `/hub/customers` ✅ |
| 9 | Reports (revenue, utilization) | `/hub/reports` |
| 10 | Notifications queue (email now, SMS via Twilio later) | `/hub/settings/notifications` |
| 11 | Public `/book` reads Supabase catalog + rules | packages/add-ons/locations ✅ · scheduling rules TBD |
| 12 | Stripe invoices | after hub stable |

---

## Phase 9 — SMS notifications (later)

Schema includes `notification_events`. When ready:

1. Twilio account → phone number
2. Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` to Vercel
3. Wire a small server job or Supabase Edge Function to process the queue

Email notifications can use existing **Resend** on `booking.created` / `booking.updated`.

---

## Phase 10 — Stripe (later)

`invoices` table is ready with `stripe_payment_intent_id` nullable. When you want payments:

1. Stripe Dashboard → keys in Vercel env
2. Implement “Pay invoice” link from hub booking detail
3. Webhook route to mark invoice paid

No Stripe work is required to use the hub for scheduling and catalog.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| “Unauthorized” on `/hub` | User missing row in `profiles` or `active = false` |
| Detailer sees edit buttons | Role must be `detailer`, not `manager` |
| Times wrong in Supabase | Table stores UTC; hub shows Central — 2 PM Central = `19:00 UTC` in summer |
| Hub catalog change not on website | Package must be **Active**; redeploy Vercel (or hard-refresh locally). Site reads Supabase for packages/add-ons/locations. |
| RLS blocks hub write | Sign in with manager/admin; check policy in migration |

---

## Quick reference — manager capabilities (target)

- Employees: add / remove / deactivate; link to login
- Managers: add / remove / change role (admin only)
- Bookings: view, edit, **cancel**, **delete**, price override, assign detailer
- Calendar: one view, all cities; block time; blackout holidays
- Catalog: packages, add-ons, locations, promos
- Rules: lead time, capacity, service-area zips
- Customers: history by email/phone
- Reports: revenue & utilization
- Detailers: view-only schedule
- Stripe: later

When you finish a phase, tick migrations and auth steps above before moving on.
