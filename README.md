# 🗺️ SwissDevMap

> An interactive map of the Swiss tech ecosystem — visualise which companies use which technologies, explore the developer landscape by city, and filter by commute time.

**🌐 Live: [www.swissdevmap.ch](https://www.swissdevmap.ch)** — try [Rust companies](https://www.swissdevmap.ch/?tag=Rust), [where Go is used](https://www.swissdevmap.ch/?heatmap=Go), or [Java in Zürich](https://www.swissdevmap.ch/tech/java/city/zurich).

---

## What is it?

SwissDevMap is a full-stack web application that plots Swiss tech companies on an interactive map and lets you explore the local developer ecosystem at a glance. Each company is tagged with the technologies it uses (React, Go, Kubernetes, AWS, …), and you can filter, search, and overlay a heatmap to answer questions like:

- *"Which companies in Zürich use Rust?"*
- *"How many firms within 30 minutes by public transport are hiring Python developers?"*
- *"Where is Go most popular in Switzerland?"*

![SwissDevMap showing 113 Java companies across Switzerland with a density heatmap](./docs/screenshot.jpg)

---

## Features

| Feature | Description |
|---|---|
| 🗺️ **Interactive map** | Company markers colour-coded by dominant tech category (frontend / backend / cloud / devops) |
| 🔥 **Heatmap overlay** | Visualise the geographic density of any technology or cloud provider |
| 🚌 **Commute filter** | Enter any Swiss address and filter companies reachable within a chosen travel time |
| 🔎 **Search** | Find a company, technology or city; `/` or `Ctrl/Cmd+K` focuses it |
| 🏷️ **Tech-stack filters** | One-click chips for every major tag across Frontend, Backend, Cloud, and DevOps |
| 🔗 **Shareable views** | Filters, heatmap and commute search live in the URL; Share and Copy link buttons; rich link previews |
| 🖼️ **Export image** | Download or share the current view as a 1200×630 image with legend and attribution |
| 📄 **Landing pages** | `/tech/rust`, `/city/zurich`, `/tech/rust/city/zug` — indexable pages answering "who uses X, where?" |
| 🏢 **Company-type filter** | Filter by Enterprise, Fintech, Consulting, E-Commerce, Industrial, etc. |
| ➕ **Add a company** | Submit missing companies via the in-app form |
| 🌙 **Dark / light mode** | Toggle between themes |
| 📱 **Responsive** | Full-screen map on desktop; collapsible bottom sheet on mobile |

---

## Try these views

Every view has a URL, so these open exactly what they describe:

| Question | Link |
|---|---|
| Which companies use Rust? | [`/?tag=Rust`](https://www.swissdevmap.ch/?tag=Rust) |
| Where is Go most popular? | [`/?heatmap=Go`](https://www.swissdevmap.ch/?heatmap=Go) |
| Fintech companies using Python | [`/?tag=Python&type=Fintech`](https://www.swissdevmap.ch/?tag=Python&type=Fintech) |
| Java companies in Zürich | [`/tech/java/city/zurich`](https://www.swissdevmap.ch/tech/java/city/zurich) |

The URL scheme is `?tag=…&type=…&heatmap=<tech>&from=<city>&min=<minutes>` (`tag` and `type` repeat).

---

## Tech Stack

### Frontend
| Tool | Purpose |
|---|---|
| [React 18](https://react.dev) + TypeScript | UI framework |
| [Vite 5](https://vitejs.dev) | Build tool & dev server |
| [Leaflet](https://leafletjs.com) + [react-leaflet](https://react-leaflet.js.org) | Interactive map rendering |
| [leaflet.heat](https://github.com/Leaflet/Leaflet.heat) | Heatmap layer |
| [Zustand](https://zustand-demo.pmnd.rs) | Global state management |
| [Axios](https://axios-http.com) | HTTP client |

### Backend
| Tool | Purpose |
|---|---|
| [Express](https://expressjs.com) + TypeScript | REST API |
| [node-postgres (`pg`)](https://node-postgres.com) | PostgreSQL client |
| [Playwright](https://playwright.dev) | Headless scraping |
| [Cheerio](https://cheerio.js.org) | HTML parsing |
| [node-cron](https://github.com/node-cron/node-cron) | Scheduled scraper jobs |

### Infrastructure
| Tool | Purpose |
|---|---|
| PostgreSQL 16 | Primary database |
| Docker / Docker Compose | Local database setup |
| npm workspaces | Monorepo tooling |

---

## Project Structure

```
swissdevmap/
├── backend/
│   └── src/
│       ├── db/
│       │   ├── schema.sql          # Table definitions (companies, tech_tags, job_postings)
│       │   ├── seed.ts             # Seed script — loads companies into Postgres
│       │   └── seed-data.example.ts  # Example company data format (copy → seed-data.ts)
│       ├── routes/
│       │   ├── companies.ts        # GET /api/companies  (filter by tag / type)
│       │   ├── heatmap.ts          # GET /api/heatmap    (GeoJSON points for a tech)
│       │   └── commute.ts          # POST /api/commute   (travel-time filtering)
│       ├── scrapers/
│       │   └── jobsch.ts           # Scraper for jobs.ch
│       └── index.ts                # Express app entry point
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Map.tsx             # Leaflet map, markers, heatmap layer
│       │   ├── Sidebar.tsx         # Filter panel (overlay on desktop, sheet on mobile)
│       │   ├── CommuteFilter.tsx   # Commute distance / time input
│       │   └── CompanyForm.tsx     # "Add missing company" form
│       ├── store/
│       │   └── mapStore.ts         # Zustand store (companies, filters, state)
│       ├── App.tsx
│       └── index.css               # Global styles & design tokens
├── docker-compose.yml              # Spins up a local Postgres instance
├── .env.example                    # Environment variable template
└── package.json                    # Root workspace (runs both apps concurrently)
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Docker** (for the local Postgres database)
- A free **Mapbox token** — get one at [account.mapbox.com](https://account.mapbox.com) *(used for geocoding in the commute filter)*

### 1 — Clone & install

```bash
git clone https://github.com/ameetmadan/swissdevmap.git
cd swissdevmap
npm install
```

### 2 — Configure environment variables

```bash
cp .env.example .env
```

Then open `.env` and fill in the required values:

```dotenv
# PostgreSQL connection string
DATABASE_URL=postgresql://swissdevmap:swissdevmap_secret@localhost:5432/swissdevmap

# Node environment
NODE_ENV=development

# Backend port
PORT=3001

# Mapbox token (for commute geocoding)
VITE_MAPBOX_TOKEN=pk.your_token_here

# Backend URL consumed by the frontend
VITE_API_URL=http://localhost:3001
```

### 3 — Start the database

```bash
docker compose up -d
```

This starts a Postgres 16 container, creates the `swissdevmap` database, and applies the schema automatically via the `schema.sql` init script.

### 4 — Seed the database

Copy the example seed file and add your companies:

```bash
cp backend/src/db/seed-data.example.ts backend/src/db/seed-data.ts
# Edit seed-data.ts with real company data
```

Then run the seed script:

```bash
npm run seed --workspace=backend
```

> **Note:** `seed-data.ts` is `.gitignore`d so your company list stays private.

### 5 — Start the development servers

```bash
npm run dev
```

This runs both the backend (`:3001`) and frontend (`:5173`) concurrently.

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## API Reference

### `GET /api/companies`

Returns an array of companies matching the given filters.

| Query param | Type | Description |
|---|---|---|
| `tag` | `string` (repeatable) | Filter by one or more tech tags, e.g. `?tag=React&tag=Go` |
| `type` | `string` (repeatable) | Filter by company type, e.g. `?type=Fintech` |

### `GET /api/companies/:ref`

Returns one company with its tags. `:ref` is either the company id (UUID) or its URL slug, e.g. `acme-ag-zurich`.

### `GET /api/stats`

Returns `{ companies, cities, technologies, last_updated }` for the "About this data" panel.

### `GET /api/heatmap?tech=<name>`

Returns a GeoJSON `FeatureCollection` of points, each with an `intensity` property, for rendering the heatmap layer.

### `POST /api/commute`

Accepts a start address and travel parameters, returns an array of company IDs reachable within the specified time.

### `POST /api/scrape/jobsch`

Triggers the Jobs.ch scraper.

### `GET /health`

Returns `{ status: 'ok', service: 'SwissDevMap API', timestamp }`.

---

## Data Model

```sql
-- Core tables (defined in backend/src/db/schema.sql)

companies (
  id          UUID PRIMARY KEY,
  name        TEXT,
  uid         TEXT,          -- Swiss company registration number (optional)
  website     TEXT,
  city        TEXT,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  type        TEXT           -- e.g. 'Enterprise', 'Fintech', 'Consulting'
)

tech_tags (
  id          UUID PRIMARY KEY,
  company_id  UUID REFERENCES companies(id),
  tag         TEXT,          -- e.g. 'React', 'Go', 'Kubernetes'
  category    TEXT,          -- 'frontend' | 'backend' | 'cloud' | 'devops'
  source      TEXT           -- 'seed' | 'scraper'
)

job_postings (
  id          UUID PRIMARY KEY,
  company_id  UUID REFERENCES companies(id),
  title       TEXT,
  url         TEXT,
  posted_at   TIMESTAMP
)
```

---

## Contributing

### Contributing data

The most useful contribution is better data.

- **Add a missing company:** use **+ Add Missing Company** in the sidebar at [www.swissdevmap.ch](https://www.swissdevmap.ch). It is published straight away and you get a link and a badge you can put on your site.
- **Fix a mistake:** every company page has **Suggest a correction**, which opens a prefilled GitHub issue.
- **Improve how technologies are detected:** the jobs.ch scraper in `backend/src/scrapers/` matches technology keywords in job postings, so richer keyword lists and new sources help directly.

### Contributing code

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Run the tests (`npm test --workspace=frontend`, `npm test --workspace=backend`)
4. Commit your changes and open a pull request

### Upgrading an existing database

Company slugs (`/company/acme-ag-zurich`) need a `slug` column. Fresh databases get it from `schema.sql`; for an existing one run this once, **before** deploying the new API (it is safe to rerun and never changes an existing slug):

```bash
npm run migrate:slugs --workspace=backend
```

---

## License

MIT
