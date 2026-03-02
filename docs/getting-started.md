---
docex.generated: true
last_updated: '2026-03-02T14:02:00.179Z'
scope: manual
title: Getting Started
---
# Getting Started with swissdevmap

## Prerequisites

Before setting up swissdevmap, ensure you have the following installed:

- **Node.js** (v18 or later recommended)
- **npm** or a compatible package manager
- **PostgreSQL** — the backend uses a connection pool (`pg`) for all database operations

---

## Installation

Clone the repository and install dependencies for both the backend and frontend.

```bash
git clone <your-repo-url>
cd swissdevmap

# Install root-level dependencies (includes concurrently)
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

> The project uses [`concurrently`](https://www.npmjs.com/package/concurrently) to run the backend and frontend simultaneously from the root. Check the root `package.json` for the exact `dev` or `start` script.

---

## Basic Configuration

### Database

The backend connects to PostgreSQL via a connection pool defined in `backend/src/db/pool.ts`. Configure your database connection using environment variables. Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/swissdevmap
```

Adjust the values to match your local PostgreSQL setup.

### API Keys

The backend protects certain routes with API key middleware (`backend/src/middleware/apiKey.ts`). To generate an API key, run the provided script:

```bash
cd backend
npx ts-node src/scripts/generate-api-key.ts
```

Store the generated key securely — you will need it to authenticate requests to protected endpoints.

If you have existing API keys to migrate, use:

```bash
npx ts-node src/db/migrate-api-keys.ts
```

---

## Seeding the Database

An example seed data file is provided at `backend/src/db/seed-data.example.ts`. Copy it to create your own seed file:

```bash
cp backend/src/db/seed-data.example.ts backend/src/db/seed-data.ts
```

Edit `seed-data.ts` to populate the `companies` array with your data. Each entry follows the `Company` type exported from that file. Then run the seed script:

```bash
cd backend
npx ts-node src/db/seed.ts
```

---

## Running the Application

From the project root, start both the backend and frontend together:

```bash
npm run dev
```

This uses `concurrently` to launch both processes. If you prefer to run them separately:

```bash
# Terminal 1 — Backend
cd backend
npx ts-node src/index.ts

# Terminal 2 — Frontend
cd frontend
npm run dev
```

The frontend is built with Vite. By default it will be available at `http://localhost:5173` and the backend API at whichever port is configured in `backend/src/index.ts`.

---

## Minimal Working Example

Once everything is running:

1. **Seed the database** with at least one company entry (see above).
2. **Open the frontend** in your browser (`http://localhost:5173`).
3. The map will render company locations using Leaflet. The heatmap layer and commute overlays are driven by data fetched from the backend routes:
   - `GET /companies` — returns company location data
   - `GET /heatmap` — returns heatmap data points
   - `GET /commute` — returns commute-related data

Requests to protected routes require an `x-api-key` header:

```http
GET /heatmap
x-api-key: your-generated-api-key
```

---

## Common Next Steps

- **Add company data** — Populate `seed-data.ts` with real Swiss tech company entries and re-run the seed script.
- **Run the job scraper** — `backend/src/scrapers/jobsch.ts` exports a `scrapeJobsCh` function for pulling job listings. Integrate it into a scheduled task or run it manually.
- **Check company websites** — Use `backend/src/scripts/check-websites.ts` to validate that company URLs in your dataset are reachable.
- **Customize the map** — The frontend map state is managed via `useMapStore` in `frontend/src/store/mapStore.ts` (Zustand or similar). Extend the store to add filters, layers, or UI state.
- **Configure the frontend proxy** — Review `frontend/vite.config.ts` to ensure the dev server correctly proxies API requests to the backend.

---

<!-- docex:manual -->
(Add any custom notes here)
<!-- /docex:manual -->

<!-- docex:manual -->
