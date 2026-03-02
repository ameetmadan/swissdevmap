---
docex.generated: true
last_updated: '2026-03-02T14:02:00.184Z'
scope: module
title: src
---
# `src` Module Documentation

## Overview

The `src` module is the backend application for a job/company tracking platform. It is built with **Express** and **TypeScript**, and is responsible for:

- Serving a REST API for company data, heatmap visualizations, and commute information
- Authenticating API consumers via API keys
- Scraping job listings from external sources (jobs.ch)
- Managing database connectivity, seeding, and migrations

---

## Module Structure

```
src/
├── db/             # Database pool, migrations, and seed data
├── middleware/     # Express middleware (API key authentication)
├── routes/         # Express route handlers
├── scrapers/       # External data scrapers
├── scripts/        # Standalone utility scripts
└── index.ts        # Application entry point
```

---

## Entry Point

### `index.ts`

Bootstraps the Express application. Registers the following:

- **CORS** middleware
- **Routes**: `/companies`, `/heatmap`, `/commute`
- **API key middleware** for protected endpoints
- **Scraper initialization** (`scrapeJobsCh`) on startup

---

## Database (`db/`)

### `pool.ts`

Exports a default singleton `pg.Pool` instance used throughout the application for all database queries.

```ts
import pool from './db/pool';
```

Reads connection configuration from environment variables via `dotenv`. All route handlers and middleware import this pool directly.

### `seed.ts`

A standalone script that populates the database with initial company data. Reads from `seed-data.ts` (copied from `seed-data.example.ts`). Run directly with Node/ts-node — not imported by the application at runtime.

### `seed-data.example.ts` / `seed-data.ts`

Define the `Company` interface and a `companies` array used for seeding.

- `seed-data.example.ts` — safe-to-commit example dataset
- `seed-data.ts` — local/production dataset (likely gitignored)

```ts
interface Company {
  // company fields
}
const companies: Company[];
```

### `migrate-api-keys.ts`

A migration script that sets up API key storage in the database. Depends on `pool`. Run once as a migration — not part of the normal request lifecycle.

---

## Middleware (`middleware/`)

### `apiKey.ts`

**`requireApiKey(req, res, next): Promise<void>`**

Express middleware that validates incoming API keys against the database. Attach to any route that requires authentication.

```ts
import { requireApiKey } from './middleware/apiKey';

router.get('/protected', requireApiKey, handler);
```

Uses `crypto` for secure comparison and queries the database pool to verify key validity. Returns `401` if the key is missing or invalid.

---

## Routes (`routes/`)

All route files create an Express `Router` and query the database pool.

| File | Responsibility |
|---|---|
| `companies.ts` | CRUD or query endpoints for company records |
| `heatmap.ts` | Aggregated data endpoints for geographic heatmap rendering |
| `commute.ts` | Commute calculation endpoints; calls external APIs via `axios` |

---

## Scrapers (`scrapers/`)

### `jobsch.ts`

**`scrapeJobsCh(): void`**

Scrapes job listings from [jobs.ch](https://www.jobs.ch) using `axios` and `cheerio`, then persists results to the database via the pool. Called once at application startup from `index.ts`.

---

## Scripts (`scripts/`)

Standalone utility scripts — not imported by the application at runtime.

| Script | Purpose |
|---|---|
| `generate-api-key.ts` | Generates a new API key using `crypto` and inserts it into the database |
| `check-websites.ts` | Checks reachability of company websites via `axios` |

Run with ts-node:

```bash
npx ts-node src/scripts/generate-api-key.ts
npx ts-node src/scripts/check-websites.ts
```

---

## Dependencies & Relationships

```
index.ts
  ├── routes/* ──────────────────► db/pool
  ├── middleware/apiKey ──────────► db/pool
  └── scrapers/jobsch ────────────► db/pool

scripts/* ──────────────────────► db/pool
db/seed.ts ─────────────────────► db/seed-data.ts
db/migrate-api-keys.ts ─────────► db/pool
```

The `db/pool` module is the central dependency shared by all runtime and script components. All database access flows through this single pool instance.
