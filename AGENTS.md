# AGENTS.md — How AI reviewers should work in this repo

> **TL;DR for agents:** This is a Next.js 15 App Router contractor-search MVP
> backed by a live Supabase `contractors` table. Data is public-read, no auth
> yet, no fake data, no extra tables. Focus your review on `lib/queries.ts`
> (search correctness + Postgres efficiency), the server/client split, and
> the Fixd design system in `tailwind.config.ts` + `app/globals.css`.

---

## Product

**Fixd** is a contractor search + vetting web app — think CSLB + BuildZoom
+ Yelp's local-search UX, minus reviews and auth. It queries a Supabase table
of licensed contractors and renders trust signals (active/expired, workers'
comp, bond, disciplinary history) at a glance.

Brand direction: **clear, fast, modern, utility-first, trustworthy.** Avoid
playful startup gimmicks, decorative gradients, or lifestyle/blog aesthetics.
Think Stripe / Linear / Notion — a serious consumer product.

## Tech stack

| Layer           | Choice                                             |
| --------------- | -------------------------------------------------- |
| Framework       | **Next.js 15** (App Router, server components)     |
| Language        | **TypeScript** (strict)                            |
| Styling         | **Tailwind CSS 3** (custom `brand` palette)        |
| Data            | **Supabase Postgres** via `@supabase/supabase-js`  |
| Deploy          | **Vercel** (region `sfo1`, see `vercel.json`)      |
| Persistence     | Server: Supabase · Client: `localStorage` (saved list only)|

## Routes

| Path                              | Type   | Notes                                |
| --------------------------------- | ------ | ------------------------------------ |
| `/`                               | static | Hero + `SearchBar`                   |
| `/search`                         | SSR    | Filters via URL params; calls `searchContractors()` |
| `/contractor/[license_number]`    | SSR    | `getContractorByLicense()`           |
| `/saved`                          | CSR    | Reads `localStorage` → posts to API  |
| `/api/contractors/by-licenses`    | Route Handler | Server-only Supabase call for `/saved` |

## Folder map

```
app/                         ← routes + layouts
  api/contractors/by-licenses/route.ts   ← POST { licenses: string[] }
  contractor/[license_number]/page.tsx   ← detail page (server component)
  saved/page.tsx                         ← client component (localStorage)
  search/page.tsx                        ← server component (2-column layout)
  layout.tsx                             ← Fixd header/footer, Inter font
  page.tsx, globals.css
components/                  ← reusable UI
  cards/ContractorCardBase.tsx   ← ⭐ THE contractor card (preview | detailed)
  home/                          ← homepage (CategoryStrip, HomePageClient, sections)
  search/                        ← /search (map + list + filters)
  ui/                            ← shared primitives (SearchPill, IconButton, PillButton…)
  TrustBadgeRow, SaveContractorButton, ClassificationTags, Skeleton, SiteHeader, SiteFooter
lib/
  supabase.ts                ← lazy anon-key Supabase client singleton
  queries.ts                 ← ⭐ ALL Supabase read queries live here
  formatters.ts              ← date/phone/status formatting
  savedContractors.ts        ← "use client" localStorage helpers
types/
  contractor.ts              ← `Contractor` interface (mirrors DB schema)
scripts/
  check-env.mjs              ← pre-deploy env validator
  deploy.sh                  ← check-env → next build → vercel
tailwind.config.ts           ← ⭐ design tokens (colors, type, radii, shadows)
app/globals.css              ← ⭐ centralized component utilities (btn/card/input/chip/badge/skeleton)
```

## Design system

The visual system lives in **two files**. Everything else composes these:

- **`tailwind.config.ts`** — color tokens (`ink`, `surface`, `line`, `fixd`,
  semantic `positive`/`warning`/`danger`), typography scale (`text-display`,
  `text-h1`…`text-h3`), radii, shadows, `max-w-page`.
- **`app/globals.css`** — `@layer components` utilities consumed as class
  names: `.page-container`, `.btn-primary/ghost/secondary/icon`,
  `.input` / `.select`, `.card` / `.card-interactive`, `.chip`,
  `.badge-positive/neutral/warning/danger`, `.skeleton`, `.map-placeholder`.

**Rule:** if you're about to write ad-hoc `bg-*`/`border-*` classes that
repeat, promote them into `globals.css` under `@layer components` instead.

## Environment variables

