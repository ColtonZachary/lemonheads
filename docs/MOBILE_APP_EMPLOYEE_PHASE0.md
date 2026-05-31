# Mobile app — Employee Phase 0 (setup walkthrough)

This guide is for your **first time** running the Lemonheads **employee** app (detailers). Phase 0 gives you a working shell: sign in, weekly jobs, open address in Maps, and weekly pay — all tied to the same Supabase data as the website and managers hub.

The **website does not depend on the app**. The app reads the same database and calls small API routes on your Next.js site for pay math and job lists.

---

## What was added in the repo

| Path | Purpose |
|------|---------|
| `apps/mobile/` | Expo (React Native) app |
| `app/api/mobile/employee/*` | Authenticated API for detailers |
| `lib/mobile/require-employee-api.ts` | Validates detailer login on each API request |
| `docs/MOBILE_APP_EMPLOYEE_PHASE0.md` | This guide |

---

## Architecture (simple)

1. **Sign in** — Supabase Auth (same accounts as hub login).
2. **App checks** — You must be role `detailer` and linked to a `staff_members` row.
3. **Jobs & pay** — App calls your website at `EXPO_PUBLIC_API_URL` with the session token.
4. **Hub changes** — New packages, pay rates, or bookings show up on refresh (same DB).

---

## Prerequisites (one-time on your Mac)

### 1. Node.js

You already use Node for the website. Confirm:

```bash
node -v   # should be v20+ or v22+
npm -v
```

### 2. Expo Go on your phone (easiest for testing)

- **iPhone:** App Store → install **Expo Go**
- **Android:** Play Store → install **Expo Go**

You will scan a QR code from the terminal to open the app.

### 3. Xcode (optional, iOS Simulator)

Only if you want the simulator instead of a physical phone:

- Install **Xcode** from the Mac App Store
- Open Xcode once and accept the license

### 4. A detailer account in the hub

The employee app only works for **detailers** who can sign in at `/login` on the website.

1. In the hub, an admin invites the detailer (Hub access).
2. The detailer sets a password (invite email).
3. Their hub profile must be linked to **Staff** (`staff_members.profile_id`).

If sign-in works on the web hub calendar but the app says “not linked to staff”, fix the staff link in the hub.

---

## Step-by-step: run locally

### Step 1 — Install mobile dependencies

From the project root:

```bash
cd /Users/coltonzachary/Desktop/lemonheads-main/apps/mobile
npm install
```

### Step 2 — Create `apps/mobile/.env`

```bash
cp .env.example .env
```

Edit `apps/mobile/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_publishable_or_anon_key

# Where the Next.js site runs (see Step 3)
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Use the **same** Supabase URL and anon/publishable key as `.env.local` in the website root.

### Step 3 — Start the website (API server)

In a **second terminal**, from the project root:

```bash
cd /Users/coltonzachary/Desktop/lemonheads-main
npm run dev
```

Leave this running. The app calls:

- `GET /api/mobile/employee/me`
- `GET /api/mobile/employee/jobs?week=YYYY-MM-DD`
- `GET /api/mobile/employee/pay?week=YYYY-MM-DD`

### Step 4 — Start Expo

In the **first terminal** (or a third):

```bash
cd /Users/coltonzachary/Desktop/lemonheads-main
npm run mobile
```

Or:

```bash
cd apps/mobile
npm run start
```

You should see a QR code in the terminal.

### Step 5 — Open the app

**Physical phone (recommended first time)**

1. Phone and Mac must be on the **same Wi‑Fi**.
2. Find your Mac’s LAN IP: **System Settings → Network** (e.g. `192.168.1.42`).
3. Set in `apps/mobile/.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.42:3000
   ```
4. Restart Expo (`Ctrl+C`, then `npm run mobile` again).
5. Scan the QR code with the camera (iOS) or Expo Go (Android).

**iOS Simulator**

1. Press `i` in the Expo terminal.
2. Keep `EXPO_PUBLIC_API_URL=http://localhost:3000`.

### Step 6 — Sign in

Use the detailer’s **hub email and password**.

- **Jobs** tab — bookings assigned to that detailer for the selected week; tap a job for full detail.
- **Job detail** — field workflow (start → arrived → before photos → finished → after photos → checklist).
- **My pay** tab — estimated pay for the week (same logic as hub **My pay**).

---

## Detail workflow (detailers)

On a job, the yellow **Job workflow** card walks the detailer through the visit:

| Step | Detailer action | Customer alert |
|------|-----------------|----------------|
| 1 | **Start — on the way** | SMS when Twilio is configured (logs locally until then) |
| 2 | **I've arrived** | SMS |
| 3 | **Before photos** (camera) | — |
| 4 | **Finished — notify customer** | SMS (requires ≥1 before photo) |
| 5 | **After photos** (camera) | — |
| 6 | **Checklist** — all items required | — |

Managers see before/after photos on the booking in the hub. They edit checklist items at **Hub → Settings → Detail checklist**.

### Database migration (required once)

Apply in Supabase SQL editor (or CLI):

`supabase/migrations/20260606000000_booking_detail_workflow.sql`

Then reload PostgREST schema if needed:

```sql
NOTIFY pgrst, 'reload schema';
```

Without this migration, job detail may load but workflow actions will fail.

### SMS (optional)

Set Twilio env vars on the website (same as future marketing SMS). Until then, workflow still updates the booking and `lib/notifications/customer-sms.ts` logs intended messages.

---

## Troubleshooting

### “Project is incompatible with this version of Expo Go”

The App Store **Expo Go** app usually lags behind the newest Expo SDK. This repo’s mobile app targets **SDK 54** so it works with the store version.

