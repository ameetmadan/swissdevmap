# AGENTS.md

SwissDevMap: an interactive map of the Swiss tech ecosystem. npm workspaces: `backend/` (Express, PostgreSQL, scrapers) and `frontend/` (React, Vite, Vercel edge functions in `frontend/api/`). Read `docs/getting-started.md` and `docs/overview.md` first.

## Toolchain

- npm with the root `package-lock.json`; Node from `.nvmrc`; npm version in `packageManager`. Never switch package managers.

## Verify a change

```sh
npm ci
npm test --workspaces        # vitest in backend and frontend; no database needed
npm run build --workspaces   # backend `tsc`, frontend `tsc && vite build` (this is the typecheck)
```

CI (`ci.yml`) runs exactly these, and `audit.yml` runs `npm audit --omit=dev --audit-level=high`.

## Does not exist

- There is no lint script and no separate typecheck script: the builds typecheck. Do not claim lint passed.

## Never run as verification

- `backend` scripts `seed`, `migrate:slugs`, `migrate:tags` and `src/db/migrate-api-keys.ts` write to the database named by `DATABASE_URL`. The scrapers in `backend/src/scrapers/` hit live sites and write to the same database. `docker-compose.yml` starts a local Postgres; never point these at production.
- Real values live in untracked `.env` files; only `.env.example` is committed (GIT-003).

## Conventions

Standards live in `ameetmadan/standards`. PR titles and commits follow Conventional Commits; branches are `<type>/<short-description>` off `main`.
