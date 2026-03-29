# Academic Job Search

Academic job search is a static Vue 3 + Vite application backed by a scheduled Playwright scraper.
The scraper collects job-like links from curated university and research career pages, enriches them
with source metadata, and writes a publishable `public/prebuilt_jobs.json` file. The frontend then
searches that static dataset without requiring a live backend.

## Architecture

- `scraper/` runs the Playwright scraper and writes the static payload.
- `shared/sourceCatalog.json` is the shared source metadata catalog used by both scraper and frontend.
- `public/prebuilt_jobs.json` is the deployable dataset consumed by the app.
- `src/` contains the Vue frontend, source-aware filters, saved searches, favorites, exports, and source dashboard.

## Frontend Features

- Keyword search with `any` or `all` matching
- Country, institution, and role-type filters
- Sorting by relevance, deadline, title, country, institution, or scrape recency
- Saved searches persisted in local storage
- Favorites persisted in local storage
- “New job” tracking based on previously seen results
- CSV and JSON export of the current result set
- Source catalog dashboard with per-source indexed counts

## Scraper Pipeline

1. `scraper/payload.json` defines the source pages and seed keywords.
2. `npm run generate:sources` rebuilds `shared/sourceCatalog.json`.
3. `npm --prefix scraper run scrape` crawls the source pages and writes `public/prebuilt_jobs.json`.
4. `npm run validate:data` validates the generated payload structure.

## Getting Started

### Frontend

```bash
npm install
npm run dev
```

### Scraper

```bash
cd scraper
npm install
npm run scrape
```

## Important Files

- `src/components/SearchJobs.vue`
- `src/components/Sources.vue`
- `src/utils/jobData.ts`
- `shared/sourceCatalog.json`
- `scraper/lib/scrape.js`
- `scraper/lib/normalize.js`

## Notes

- The project is intentionally a static-site architecture. There is no runtime API layer.
- Existing legacy `prebuilt_jobs.json` arrays are still supported by the frontend loader, but the scraper now emits a richer object payload with metadata and stats.
- Source metadata is no longer inferred in the UI from host suffixes alone.
