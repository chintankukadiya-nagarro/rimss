import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { fetchSearch } from "@/lib/catalog-api";

import ProductFilters from "./ProductFilters";
import ProductGrid from "./ProductGrid";

export const metadata: Metadata = {
  title: "Catalogue — RIMSS demo",
  description: "Faceted catalogue with SSR-backed search",
};

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function ProductsPage({
  searchParams,
}: PageProps): Promise<JSX.Element> {
  const result = await fetchSearch(searchParams);
  let cacheBanner: JSX.Element | null = null;

  if ("error" in result) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-10">
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {result.error}
        </p>
        <Link className="text-sm text-stone-600 underline" href="/products">
          Reset filters
        </Link>
      </main>
    );
  }

  const { data } = result;
  const xh = result.headers?.get?.("x-cache");
  const limit = typeof data.limit === "number" ? data.limit : 12;
  const offset = typeof data.offset === "number" ? data.offset : 0;
  const prevOffset = Math.max(0, offset - limit);
  const nextOffset = offset + limit < data.total ? offset + limit : null;

  cacheBanner =
    xh === "MISS" || xh === "HIT" ? (
      <p className="text-xs text-stone-500">
        Demo cache-aside (<code className="text-stone-600">Redis</code>):{" "}
        <strong className="text-stone-800">X-Cache: {xh}</strong> — run the same
        search twice from the DevTools Network tab.
      </p>
    ) : null;

  const qp = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, raw]) => {
    const val = Array.isArray(raw) ? raw[0] : raw;
    if (val) qp.set(key, val);
  });

  function pageHref(newOffset: number): string {
    const n = new URLSearchParams(qp.toString());
    n.set("limit", String(limit));
    n.set("offset", String(newOffset));
    return `/products?${n.toString()}`;
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <nav className="text-sm text-stone-500">
        <Link href="/" className="hover:text-stone-800">
          Home
        </Link>
        <span className="mx-2 text-stone-400">/</span>
        <span className="text-stone-800">Catalogue</span>
      </nav>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">Browse products</h1>
        <p className="text-sm text-stone-600">
          Faceted search backed by Postgres with optional Redis cache (
          <code className="rounded bg-stone-100 px-1">GET /api/products/search</code>
          ).
        </p>
        {cacheBanner}
      </div>

      <Suspense fallback={<p className="text-sm text-stone-500">Loading filters…</p>}>
        <ProductFilters />
      </Suspense>

      <p className="text-sm text-stone-700">
        <strong>{data.total}</strong> match
        {data.total === 1 ? "" : "es"}
      </p>

      <ProductGrid items={data.items} />

      <div className="flex justify-between gap-4 border-t border-stone-200 pt-4 text-sm">
        {offset > 0 ? (
          <Link
            href={pageHref(prevOffset)}
            className="text-stone-700 underline underline-offset-2 hover:text-stone-900"
          >
            ← Previous page
          </Link>
        ) : (
          <span className="text-stone-400">← Previous</span>
        )}
        {nextOffset !== null ? (
          <Link
            href={pageHref(nextOffset)}
            className="text-stone-700 underline underline-offset-2 hover:text-stone-900"
          >
            Next page →
          </Link>
        ) : (
          <span className="text-stone-400">Next →</span>
        )}
      </div>
    </main>
  );
}
