import Link from "next/link";

export default function ProductNotFound(): JSX.Element {
  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center">
      <p className="text-sm uppercase tracking-wide text-stone-500">
        Catalogue
      </p>
      <h1 className="text-xl font-semibold text-stone-900">Product not found</h1>
      <Link href="/products" className="text-sm font-medium text-stone-700 underline">
        Browse all products
      </Link>
    </main>
  );
}