Only two — both **safe for the browser** (public-read RLS enforced at DB):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon OR publishable key>
```

`scripts/check-env.mjs` rejects `sb_secret_*` keys so the service-role key can
never ship to the client. **Do not add server-side secrets without also
removing the `NEXT_PUBLIC_` prefix.**

## Database contract (source of truth: `../schema.sql`)

- Table: `contractors`
- Primary key: `license_number` (text)
- Text array columns: `classification_codes`, `classification_labels`
- Booleans for trust signals: `is_active`, `has_workers_comp`,
  `has_contractor_bond`, `has_pending_suspension`,
  `has_disciplinary_history`, `expires_soon_90d`
- `search_blob` is **pre-lowercased** and contains business name, city, and
  trades — always prefer this for fuzzy text matches.
- Row-Level Security: anon can `SELECT`, nothing else. No writes from the app.

---

## ⭐ Where I want focused review

### 1. `lib/queries.ts` — search correctness & efficiency

This is the heart of the app. Please scrutinize:

- **`searchContractors`** — currently uses `.or()` with `ilike` on
  `primary_trade` + `search_blob` and `city`/`county`. Does the escaping in
  `escapeOrValue()` cover every PostgREST edge case a user could type?
  Consider `%`, `,`, `(`, `)`, `*`, `\`, unicode.
- **Ranking** — results are ordered by `years_in_business DESC NULLS LAST`.
  Is that the right default? A trigram similarity score would rank better but
  would require either an RPC or `.rpc()` call.
- **`getDistinctCounties` / `getDistinctPrimaryTrades`** — these currently
  select up to 10,000 rows and dedupe client-side (Supabase JS has no DISTINCT).
  At scale this is wasteful. The right fix is a Postgres view or RPC:
  ```sql
  create or replace function distinct_counties() returns setof text
    language sql stable as $$ select distinct county from contractors
    where county is not null order by 1 $$;
  ```
  Please suggest the migration if you touch this.
- **Pagination** — currently capped at `limit: 60`. No cursor/offset yet.
  If you add pagination, use keyset (last `license_number` + `years_in_business`)
  rather than offset for large result sets.

### 2. Server vs. client split

- `/saved` was deliberately moved off direct Supabase access into a Route
  Handler (`app/api/contractors/by-licenses/route.ts`) so the Supabase SDK
  never ships to the browser. **Do not** re-import `lib/queries.ts` into a
  `"use client"` file — it will silently re-bloat the bundle by ~60 kB.
- `SaveContractorButton` has a `mounted` guard to avoid hydration mismatch
  against `localStorage`. Preserve that pattern if you add more
  localStorage-derived UI.

### 3. Trust-signal semantics (`lib/formatters.ts`)

`statusKind()` is the single source of truth for the colored status pill. If
you change what "warning" vs "inactive" means, it ripples through
`TrustBadgeRow`, `ContractorCardBase`, and the detail page. Keep that mapping
consistent.

### 4. Hydration-sensitive areas

- `app/layout.tsx` — server component, no time-dependent dynamic content
  (copyright year was intentionally removed to avoid static-prerender drift).
- `SaveContractorButton.tsx` and `/saved` page — already guarded with
  `mounted` state / `useEffect`.

### 5. Security

- No server secrets; only the anon/publishable key is used.
- RLS does the real access control — verify any new query doesn't assume
  otherwise.
- Never log full rows; if you add logging, redact `phone` and `address`.

---

## Things intentionally out of scope (don't build these yet)

- Auth / accounts
- Reviews, ratings, messaging
- Maps / geocoding
- Admin dashboards
- Server-side full-text ranking (trigram GIN index exists on `search_blob`
  but isn't used yet — see review point 1)
- Server-side saved-list sync (the localStorage UI is intentionally an MVP
  stand-in; the helper functions in `lib/savedContractors.ts` are the swap
  point for a future `saved_contractors` table)

## Build / test / deploy

```bash
npm install
cp .env.local.example .env.local   # fill in real values
npm run check-env                  # validates env shape
npm run dev                        # http://localhost:3000
npm run build                      # prod build
npm run deploy:preview             # vercel preview
npm run deploy:prod                # vercel production
```

A clean `next build` producing 6 routes (1 API + 5 pages) with no warnings is
the deploy-readiness bar.

## If you suggest changes

- Prefer edits to `lib/queries.ts` over ad-hoc queries in pages. Keep all DB
  access centralized there.
- If adding a new table or column, update `../schema.sql` AND
  `types/contractor.ts` in the same PR.
- If your change affects bundle size, include a `next build` output snippet
  in the PR description showing the First Load JS delta.
