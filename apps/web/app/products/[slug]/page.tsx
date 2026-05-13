import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { centsToUsd, fetchProductBySlug } from "@/lib/catalog-api";
import { AddToCartButton } from "@/components/AddToCartButton";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const r = await fetchProductBySlug(params.slug);
  if ("error" in r) {
    return { title: "Product — RIMSS demo" };
  }
  return {
    title: `${r.product.name} — RIMSS demo`,
    description: `YCompany — ${r.product.category ?? "style"} · ${centsToUsd(r.product.priceCents)}`,
  };
}

export default async function ProductDetailPage({
  params,
}: PageProps): Promise<JSX.Element> {
  const r = await fetchProductBySlug(params.slug);
  if ("error" in r) {
    if (r.error === "not_found") notFound();
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-sm text-red-800">{r.error}</p>
        <Link href="/products" className="mt-4 inline-block text-sm underline">
          Back to catalogue
        </Link>
      </main>
    );
  }

  const p = r.product;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <nav className="text-sm text-stone-500">
        <Link href="/" className="hover:text-stone-800">
          Home
        </Link>
        <span className="mx-2 text-stone-400">/</span>
        <Link href="/products" className="hover:text-stone-800">
          Catalogue
        </Link>
        <span className="mx-2 text-stone-400">/</span>
        <span className="text-stone-800">{p.slug}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex aspect-square items-center justify-center rounded-2xl border border-stone-200 bg-stone-100">
          {p.imageUrl ? (
            <img
              alt=""
              className="max-h-64 max-w-64 object-contain"
              decoding="async"
              src={p.imageUrl}
            />
          ) : null}
        </div>
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-stone-500">
            {[p.category, p.colour].filter(Boolean).join(" · ") || "Product"}
          </p>
          <h1 className="text-2xl font-semibold text-stone-900">{p.name}</h1>
          <p className="text-xl text-stone-800">
            {centsToUsd(p.priceCents)}
            {p.onSale ? (
              <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-sm font-medium text-emerald-900">
                On sale
              </span>
            ) : null}
          </p>
          <AddToCartButton product={p} />
          <p className="text-sm text-stone-600">
            Free shipping messaging can go here in later phases.
          </p>
          <Link
            href="/products"
            className="inline-block rounded border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            ← Back to catalogue
          </Link>
        </div>
      </div>
    </main>
  );
}
