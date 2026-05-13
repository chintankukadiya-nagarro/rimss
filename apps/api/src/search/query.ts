import { createHash } from "crypto";

export interface NormalizedSearchQuery {
  category?: string;
  colour?: string;
  onSale?: boolean;
  minPriceCents?: number;
  maxPriceCents?: number;
  q?: string;
  limit: number;
  offset: number;
}

function parseBool(v: unknown): boolean | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const s = String(v).toLowerCase();
  if (s === "1" || s === "true" || s === "yes") return true;
  if (s === "0" || s === "false" || s === "no") return false;
  return undefined;
}

function parseIntSafe(v: unknown, def: number, min: number, max: number): number {
  const n = Number.parseInt(String(v ?? ""), 10);
  if (Number.isNaN(n)) return def;
  return Math.min(max, Math.max(min, n));
}

function parseMoneyToCents(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(String(v));
  if (Number.isNaN(n) || n < 0) return undefined;
  return Math.round(n * 100);
}

/** Parse Express `req.query` into a stable DTO. */
export function normalizeSearchQuery(raw: Record<string, unknown>): NormalizedSearchQuery {
  const category =
    typeof raw.category === "string" && raw.category.trim() !== ""
      ? raw.category.trim().toLowerCase()
      : undefined;
  const colour =
    typeof raw.colour === "string" && raw.colour.trim() !== ""
      ? raw.colour.trim().toLowerCase()
      : undefined;
  const onSale = parseBool(raw.sale ?? raw.onSale);
  const minPriceCents = parseMoneyToCents(raw.minPrice);
  const maxPriceCents = parseMoneyToCents(raw.maxPrice);
  const q =
    typeof raw.q === "string" && raw.q.trim() !== "" ? raw.q.trim().slice(0, 120) : undefined;
  const limit = parseIntSafe(raw.limit, 24, 1, 100);
  const offset = parseIntSafe(raw.offset, 0, 0, 10_000);

  return {
    category,
    colour,
    onSale,
    minPriceCents,
    maxPriceCents,
    q,
    limit,
    offset,
  };
}

export function searchCacheKey(n: NormalizedSearchQuery): string {
  const o: Record<string, unknown> = {
    category: n.category ?? null,
    colour: n.colour ?? null,
    onSale: n.onSale ?? null,
    minPriceCents: n.minPriceCents ?? null,
    maxPriceCents: n.maxPriceCents ?? null,
    q: n.q ?? null,
    limit: n.limit,
    offset: n.offset,
  };
  const stable = JSON.stringify(o, Object.keys(o).sort());
  const h = createHash("sha256").update(stable).digest("hex").slice(0, 32);
  return `rimss:search:v1:${h}`;
}