If you still see this error:

1. Stop Expo in the terminal (**Ctrl+C**).
2. Reinstall mobile deps:
   ```bash
   cd apps/mobile
   rm -rf node_modules package-lock.json
   npm install
   ```
3. Start with a clean cache:
   ```bash
   npx expo start -c
   ```
4. Force-quit **Expo Go** on your phone and open it again, then rescan the QR code.
5. Confirm App Store **Expo Go** is updated (Settings → App Store → Updates).

**iOS Simulator (Mac):** Press `i` in the Expo terminal — the simulator installs the matching Expo Go automatically.

**Still stuck on a physical iPhone?** Expo SDK 56+ may not be on the App Store yet. This project is pinned to SDK 54 for that reason. Do not re-run `create-expo-app` without the `@sdk-54` template.

| Problem | Fix |
|---------|-----|
| “Supabase env vars missing” | Create `apps/mobile/.env` and restart Expo |
| “Network request failed” | Wrong `EXPO_PUBLIC_API_URL`; use LAN IP on a real phone |
| “This app is for detailers only” | Signed in as manager/admin; use a detailer account |
| “Not linked to a staff member” | Link `staff_members.profile_id` to their profile in hub |
| “Invalid session” | Sign out and sign in again |
| Jobs list empty | No bookings with their `detailer_name` that week in hub |
| Workflow button errors | Run the detail workflow migration (see above) |
| Start does nothing / no UI change | Website `.env` must include `SUPABASE_SERVICE_ROLE_KEY` (detailers cannot update bookings directly in Supabase). Restart `npm run dev` after adding it. |
| Camera denied | iOS Settings → Expo Go → Camera; or rebuild after `app.json` image-picker plugin |

---

## Phase 1 (later — not built yet)

- Customer login and full booking flow in the app
- ~~Push notifications for new assignments~~ **Done** — see [Push notifications](#push-notifications) below
- App Store / Play Store build with EAS
- Tighter RLS so detailers only read their own bookings in SQL (today the API filters by name)
- Custom SMS copy per workflow step

---

## Push notifications (detailers)

When a booking is assigned or reassigned to a detailer, the app can send a push alert if:

1. The detailer uses a **development build** of the app (not Expo Go — remote push was removed from Expo Go in SDK 53+).
2. They signed in on a **physical device** (not iOS Simulator).
3. They allowed notifications when prompted.
4. Their hub profile is linked to a `staff_members` row with `profile_id` set.

### Expo Go vs development build

| | Expo Go | Development build |
|---|---------|-------------------|
| Jobs, pay, workflow | Yes | Yes |
| Push notifications | **No** (SDK 53+) | **Yes** |
| How to run | `npm run mobile` → scan QR | One-time install, then `npm run mobile` |

Everything except push works in Expo Go. For job alerts you need a dev build once.

### One-time: install the dev app on your iPhone

**Prerequisites:** Xcode (Mac App Store), iPhone on same Wi‑Fi as your Mac, Apple ID (free tier is fine for personal testing).

```bash
cd apps/mobile
npx eas login          # create/login at expo.dev
npx eas init           # links project; writes projectId into app.json
npm run ios:device     # builds & installs "Lemonheads Employee" on your phone
```

First run takes several minutes (Xcode compile). When done, open **Lemonheads Employee** on your phone (not Expo Go).

Day-to-day after that:

```bash
# Terminal 1 — website API
npm run dev

# Terminal 2 — Metro for the dev app
npm run mobile
```

Open the **Lemonheads Employee** app on your phone (it connects to Metro automatically on the same Wi‑Fi). Set `EXPO_PUBLIC_API_URL` to your Mac’s LAN IP.

**Cloud build alternative** (no Xcode compile on your Mac):

```bash
cd apps/mobile
npm run build:dev:ios
```

Install from the link EAS prints when the build finishes.

### Database migration (required once)

Apply in Supabase SQL editor (or CLI):

`supabase/migrations/20260609000000_employee_push_tokens.sql`

Then reload PostgREST schema if needed:

```sql
NOTIFY pgrst, 'reload schema';
```

### How it works

| Step | What happens |
|------|----------------|
| Sign in | App requests notification permission and registers an Expo push token |
| Token saved | `POST /api/mobile/employee/push-token` stores the token for that profile |
| New booking | Website calls Expo push API when a job is assigned (online booking or hub create/update) |
| Tap alert | App opens the job detail screen |

Push events are logged in `notification_events` with channel `push` (same table as SMS).

### Testing push

1. Complete [One-time: install the dev app](#one-time-install-the-dev-app-on-your-iphone) above.
2. Run `npm run dev` and `npm run mobile`.
3. Sign in on your phone in **Lemonheads Employee** (not Expo Go). Allow notifications.
4. From the hub, create a booking assigned to that detailer — alert within a few seconds.

If no alert: confirm the migration ran, the detailer’s staff row has `profile_id` linked, and check hub/server logs for `[push]` or `[hub-booking] detailer push:` warnings. In Supabase, `employee_push_tokens` should have at least one row after sign-in.

Optional: set `EXPO_ACCESS_TOKEN` on the website for higher Expo push rate limits in production ([Expo access tokens](https://docs.expo.dev/push-notifications/sending-notifications/#additional-security)).

---

## Commands cheat sheet

```bash
# Website
npm run dev

# Mobile
npm run mobile

# Typecheck website only
npx tsc --noEmit
```

---

## Production note

For a real release, `EXPO_PUBLIC_API_URL` will be your live site, e.g. `https://lemonheadsdetail.com`. Deploy the website first; the app only needs the API routes on that domain.
