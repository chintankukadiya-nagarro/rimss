export function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

export interface ProductJson {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  colour: string | null;
  priceCents: number;
  onSale: boolean;
  imageUrl: string | null;
}

export interface SearchResponseBody {
  items: ProductJson[];
  total: number;
  limit: number;
  offset: number;
  query: Record<string, unknown>;
}

export function centsToUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export async function fetchSearch(
  sp: Record<string, string | string[] | undefined>,
): Promise<{ data: SearchResponseBody; headers: Headers } | { error: string }> {
  const base = apiBase();
  const q = new URLSearchParams();

  const one = (k: string): void => {
    const v = sp[k];
    const s = Array.isArray(v) ? v[0] : v;
    if (s !== undefined && s !== "") q.set(k, s);
  };

  one("category");
  one("colour");
  one("sale");
  one("minPrice");
  one("maxPrice");
  one("q");
  one("limit");
  one("offset");

  if (!q.has("limit")) q.set("limit", "12");
  if (!q.has("offset")) q.set("offset", "0");
  const qs = q.toString();
  const url = `${base}/api/products/search${qs ? `?${qs}` : ""}`;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });
    if (!res.ok) return { error: `Search failed (${res.status})` };
    const data = (await res.json()) as SearchResponseBody;
    return { data, headers: res.headers };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Network error calling catalogue API",
    };
  }
}

export async function fetchProductBySlug(
  slug: string,
): Promise<{ product: ProductJson } | { error: string }> {
  const base = apiBase();
  try {
    const res = await fetch(`${base}/api/products/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (res.status === 404) return { error: "not_found" };
    if (!res.ok) return { error: `Load failed (${res.status})` };
    const product = (await res.json()) as ProductJson;
    return { product };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Network error loading product",
    };
  }
}
