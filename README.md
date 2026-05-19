# Lemonhead's Mobile Detail

Marketing site and booking flow for [Lemonhead's Mobile Detail](https://www.lemonheadsdetail.com).

## Local development

```bash
npm install
cp .env.example .env.local   # add keys as needed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

On Pages (static export), these use **mailto** fallbacks instead of server email/Stripe:

- Booking form submit
- Contact form submit
- Saving a card on file

Full booking email + Stripe work on **Vercel** (or any Node host) using `npm run build` without `build:pages`.

## Vercel (production later)

Use the normal Next.js build (not `build:pages`):

```bash
npm run build
```

Set environment variables from `.env.example` in the Vercel dashboard.

## Supabase media

```bash
npm run supabase:configure -- sb_publishable_YOUR_KEY
# Run SQL migration in Supabase dashboard once
npm run supabase:upload
```
