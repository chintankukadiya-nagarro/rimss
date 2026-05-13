## RIMSS demo — storefront stack

**Stack:** `apps/web` (Next.js 14) + `apps/api` (Express + Sequelize + PostgreSQL + Redis) + checkout (Phase 3) + **OfferZone static JSON** (Phase 4).

### Prereqs

- Node **20+**
- Docker Desktop (or compatible engine)

### 1. Env

Copy example env (**bash**): `cp .env.example .env` — **Windows CMD**: `copy .env.example .env`

(Edit if you change Compose ports.) For **checkout with Stripe**, see **Payment (Phase 3)** in `.env.example` and fill test keys and webhook secret.

### 2. Data services

```bash
docker compose -f infra/docker-compose.yml --env-file .env up -d
```

PostgreSQL listens on **`localhost:5433`** (avoid clashing with a local Postgres on 5432). Redis on **`6380`**.

### 3. Install

From the repo root:

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

Open **http://localhost:3000** — SSR page pulls **`/health/ready`** from **`http://localhost:4000`** (unless overridden).

Expect JSON with `database: "up"` and `redis: "up"`.

### Phase 3 — Checkout (mock or Stripe)

Default **`PAYMENT_PROVIDER=mock`** (no Stripe account needed):

1. Add items to cart → **Checkout** → **Continue to payment** → **Complete payment (mock)** → order confirmation at **`/order/:id`**.

**Stripe test mode:**

1. Set `PAYMENT_PROVIDER=stripe` and add `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET` to `.env`.
2. Forward webhooks to the API (replace port if needed):

   ```bash
   stripe listen --forward-to localhost:4000/api/webhooks/stripe
   ```

   Paste the CLI’s **signing secret** as `STRIPE_WEBHOOK_SECRET`.
3. Ensure **`STRIPE_PUBLISHABLE_KEY`** is set so the checkout page can load Stripe.js (same value can be used as `NEXT_PUBLIC` if you prefer).
4. Use Stripe test cards (e.g. `4242`…) on the Payment Element; confirm **`paid`** on the order page after the webhook runs.

The Next app rewrites **`/api/*`** to the API (see **`API_PROXY_ORIGIN`**) so **cart and order cookies** stay on **http://localhost:3000**.

### Phase 4 — Offers (static JSON, CMS-ready)

- Carousel copy and slide list live in **`apps/web/content/offers.json`** (loaded via **`StaticOffersRepository`** implementing **`IOffersContentRepository`**).
- Homepage **OfferZone** uses CSS variables; try **`/?theme=ocean`** or set **`NEXT_PUBLIC_STORE_THEME=ocean`** for the alternate palette (`stone` is default).
- Swap the repository implementation later for Strapi or another CMS without changing the **`OfferZone`** module contract.

### Troubleshooting

- **`redis: "down"`** — ensure Compose is up; `.env` `REDIS_URL` matches Compose port mapping.
- **DB connection errors** — wait for Postgres health (`docker compose ps`); rerun `npm run db:migrate`.
- **SKIP_REDIS=1** in `.env` makes readiness skip Redis check (offline API dev only).
- **403 on GET /api/orders/:id** — orders are tied to the **rimss_order** cookie set at checkout; use the same browser session.

### Roadmap

`RIMSS_Demo_Build_Plan.md` — further CMS/revalidate tooling, cross-cutting polish, optional Azure demo.
