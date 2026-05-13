import Link from "next/link";

import type { ProductJson } from "@/lib/catalog-api";
import { centsToUsd } from "@/lib/catalog-api";

export default function ProductGrid({ items }: { items: ProductJson[] }): JSX.Element {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-sm text-stone-600">
        No matching products — widen filters or clear search.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <li
          key={p.id}
          className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
        >
          <Link className="block" href={`/products/${encodeURIComponent(p.slug)}`}>
            <div className="flex aspect-square items-center justify-center bg-stone-100">
              {p.imageUrl ? (
                <img
                  alt=""
                  className="h-32 w-32 object-contain"
                  decoding="async"
                  height={128}
                  src={p.imageUrl}
                  width={128}
                />
              ) : null}
            </div>
            <div className="space-y-1 p-4">
              <p className="text-xs uppercase tracking-wide text-stone-500">
                {[p.category, p.colour].filter(Boolean).join(" · ") || "SKU"}
              </p>
              <h2 className="text-sm font-medium text-stone-900">{p.name}</h2>
              <p className="text-sm text-stone-800">
                {centsToUsd(p.priceCents)}{" "}
                {p.onSale ? (
                  <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0 text-xs font-medium text-emerald-900">
                    Sale
                  </span>
                ) : null}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
