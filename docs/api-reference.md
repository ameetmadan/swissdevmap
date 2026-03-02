---
docex.generated: true
last_updated: '2026-03-02T14:02:00.187Z'
scope: exports
title: API Reference
---
# API Reference

## Database

### `pool`

**File:** `backend/src/db/pool.ts`

```ts
const pool: Pool
```

A shared PostgreSQL connection pool instance. Use this to execute queries against the database throughout the backend. Importing this singleton ensures all modules share the same pool rather than creating redundant connections.

**Usage:**

```ts
import pool from './db/pool';

const result = await pool.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
```

---

### `Company` (interface)

**File:** `backend/src/db/seed-data.ts`

```ts
interface Company
```

Describes the shape of a company record used in database seeding. Use this type when working with seed data entries to ensure type safety.

---

### `companies`

**File:** `backend/src/db/seed-data.ts`

```ts
const companies: Company[]
```

The production seed dataset — an array of `Company` objects used to populate the database with real company records. Use this when running the seed script against a live or staging environment.

---

### `Company` (interface) — Example

**File:** `backend/src/db/seed-data.example.ts`

```ts
interface Company
```

Mirrors the `Company` interface from `seed-data.ts`. Defines the structure of a company entry in the example seed file. Use this as a reference when creating custom seed data.

---

### `companies` — Example

**File:** `backend/src/db/seed-data.example.ts`

```ts
const companies: Company[]
```

An example seed dataset containing placeholder `Company` entries. Intended as a template for setting up a local development environment without exposing real data. Copy and modify this file to create your own seed data.

---

## Middleware

### `requireApiKey`

**File:** `backend/src/middleware/apiKey.ts`

```ts
function requireApiKey(req: Request, res: Response, next: NextFunction): Promise<void>
```

Express middleware that validates an API key on incoming requests. If the key is missing or invalid, the middleware rejects the request with a `401` HTTP error response and does not call `next`. If the key is valid, it calls `next()` to pass control to the next handler.

Apply this middleware to any route or router that should be protected.

**Usage:**

```ts
import { requireApiKey } from './middleware/apiKey';

router.get('/protected-endpoint', requireApiKey, (req, res) => {
  res.json({ data: 'secured' });
});
```

---

## Scrapers

### `scrapeJobsCh`

**File:** `backend/src/scrapers/jobsch.ts`

```ts
function scrapeJobsCh(): void
```

Triggers a scrape of job listings from jobs.ch. This function initiates the scraping process and does not return a value. Called once at application startup from `index.ts`. Invoke it on a schedule or manually to fetch and process the latest job postings from that source.

**Usage:**

```ts
import { scrapeJobsCh } from './scrapers/jobsch';

scrapeJobsCh();
```

---

## Frontend Store

### `Company` (interface)

**File:** `frontend/src/store/mapStore.ts`

```ts
interface Company
```

Defines the shape of a company object as used in the frontend map store. Use this type when reading company data from `useMapStore` or when passing company objects to map-related components.

---

### `MapState` (interface)

**File:** `frontend/src/store/mapStore.ts`

```ts
interface MapState
```

Describes the complete state shape managed by the map store. Includes all properties and actions available via `useMapStore`. Reference this interface when typing selectors or extending store functionality.

---

### `useMapStore`

**File:** `frontend/src/store/mapStore.ts`

```ts
const useMapStore: UseBoundStore<StoreApi<MapState>>
```

A [Zustand](https://github.com/pmndrs/zustand) store hook that provides access to the map state and its associated actions. Use this hook in React components to read or update map-related state such as company locations and selection state.

**Usage:**

```ts
import { useMapStore } from '../store/mapStore';

function MapComponent() {
  const companies = useMapStore((state) => state.companies);

  return <Map data={companies} />;
}
```
