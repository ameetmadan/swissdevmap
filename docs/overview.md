---
docex.generated: true
last_updated: '2026-03-02T14:02:00.168Z'
scope: system
title: Overview
---
# Overview

## What Is swissdevmap?

**swissdevmap** is a web application that visualizes tech company locations and job market data across Switzerland on an interactive map. It aggregates company and job listing information, computes commute data, and renders geographic heatmaps to help developers explore the Swiss tech employment landscape.

## Architecture

The project follows a standard client-server architecture with two discrete packages managed together via `concurrently`:

```
swissdevmap/
├── backend/    # Node.js REST API + data pipeline
└── frontend/   # Browser-based map interface
```

### Backend

The backend is a Node.js/TypeScript HTTP server responsible for:

- **Data storage** — A PostgreSQL connection pool (`db/pool.ts`) provides access to persisted company and job data.
- **REST API** — Three route modules expose data to the frontend:
  - `routes/companies.ts` — serves company records
  - `routes/commute.ts` — computes or retrieves commute information
  - `routes/heatmap.ts` — provides aggregated geographic data for heatmap rendering
- **API key authentication** — The `middleware/apiKey.ts` middleware (`requireApiKey`) gates protected endpoints.
- **Data ingestion** — A scraper (`scrapers/jobsch.ts`) fetches job listings from jobs.ch. Supporting scripts handle database seeding (`db/seed.ts`), API key generation (`scripts/generate-api-key.ts`), and company website validation (`scripts/check-websites.ts`).

### Frontend

The frontend is a Vite-based single-page application that renders an interactive map using **Leaflet** with the `leaflet-heat` plugin for heatmap overlays. Application state — including company data and map UI state — is managed via a central store (`store/mapStore.ts`, built with a state management library such as Zustand based on the `useMapStore` hook pattern).

## Key Technologies

| Layer | Technology | Role |
|---|---|---|
| Frontend build | Vite | Dev server and production bundler |
| Map rendering | Leaflet + leaflet-heat | Interactive map and heatmap overlays |
| Frontend state | `useMapStore` (Zustand-style) | Shared map and company state |
| Backend runtime | Node.js + TypeScript | API server and scripting |
| Database | PostgreSQL | Persistent storage for companies and jobs |
| Data sourcing | Custom scraper (jobs.ch) | Job listing ingestion |
| Process management | `concurrently` | Runs frontend and backend in parallel during development |

## Data Flow

1. Job and company data is scraped from jobs.ch and seeded into PostgreSQL.
2. The backend API serves this data — with optional commute calculations — over authenticated HTTP endpoints.
3. The frontend fetches company and heatmap data, then renders it as interactive markers and heat overlays on a Leaflet map of Switzerland.
