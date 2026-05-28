# Lemonhead's Mobile Detail

Marketing site and booking flow for [Lemonhead's Mobile Detail](https://www.lemonheadsdetail.com).

## Local development

```bash
npm install
cp .env.example .env.local   # add keys as needed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Mobile app (employee — Phase 0)

Expo app in `apps/mobile/`. First-time setup: **[docs/MOBILE_APP_EMPLOYEE_PHASE0.md](docs/MOBILE_APP_EMPLOYEE_PHASE0.md)**.

```bash
cp apps/mobile/.env.example apps/mobile/.env   # fill Supabase + API URL
npm run dev          # terminal 1 — website + mobile API
npm run mobile       # terminal 2 — Expo
```

## GitHub Pages (preview hosting)

The site exports as static HTML for **GitHub Pages** at:

**https://coltonzachary.github.io/lemonheads/**

### One-time GitHub setup

1. Push this repo to `git@github.com:ColtonZachary/lemonheads.git`
2. On GitHub: **Settings → Pages**
3. **Build and deployment → Source:** choose **GitHub Actions**
4. (Optional) Add repository secrets for Supabase images in CI:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Deploy

Every push to `main` runs `.github/workflows/github-pages.yml` and publishes the `out/` folder.

Manual build locally:

```bash
npm run build:pages
```

### GitHub Pages limitations

On Pages (static export), these use **mailto** fallbacks instead of server email:

- Booking form submit
- Contact form submit

**Stripe is optional** and not required for launch. Without Stripe keys in `.env.local`, the booking flow does not show a card section. When you add Stripe later (on Vercel), set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY`.

Full booking email + optional card save work on **Vercel** (or any Node host) using `npm run build` — not `build:pages`.

## Vercel (production later)

Use the normal Next.js build (not `build:pages`):

```bash
npm run build
```

Set environment variables from `.env.example` in the Vercel dashboard.

## Supabase media

```bash
npm run supabase:configure -- sb_publishable_YOUR_KEY
# Run SQL migrations in Supabase dashboard (SQL Editor → paste files under supabase/migrations/)
npm run supabase:upload
```

Public `site-media` files are served by URL only — do not add a broad `SELECT` policy on `storage.objects` (that lets anyone list the whole bucket). If the linter flags it, run `supabase/migrations/20260520000000_drop_site_media_list_policy.sql`.

### Bookings table

Run `supabase/migrations/20260521000000_bookings.sql` in the SQL Editor.

### Mobile app (employee — Phase 0)

Expo app under `apps/mobile/`. See **[docs/MOBILE_APP_EMPLOYEE_PHASE0.md](docs/MOBILE_APP_EMPLOYEE_PHASE0.md)** for first-time setup. Quick start: copy `apps/mobile/.env.example` → `.env`, run `npm run dev` in the repo root, then `npm run mobile`. Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` so the booking server action can insert rows (RLS blocks anonymous inserts). View data in **Table Editor → bookings**.

Bookings block overlapping times for the same detailer (`pending`, `confirmed`, `in_progress`). Auto-assign picks the first free detailer; named detailers show unavailable slots in the calendar UI.

Appointment times from the form are **America/Chicago** and stored as UTC in `starts_at` / `ends_at`. In Supabase Table Editor (UTC), 2:00 PM Central may show as 19:00 or 20:00 depending on daylight saving — that is expected.

## Managers Hub

Staff scheduling and catalog management live at `/hub` (Vercel — not GitHub Pages).

**Setup:** follow **[docs/MANAGERS_HUB_SETUP.md](docs/MANAGERS_HUB_SETUP.md)** step by step (migrations, Auth, first admin, `npm run hub:seed`, deploy).
