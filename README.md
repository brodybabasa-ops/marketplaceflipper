# FlipFinder

Marketplace search for Facebook Marketplace categories — electronics, sneakers, tools, vehicles, and more. Find listings faster, score the spread, and click through to the original source.

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
| `npm run db:seed` | Seed users + mixed-category mock listings through the ingestion pipeline |
| `npm run ingest` | Re-run mock ingestion (pass a source, e.g. `npm run ingest bestbuy`) |

## Architecture

```
SOURCE → RAW LISTING → VALIDATION → NORMALIZATION → DEDUP → DEAL SCORE → DB → SEARCH API → UI
```

Sources live in `src/sources/`. The mock source is used until an authorized provider is connected. Facebook, KSL, Craigslist, and others can implement the same `MarketplaceSource` interface without changing the rest of the app.

Do not scrape, bypass authentication, CAPTCHA, rate limits, or private APIs.

### Arbitrage sources (Best Buy Open Box → eBay)

Some sources are **buy-side**: the listing price is a purchase price and profit is
measured against a resale estimate from another marketplace, not against sibling
listings. The first is **Best Buy Open Box** (`src/sources/bestbuy/`), scored
against **eBay sold comps** (`src/lib/arbitrage/resale.ts`).

- Best Buy exposes a self-serve **Buying Options (Open Box) API**. Set
  `BESTBUY_API_KEY` to pull live open-box offers; without it, deterministic mock
  offers are used so the board is fully functional.
- eBay sold comps come from the Marketplace Insights API (requires approval).
  Set `EBAY_OAUTH_TOKEN` and implement the call in `ebayResaleComp`; until then a
  deterministic mock provides comps.
- Net profit = resale median − eBay fees − shipping buffer − open-box price.
  Listings with too few sold comps are capped and never show fabricated market data.

Run it with `npm run ingest bestbuy` (or it's included in `npm run db:seed`).

## Product rules

- The original listing remains authoritative. FlipFinder shows deal stats; users click through to Facebook Marketplace to contact the seller.
- Missing listing fields stay `null`. Nothing is invented.
- Market price is shown only when there are enough comparables.
- Deal score is a relative attractiveness signal, not a guarantee.
