## RIMSS demo — Phase 0 scaffold

**Stack:** `apps/web` (Next.js 14) + `apps/api` (Express + Sequelize + PostgreSQL + Redis probe).

### Prereqs

- Node **20+**
- Docker Desktop (or compatible engine)

### 1. Env

Copy example env (**bash**): `cp .env.example .env` — **Windows CMD**: `copy .env.example .env`

(Edit if you change Compose ports.)

### 2. Data services

```bash
docker compose -f infra/docker-compose.yml --env-file .env up -d
```

PostgreSQL listens on **`localhost:5433`** (avoid clashing with a local Postgres on 5432). Redis on **`6380`**.

### 3. Install

From **`rimss-demo`** root:

```bash
npm install
```

### 4. Schema + seed

```bash
npm run db:migrate
npm run db:seed
```

### 5. Run dev (two terminals)

Terminal A — API:

```bash
npm run dev:api
```

Terminal B — web:

```bash
npm run dev:web
```

Open **http://localhost:3000** — SSR page pulls **`/health/ready`** from **`http://localhost:4000`**.

Expect JSON with `database: "up"` and `redis: "up"`.

### Troubleshooting

- **`redis: "down"`** — ensure Compose is up; `.env` `REDIS_URL` matches Compose port mapping.
- **DB connection errors** — wait for Postgres health (`docker compose ps`); rerun `npm run db:migrate`.
- **SKIP_REDIS=1** in `.env` makes readiness skip Redis check (offline API dev only).

### Next (Phase 1)

`GET /api/products/search`, listing + PDP wired to seeded `products` — see `docs/RIMSS_Demo_Build_Plan.md`.
