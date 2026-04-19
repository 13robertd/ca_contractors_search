# Plumbd — Contractor Search & Vetting (MVP)

A Next.js 15 + Tailwind + Supabase web app for searching licensed contractors
and checking their compliance signals at a glance. Built against your existing
`contractors` table in Supabase — no mock data, no extra tables.

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file
cp .env.local.example .env.local
# then fill in the two values (see below)

# 3. Run the dev server
npm run dev
# → http://localhost:3000
```

### Environment variables

Create a `.env.local` file in the project root with:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These are read by `lib/supabase.ts`. The `contractors` table is public-read via
RLS, so the anon key is all the app needs.

---

## File structure

```
contractor-search-app/
├── app/
│   ├── layout.tsx                         # App shell, header, footer, branding
│   ├── page.tsx                           # Homepage (hero + search)
│   ├── globals.css                        # Tailwind + design tokens
│   ├── search/
│   │   └── page.tsx                       # /search — results + filters
│   ├── contractor/
│   │   └── [license_number]/
│   │       ├── page.tsx                   # /contractor/:license — detail
│   │       └── not-found.tsx
│   └── saved/
│       └── page.tsx                       # /saved — localStorage shortlist
├── components/
│   ├── SearchBar.tsx
│   ├── ContractorCard.tsx
│   ├── FilterPanel.tsx
│   ├── StatusBadge.tsx
│   ├── TrustBadgeRow.tsx
│   ├── SaveContractorButton.tsx
│   └── ClassificationTags.tsx
├── lib/
│   ├── supabase.ts                        # Supabase client singleton
│   ├── queries.ts                         # ★ All Supabase queries live here
│   ├── formatters.ts                      # Date / phone / status formatting
│   └── savedContractors.ts                # localStorage helpers for /saved
├── types/
│   └── contractor.ts                      # Contractor TS interface
├── .env.local.example
├── tailwind.config.ts
├── tsconfig.json
├── next.config.mjs
└── package.json
```

### Where things live

| I want to change…                                 | Edit this file                                     |
| ------------------------------------------------- | -------------------------------------------------- |
| **Branding** (logo text, product name, nav)       | `app/layout.tsx`                                   |
| Hero copy / landing page                          | `app/page.tsx`                                     |
| Colors, fonts, design tokens                      | `tailwind.config.ts` + `app/globals.css`           |
| **Search queries / filter logic**                 | `lib/queries.ts`                                   |
| Typed contractor model                            | `types/contractor.ts`                              |
| Card UI                                           | `components/ContractorCard.tsx`                    |
| Filter panel options                              | `components/FilterPanel.tsx`                       |
| Trust badges shown on cards and detail page       | `components/TrustBadgeRow.tsx`                     |
| Detail page layout                                | `app/contractor/[license_number]/page.tsx`         |

---

## How search works

1. The homepage `SearchBar` pushes the user to `/search?location=…&trade=…`.
2. `app/search/page.tsx` is a **server component**. It reads the query params,
   calls `searchContractors(...)` from `lib/queries.ts`, and renders
   `<ContractorCard>` for each result.
3. `FilterPanel` is a client component that updates the URL when filters
   change — the server page re-runs the query on navigation.

The query (in `lib/queries.ts`) is intentionally simple:

- `location` → `city ILIKE %X%` OR `county ILIKE %X%`
- `trade` → `primary_trade ILIKE %X%` OR `search_blob ILIKE %X%` OR
  `classification_labels @> {X}`
- `activeOnly` (default **on**) → `is_active = true`
- `county`, `primaryTrade` → exact-match filters

Edit `lib/queries.ts` to tune ranking, add full-text search, switch to
trigram similarity, or introduce pagination later.

---

## Saved contractors

`/saved` is an MVP shortlist using `localStorage` only — no auth, no DB writes.
The key is `saved_contractors_v1`. See `lib/savedContractors.ts`. When users
save/unsave, a custom `saved-contractors-changed` event keeps the star icons
in sync within the tab.

When you add auth later, swap the `getSavedLicenses`, `saveContractor`, and
`unsaveContractor` implementations for a Supabase-backed `saved_contractors`
table — the UI won't need to change.

---

## Deploying to Vercel

### Option A — GitHub + Vercel Dashboard (recommended for teams)

1. Push this folder to a GitHub repo.
2. In Vercel → **New Project** → import the repo.
3. Framework preset: **Next.js** (auto-detected from `vercel.json`).
4. Add the two env vars under **Environment Variables** (set scope to
   Production + Preview + Development):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - (optional) `NEXT_PUBLIC_SITE_URL` — your custom domain, e.g.
     `https://trustbuild.com`. Used for OG/canonical URLs.
5. Deploy.

### Option B — Vercel CLI (fastest for solo dev)

The CLI is installed as a dev dependency, so no global install needed.

```bash
# First time only — link this folder to a Vercel project
npx vercel link

# Push your local .env.local values to Vercel (once)
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Deploy a preview (random URL, doesn't affect production)
npm run deploy:preview

# Deploy to production
npm run deploy:prod
```

Both `deploy:*` scripts run `scripts/check-env.mjs` first, which:

- Fails fast if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  are missing.
- **Refuses to deploy** if the anon key slot contains a `sb_secret_*` key —
  so you can't accidentally ship a service key to the browser.

There's also a thin bash wrapper that chains `check-env → next build → vercel`:

```bash
./scripts/deploy.sh          # preview
./scripts/deploy.sh --prod   # production
```

### After your first deploy — pull prod env vars back down

```bash
npm run env:push     # writes Vercel env vars into .env.local
```

### Region

`vercel.json` pins the runtime to `iad1` (US East — Washington DC) because
Supabase's default region is also US East, minimizing round-trip latency for
every search query. If your Supabase project is in a different region, change
the `regions` entry in `vercel.json` (e.g. `sfo1` for US West, `fra1` for
Frankfurt).

### What's optimized for Vercel

- **App Router** server components for `/search` and `/contractor/[license]`
  — Supabase calls run on Vercel's edge-adjacent servers, not in the browser.
- `/` and `/saved` are **statically prerendered** (zero compute per request).
- **`export const dynamic = "force-dynamic"`** on pages that need live data —
  flip to `export const revalidate = 60` in `app/search/page.tsx` or
  `app/contractor/[license_number]/page.tsx` if you want CDN-cached responses.
- **`metadataBase`** in `app/layout.tsx` auto-resolves to `VERCEL_URL` at
  build time, so OG tags and canonical URLs work on every preview deploy.
- **Security headers** (X-Frame-Options, nosniff, Referrer-Policy,
  Permissions-Policy) applied globally via `vercel.json`.
- **Tailwind** — the `content` glob in `tailwind.config.ts` is tight
  (`app/**` + `components/**`), so the production CSS is already ~7 kB
  gzipped. No changes needed.

### Deploy flow summary

```
  local .env.local
        │
        ▼
  npm run check-env    ←  validates Supabase vars
        │
        ▼
  next build            ←  catches type + build errors
        │
        ▼
  vercel / vercel --prod  ←  uploads to Vercel
        │
        ▼
  ✓ preview URL / production domain
```

---

## Intentionally out of scope (for now)

- Auth, accounts, saved search sync
- Maps / geocoding
- Reviews / ratings / messaging
- Admin tooling
- Full-text ranking (trigram on `search_blob` is already indexed and ready
  when you want it)
