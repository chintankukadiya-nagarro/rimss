# RIMSS — fully functional demo build plan

**Goal:** A **single cohesive demo** you can walk through end-to-end to **show every major piece** of the architecture we documented (Next.js host, Express API, relational data, Redis cache-aside, storage/CDN story, adaptors, pluggable offers/CMS path, PSP hand-off, SSR/SEO, tests, CI).

**Principle:** Prefer **one runnable stack** (Docker Compose + seed data) so reviewers see behaviour, not slides only. Cloud services can be **real** (Azure) or **local emulators** where cost/setup blocks you—document which mode you chose.

---

## 1. What “fully functional” must prove (demo script checklist)

Map each item to a **visible UI or API** action you can perform live (or record as a short video).

| # | Capability (from DAR / architecture) | Demo proof |
|---|--------------------------------------|------------|
| 1 | Responsive storefront (SSR/CSR) | Resize browser; show Network tab: first paint from SSR |
| 2 | Listing + **facet search** (category, sale, price range, text, colour) | Filters change URL/query; results update; show **cache hit** (optional header or debug panel) |
| 3 | **PDP** with imagery, discount, price, **add to cart** | Product page; image from blob/local public URL |
| 4 | **Server-authoritative cart** | Refresh page: cart persists; totals from API |
| 5 | **Checkout → PSP adaptor** | Stripe **test** Payment Element or **mock** “Pay” that completes intent |
| 6 | **Catalogue adaptor** | Toggle env: `SEED` data vs **mock HTTP** upstream (show same UI) |
| 7 | **Module Registry + OfferZone** | Home shows offers **plugin** slot; swap variant or theme via config |
| 8 | **Headless CMS path** (optional tier) | **A)** static JSON in repo **B)** Strapi/Sanity dev project; edit slide → refresh shows change (webhook or short TTL) |
| 9 | **Redis cache-aside** | Second identical search: faster / `X-Cache: HIT` style header in dev |
|10 | **Blob / media** | SKU images served from **Azurite** or `/public` fallback; document production = Azure Blob |
|11 | **Auth pattern** | JWT or session cookie from **mock IdP** or Azure AD B2C **dev** tenant (pick one; document) |
|12 | **Observability** | Structured logs + **correlation id** header end-to-end; optional App Insights in Azure slot |
|13 | **CI** | GitHub Action: lint + **unit tests** on domain + at least one API integration test |
|14 | **SEO** | View page source: title/meta; listing route shareable URL |

**Out of scope for demo (per DAR):** native apps, ERP/WMS, full marketing suite, heavy BI, full i18n—**mention** as Phase 2 in README.

---

## 2. Recommended technical shape (matches Tool 1 narrative)

| Layer | Choice for demo |
|-------|-----------------|
| UI host | **Next.js 14** App Router, Tailwind, **Redux Toolkit** + RTK Query to own API |
| Plugins | **OfferZone** + `React.lazy` bundle; register in **Module Registry** |
| API | **Express** (Node 20) behind **Next rewrites** or separate port with CORS—pick one and keep consistent |
| ORM | **Sequelize** → **PostgreSQL** (aligns with your calculator) or SQLite for zero-ops local—**one** prod-like target in README |
| Cache | **Redis** (Docker); code path **no-ops** if Redis down (demo still runs) |
| Media | Local `uploads/` or **Azurite** blob; URLs shaped like production CDN |
| PSP | **Stripe** test keys + webhook route (CLI forward) **or** mock adaptor implementing same interface |
| CMS | Phase 1: **`IOffersContentRepository`** → file JSON; Phase 1b: Strapi **or** Sanity with delivery token in env |
| Secrets | `.env.local` + note **Key Vault** for Azure |

---

## 3. Phased delivery (do in order)

### Phase 0 — Skeleton (1–2 days) — **started in `rimss-demo/`**

Delivered: npm workspaces (`apps/web`, `apps/api`, `packages/shared-types`), **Compose** for Postgres (`5433`) + Redis (`6380`), Sequelize **`Product`** model + **`npm run db:migrate`** (`sync`) + **`npm run db:seed`** (`findOrCreate`, 3 demo rows), **`GET /health`** and **`GET /health/ready`** (DB + Redis; `SKIP_REDIS=1` optional), **`x-request-id`** on API, Next home page SSR-fetches readiness. See **`rimss-demo/README.md`**.

