# Lotline

Vehicle marketplace search engine. Find listings faster than browsing Facebook Marketplace by hand — then click through to the original source to contact the seller.

Lotline is a search, filter, normalization, comparison, and alerting layer. It does not host transactions, message sellers, or replace the source marketplace.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma
- JWT cookie auth (swap-ready for Supabase later)
- Mock marketplace source for local development

## Local setup

```bash
cp .env.example .env
# DATABASE_URL should point at PostgreSQL
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo accounts (seeded):

- `demo@lotline.local` / `LotlineDemo!2026`
- `admin@lotline.local` / `LotlineDemo!2026`

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm test` | Unit tests (parser, query parsing, deal score) |
| `npm run build` | Production build |
| `npm run db:seed` | Seed users + 120 mock listings through the ingestion pipeline |
| `npm run ingest` | Re-run mock ingestion |

## Architecture

```
SOURCE → RAW LISTING → VALIDATION → NORMALIZATION → DEDUP → DEAL SCORE → DB → SEARCH API → UI
```

Sources live in `src/sources/`. The mock source is used until an authorized provider is connected. Facebook, KSL, Craigslist, and others can implement the same `MarketplaceSource` interface without changing the rest of the app.

Do not scrape, bypass authentication, CAPTCHA, rate limits, or private APIs.

## Product rules

- The original listing remains authoritative.
- Missing vehicle fields stay `null`. Nothing is invented.
- Market price is shown only when there are enough comparables.
- Deal score is a relative attractiveness signal, not a guarantee.