- Monorepo or `apps/web` + `apps/api` (your choice); shared `packages/types` for DTOs.
- Docker Compose: **Postgres + Redis** (+ optional Azurite).
- Health routes, migrate + idempotent seed (**note:** readiness lives at **`GET /health`** and **`GET /health/ready`** on port **4000**; remap to `/api/...` behind BFF or Front Door later if required).

### Phase 1 — Catalogue + search + PDP (core retail)

- Sequelize models: `Product`, facets fields (category, colour, `onSale`, price, etc.).
- Seed **50–200** products (CSV or faker) with **deterministic** data for repeatable demos.
- `GET /api/products/search` with query DTO normalisation → SQL + Redis key.
- Listing page (SSR) + client filter UX; PDP dynamic route `[slug]` or `[id]`.

### Phase 2 — Cart + persistence

- Cart session: cookie **or** anonymous id + DB table `Cart`, `CartLine`.
- Optimistic Redux + **`PUT/PATCH /api/cart`** server merge rules.
- Show **rollback** on intentional 409 test (optional scripted demo).

### Phase 3 — Checkout + PSP adaptor

- **`IPaymentAdaptor`** implementation: Stripe vs `MockPaymentAdaptor`.
- `POST /api/checkout/session` → client secret → success page **`/order/:id`**.
- Webhook verifies signature → updates order status (idempotent handler).

### Phase 4 — Offers plugin + CMS readiness

- `IOffersContentRepository`: **`StaticOffersRepository`** (JSON committed).
- Homepage **OfferZone** renders slides; **theme token** switches CSS vars.
- Optional: Strapi collection `OfferCarousel` + cron or webhook hitting **`POST /api/revalidate/offers`** (Next route) or TTL-only ISR.

### Phase 5 — Cross-cutting demo polish

- `x-request-id` middleware Express + propagate to Sequelize logging.
- **`YCompanyProductApiAdaptor`**: HTTP client with fallback to seed when upstream 500.
- Minimal **Lighthouse** or Playwright smoke in CI (optional).

### Phase 6 — Azure-flavoured demo (optional “MSAG wow”)

- Deploy: **Azure App Service** (web+api containers) **or** Container Apps.
- Wire **Azure Database**, **Azure Cache**, **Blob**, Key Vault refs—mirror your pricing calculator story.

---

## 4. Repository layout (suggested)

```
rimss-demo/
  apps/
    web/                 # Next.js
    api/                 # Express
  packages/
    shared-types/        # Search DTO, OfferCarousel DTO
  infra/
    docker-compose.yml
    prisma-or-sequelize/ # migrations folder if not colocated
  docs/
    DEMO_SCRIPT.md       # step-by-step for presenter
```

---

## 5. Artefacts reviewers expect beside code

| Artefact | Purpose |
|---------|---------|
| `README.md` | One-command up, env vars, diagrams link |
| `DEMO_SCRIPT.md` | Minute-by-minute: “open listing → filter colour → show cache header…” |
| `ARCHITECTURE.md` | Links to MSAG diagrams + maps routes to layers |
| Postman/`openapi.json` | Optional; helps API demos |

---

## 6. Risks & mitigation

| Risk | Mitigation |
|------|------------|
| Scope creep | Lock **Phase 0–3** as MVP demo; CMS + Azure as stretch |
| Stripe / B2C setup time | Start with **mock** adaptor; swap to Stripe test behind flag |
| Redis “required” perception | Implement in-memory LRU fallback for hackathon reviewers |
| Time | Parallelise: FE listing while BE search contract stabilises using mocked JSON |

---

## 7. Success criteria (“done when”)

1. **`docker compose up`** (or documented alternative) brings up app + deps with seed data.
2. You can run through **§1 demo script** table without manual DB edits.
3. At least **`npm test` (or `pnpm test`)** runs **domain** tests + **one** integration test hitting search API with test DB.
4. CI passes on default branch.

---

## 8. Immediate next actions (pick up in Cursor)

1. Confirm **PostgreSQL-only** vs SQLite dev (recommend Postgres in Docker).
2. Scaffold **repo** + Compose + shared types.
3. Implement **Phase 1** search contract first (everything else hangs off catalogue).

---

*This plan aligns with **`docs/DAR_RIMSS_Content.md`** §2 in-scope features and **`docs/CMS_Pluggable_Offers.md`** adaptor pattern.*
